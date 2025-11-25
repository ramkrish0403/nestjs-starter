import { Controller, Post, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  private transports: Map<string, SSEServerTransport> = new Map();

  constructor(private readonly mcpService: McpService) {}

  @Get('sse')
  async handleSse(@Res() res: Response) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const transport = new SSEServerTransport('/mcp/messages', res);
    const sessionId = transport.sessionId;
    this.transports.set(sessionId, transport);

    // Clean up on close
    res.on('close', () => {
      this.transports.delete(sessionId);
    });

    await this.mcpService.getServer().connect(transport);
  }

  @Post('messages')
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.query.sessionId as string;
    const transport = this.transports.get(sessionId);

    if (!transport) {
      res.status(400).json({ error: 'Invalid or missing sessionId' });
      return;
    }

    await transport.handlePostMessage(req, res);
  }
}
