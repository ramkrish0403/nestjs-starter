import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddings: OpenAIEmbeddings;
  private readonly batchSize = 100;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not configured. Embedding service will not work.',
      );
      return;
    }

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
      openAIApiKey: apiKey,
    });

    this.logger.log('Embedding service initialized with text-embedding-ada-002');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddings) {
      throw new Error('Embedding service not initialized. Check OPENAI_API_KEY.');
    }

    return this.embeddings.embedQuery(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.embeddings) {
      throw new Error('Embedding service not initialized. Check OPENAI_API_KEY.');
    }

    const allEmbeddings: number[][] = [];

    // Process in batches to avoid API limits
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      this.logger.debug(
        `Processing embedding batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(texts.length / this.batchSize)}`,
      );

      const batchEmbeddings = await this.embeddings.embedDocuments(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }
}
