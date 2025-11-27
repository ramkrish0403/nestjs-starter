import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { DocumentModule } from './document/document.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { ChatModule } from './chat/chat.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    KnowledgeBaseModule,
    DocumentModule,
    EmbeddingModule,
    ChatModule,
    SharedModule,
  ],
})
export class RagModule {}
