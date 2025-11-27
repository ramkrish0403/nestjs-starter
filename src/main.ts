import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable pgvector extension and setup vector column
  const dataSource = app.get(DataSource);
  try {
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('pgvector extension enabled');

    // Convert embedding column to vector type if needed
    await dataSource.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'document_chunks' AND column_name = 'embedding'
        ) THEN
          ALTER TABLE document_chunks
          ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector;
        END IF;
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `);

    // Create index for similarity search
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
      ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);

    console.log('pgvector column and index configured');
  } catch (error) {
    console.warn('pgvector setup warning:', error.message);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
