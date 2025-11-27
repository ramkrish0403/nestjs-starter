import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  // pgvector column - stored as string, handled via raw SQL for similarity search
  // The vector(1536) type matches OpenAI text-embedding-ada-002 dimensions
  @Column({ type: 'text', nullable: true })
  embedding: string;

  @Column({ type: 'int' })
  chunkIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Document, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'document_id' })
  @Index()
  documentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
