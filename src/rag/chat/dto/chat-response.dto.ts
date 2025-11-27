export interface SourceDto {
  documentId: string;
  documentName: string;
  chunkContent: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

export interface ChatResponseDto {
  answer: string;
  sources: SourceDto[];
  knowledgeBasesUsed: string[];
}
