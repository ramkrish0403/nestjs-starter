# RAG Knowledge Base System

A full-stack RAG (Retrieval-Augmented Generation) application with document upload, vector search, and AI-powered Q&A.

## Features

- **Knowledge Base Management**: Create and manage multiple knowledge bases
- **Document Upload**: Support for PDF, TXT, CSV, and JSON files (max 10MB)
- **Vector Search**: Uses PostgreSQL with pgvector for semantic similarity search
- **AI-Powered Chat**: Query documents using OpenAI GPT-3.5-turbo with context-aware responses
- **Source Attribution**: View which document chunks were used to generate answers

## Tech Stack

### Backend
- **NestJS** (TypeScript)
- **PostgreSQL** with **pgvector** extension
- **TypeORM** for database management
- **OpenAI** for embeddings (text-embedding-ada-002) and LLM (gpt-3.5-turbo)
- **LangChain** for AI orchestration

### Frontend
- **Vue 3** (TypeScript) + **Vite**
- **TailwindCSS** for styling
- **Pinia** for state management
- **Axios** for API calls

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL with pgvector extension (included in Docker setup)
- OpenAI API key

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Backend
OPENAI_API_KEY=your_openai_api_key_here

# Database (already configured in docker-compose)
NJS_POSTGRES_DB=app_db
NJS_POSTGRES_USER=app_user
NJS_POSTGRES_PASSWORD=app_password
NJS_POSTGRES_HOST=njs_postgres_db
```

### 2. Start Backend

```bash
# Install dependencies (already done)
npm install

# Build backend
npm run build

# Start in development mode
npm run start:dev
```

The backend will run on **http://localhost:3000**

### 3. Start Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The frontend will run on **http://localhost:5173**

**Note for Dev Container Users:**
- Backend port 3000 is exposed as 3001 on the host machine
- The frontend is configured to use `http://localhost:3001` (via `.env` file)
- If running frontend inside the container, change `VITE_API_URL` to `http://localhost:3000`

## Usage Guide

### 1. Knowledge Base Management Tab

1. **Create a Knowledge Base**
   - Click "+ New" button
   - Enter name and optional description
   - Click "Create"

2. **Upload Documents**
   - Select a knowledge base from the list
   - Click "Upload Document"
   - Choose a file (PDF, TXT, CSV, or JSON)
   - Wait for processing (parsing → chunking → embedding → indexing)

3. **View Documents**
   - See all uploaded documents with their status
   - View chunk count and file size
   - Delete documents as needed

### 2. Chat Interface Tab

1. **Select Knowledge Bases**
   - Check one or more knowledge bases to query
   - You can search across multiple KBs simultaneously

2. **Ask Questions**
   - Type your question in the input box
   - Click "Send" or press Enter
   - View AI-generated answer with source attribution

3. **View Sources**
   - Click on any source link to see the exact content used
   - Sources show relevance score (similarity percentage)
   - Right panel displays detailed chunk content

## API Endpoints

### Knowledge Bases
- `GET /rag/knowledge-bases` - List all knowledge bases
- `POST /rag/knowledge-bases` - Create new knowledge base
- `GET /rag/knowledge-bases/:id` - Get knowledge base details
- `PATCH /rag/knowledge-bases/:id` - Update knowledge base
- `DELETE /rag/knowledge-bases/:id` - Delete knowledge base

### Documents
- `POST /rag/documents/upload/:knowledgeBaseId` - Upload and process document
- `GET /rag/documents/knowledge-base/:id` - List documents in KB
- `GET /rag/documents/:id` - Get document details
- `DELETE /rag/documents/:id` - Delete document

### Chat
- `POST /rag/chat/query` - Query knowledge bases with a question

## How It Works

### Document Processing Pipeline

1. **Upload**: File saved to `/uploads` directory
2. **Parse**: Extract text content based on file type
   - PDF: Uses `pdf-parse` library
   - TXT: Direct file read
   - CSV: Converts rows to readable text format
   - JSON: Flattens structure into text
3. **Chunk**: Split text into 1000-character chunks with 200-character overlap
4. **Embed**: Generate vector embeddings using OpenAI text-embedding-ada-002
5. **Store**: Save chunks and embeddings to PostgreSQL with pgvector

### RAG Query Flow

1. **Embed Question**: Convert user question to vector embedding
2. **Vector Search**: Use pgvector cosine similarity to find top 5 relevant chunks
3. **Build Context**: Combine chunk content into context string
4. **Generate Answer**: Pass question + context to GPT-3.5-turbo
5. **Return Response**: Send answer with source attribution to frontend

## Database Schema

### knowledge_bases
- `id` (UUID)
- `name` (unique)
- `description`
- `createdAt`, `updatedAt`

### documents
- `id` (UUID)
- `filename`, `originalName`, `mimeType`, `fileSize`
- `status` (pending | processing | ready | failed)
- `chunkCount`, `errorMessage`
- `knowledgeBaseId` (foreign key)
- `createdAt`, `updatedAt`

### document_chunks
- `id` (UUID)
- `content` (text)
- `embedding` (vector(1536)) - pgvector column
- `chunkIndex`, `metadata` (JSONB)
- `documentId` (foreign key)
- `createdAt`

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running (`docker ps`)
- Check `OPENAI_API_KEY` is set in `.env`
- Run `npm run build` to check for TypeScript errors

### Document upload fails
- Check file size (max 10MB)
- Verify file type (PDF, TXT, CSV, JSON only)
- Check backend logs for parsing errors

### pgvector extension error
- The app automatically enables pgvector on startup
- If it fails, manually run: `CREATE EXTENSION IF NOT EXISTS vector;`

### No results from chat queries
- Ensure documents are in "ready" status
- Check that knowledge bases are selected
- Verify `OPENAI_API_KEY` is valid

## Development Notes

- Backend uses synchronous document processing (blocking during upload)
- Chunking strategy: 1000 chars with 200 overlap using recursive splitting
- Vector similarity uses cosine distance (`<=>` operator)
- CORS enabled for localhost:5173 (frontend) and localhost:3000

## License

MIT
