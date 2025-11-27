import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { DocumentChunk } from '../document/entities/document-chunk.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { QueryDto } from './dto/query.dto';
import { ChatResponseDto, SourceDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private llm: ChatOpenAI;

  constructor(
    @InjectRepository(DocumentChunk)
    private readonly chunkRepository: Repository<DocumentChunk>,
    private readonly dataSource: DataSource,
    private readonly embeddingService: EmbeddingService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.llm = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        openAIApiKey: apiKey,
      });
      this.logger.log('Chat service initialized with gpt-3.5-turbo');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured. Chat service will not work.');
    }
  }

  async query(queryDto: QueryDto): Promise<ChatResponseDto> {
    const { question, knowledgeBaseIds, topK = 5 } = queryDto;

    this.logger.log(
      `Processing query for ${knowledgeBaseIds.length} knowledge bases`,
    );

    // Generate embedding for the question
    const queryEmbedding = await this.embeddingService.generateEmbedding(
      question,
    );

    // Retrieve relevant chunks using pgvector similarity search
    const relevantChunks = await this.retrieveRelevantChunks(
      queryEmbedding,
      knowledgeBaseIds,
      topK,
    );

    if (relevantChunks.length === 0) {
      return {
        answer:
          "I couldn't find any relevant information in the knowledge base to answer your question.",
        sources: [],
        knowledgeBasesUsed: knowledgeBaseIds,
      };
    }

    // Build context from chunks
    const context = relevantChunks.map((c) => c.content).join('\n\n');

    // Generate answer using LLM
    const answer = await this.generateAnswer(question, context);

    // Format sources
    const sources: SourceDto[] = relevantChunks.map((chunk) => ({
      documentId: chunk.document.id,
      documentName: chunk.document.originalName,
      chunkContent: chunk.content,
      relevanceScore: chunk.similarity,
      metadata: chunk.metadata || {},
    }));

    return {
      answer,
      sources,
      knowledgeBasesUsed: knowledgeBaseIds,
    };
  }

  private async retrieveRelevantChunks(
    queryEmbedding: number[],
    knowledgeBaseIds: string[],
    topK: number,
  ): Promise<any[]> {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const query = `
      SELECT
        c.id,
        c.content,
        c.metadata,
        c.chunk_index as "chunkIndex",
        d.id as "document.id",
        d.original_name as "document.originalName",
        1 - (c.embedding <=> $1::vector) as similarity
      FROM document_chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE d.knowledge_base_id = ANY($2)
        AND d.status = 'ready'
      ORDER BY c.embedding <=> $1::vector
      LIMIT $3
    `;

    const results = await this.dataSource.query(query, [
      embeddingStr,
      knowledgeBaseIds,
      topK,
    ]);

    // Transform flat results to nested structure
    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      chunkIndex: row.chunkIndex,
      similarity: parseFloat(row.similarity),
      document: {
        id: row['document.id'],
        originalName: row['document.originalName'],
      },
    }));
  }

  private async generateAnswer(
    question: string,
    context: string,
  ): Promise<string> {
    if (!this.llm) {
      throw new Error('LLM not initialized. Check OPENAI_API_KEY.');
    }

    const prompt = `You are a helpful assistant that answers questions based on the provided context.

Context:
${context}

Question: ${question}

Instructions:
- Answer the question based ONLY on the information provided in the context above.
- If the context doesn't contain enough information to answer the question, say so.
- Be concise and accurate.
- Cite specific parts of the context when relevant.

Answer:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
