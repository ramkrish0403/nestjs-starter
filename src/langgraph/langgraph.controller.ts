import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { LanggraphService } from './langgraph.service';
import { ProcessEmailDto } from './dto/process-email.dto';

@Controller('langgraph')
export class LanggraphController {
  constructor(private readonly langgraphService: LanggraphService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      workflowAvailable: this.langgraphService.isAvailable(),
    };
  }

  @Post('process-email')
  async processEmail(@Body() dto: ProcessEmailDto) {
    if (!this.langgraphService.isAvailable()) {
      throw new HttpException(
        'LangGraph workflow not available. Check OPEN_ROUTER_API_KEY configuration.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const result = await this.langgraphService.processEmail({
        emailContent: dto.emailContent,
        senderEmail: dto.senderEmail,
        emailId: dto.emailId,
      });

      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to process email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
