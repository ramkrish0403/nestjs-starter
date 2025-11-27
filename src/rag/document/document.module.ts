import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { SharedModule } from '../shared/shared.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    MulterModule.register({
      dest: './uploads',
    }),
    KnowledgeBaseModule,
    SharedModule,
    EmbeddingModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService, TypeOrmModule],
})
export class DocumentModule {}
