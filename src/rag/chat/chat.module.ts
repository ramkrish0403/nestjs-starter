import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DocumentModule } from '../document/document.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [DocumentModule, EmbeddingModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
