import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [ItemsModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
