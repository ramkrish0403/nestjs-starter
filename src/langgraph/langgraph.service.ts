import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createEmailAgentWorkflow,
  EmailAgentStateType,
} from './workflow/email-agent.workflow';

export interface ProcessEmailInput {
  emailContent: string;
  senderEmail: string;
  emailId?: string;
}

export interface ProcessEmailResult {
  emailId: string;
  status: string;
  classification?: {
    intent: string;
    urgency: string;
    topic: string;
    summary: string;
  };
  responseText?: string;
  searchResults?: string[];
}

@Injectable()
export class LanggraphService implements OnModuleInit {
  private readonly logger = new Logger(LanggraphService.name);
  private workflow: ReturnType<typeof createEmailAgentWorkflow> | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPEN_ROUTER_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'OPEN_ROUTER_API_KEY not configured. LangGraph workflow will not be available.',
      );
      return;
    }

    this.logger.log('Initializing LangGraph email agent workflow...');
    this.workflow = createEmailAgentWorkflow();
    this.logger.log('LangGraph workflow initialized successfully');
  }

  async processEmail(input: ProcessEmailInput): Promise<ProcessEmailResult> {
    if (!this.workflow) {
      throw new Error(
        'LangGraph workflow not initialized. Check OPEN_ROUTER_API_KEY configuration.',
      );
    }

    const emailId = input.emailId || `email-${Date.now()}`;

    this.logger.log(`Processing email ${emailId} from ${input.senderEmail}`);

    const initialState: Partial<EmailAgentStateType> = {
      emailContent: input.emailContent,
      senderEmail: input.senderEmail,
      emailId,
    };

    try {
      // Run the workflow
      const result = await this.workflow.invoke(initialState);

      this.logger.log(`Email ${emailId} processed with status: ${result.status}`);

      return {
        emailId,
        status: result.status || 'unknown',
        classification: result.classification,
        responseText: result.responseText,
        searchResults: result.searchResults,
      };
    } catch (error) {
      this.logger.error(`Failed to process email ${emailId}:`, error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.workflow !== null;
  }
}
