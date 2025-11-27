import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { QueryDto } from './dto/query.dto';

@Controller('rag/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  query(@Body() queryDto: QueryDto) {
    return this.chatService.query(queryDto);
  }
}
