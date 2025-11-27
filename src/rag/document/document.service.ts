import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Document, DocumentStatus } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { ParserFactory } from '../shared/parsers/parser.factory';
import { ChunkingService } from '../shared/chunking/chunking.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly chunkRepository: Repository<DocumentChunk>,
    private readonly dataSource: DataSource,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly parserFactory: ParserFactory,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.ensureUploadsDirExists();
  }

  private async ensureUploadsDirExists() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create uploads directory', error);
    }
  }

  async uploadAndProcess(
    file: Express.Multer.File,
    knowledgeBaseId: string,
  ): Promise<Document> {
    // Verify knowledge base exists
    await this.knowledgeBaseService.findOne(knowledgeBaseId);

    // Create document record
    const document = this.documentRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      knowledgeBaseId,
      status: DocumentStatus.PROCESSING,
    });

    await this.documentRepository.save(document);

    try {
      // Parse document
      this.logger.log(`Parsing document: ${document.originalName}`);
      const parser = this.parserFactory.getParser(file.mimetype);
      const parsedContent = await parser.parse(file.path);

      // Chunk content
      this.logger.log(`Chunking document: ${document.originalName}`);
      const chunks = this.chunkingService.chunk(parsedContent.content);

      if (chunks.length === 0) {
        throw new BadRequestException('Document has no extractable content');
      }

      // Generate embeddings
      this.logger.log(
        `Generating embeddings for ${chunks.length} chunks: ${document.originalName}`,
      );
      const embeddings = await this.embeddingService.generateEmbeddings(
        chunks.map((c) => c.content),
      );

      // Store chunks with embeddings using raw SQL for pgvector
      this.logger.log(`Storing ${chunks.length} chunks with embeddings`);
      await this.storeChunksWithEmbeddings(document.id, chunks, embeddings);

      // Update document status
      document.status = DocumentStatus.READY;
      document.chunkCount = chunks.length;
      await this.documentRepository.save(document);

      this.logger.log(`Document processed successfully: ${document.originalName}`);
      return document;
    } catch (error) {
      this.logger.error(`Failed to process document: ${document.originalName}`, error);
      document.status = DocumentStatus.FAILED;
      document.errorMessage = error.message;
      await this.documentRepository.save(document);
      throw error;
    }
  }

  private async storeChunksWithEmbeddings(
    documentId: string,
    chunks: { content: string; metadata: Record<string, any> }[],
    embeddings: number[][],
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const embeddingStr = `[${embedding.join(',')}]`;

        await queryRunner.query(
          `INSERT INTO document_chunks (id, content, embedding, chunk_index, metadata, document_id, "createdAt")
           VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, $5, NOW())`,
          [
            chunk.content,
            embeddingStr,
            i,
            JSON.stringify(chunk.metadata),
            documentId,
          ],
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByKnowledgeBase(knowledgeBaseId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { knowledgeBaseId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return document;
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    // Delete file from disk
    try {
      const filePath = path.join(this.uploadsDir, document.filename);
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${document.filename}`, error);
    }

    await this.documentRepository.remove(document);
  }
}
