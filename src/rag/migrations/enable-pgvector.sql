-- Run this SQL to enable pgvector extension
-- Execute with: psql -U app_user -d app_db -f enable-pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- After entities are synced, run this to create the similarity search index:
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
-- ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
