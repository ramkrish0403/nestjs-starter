import { Module } from '@nestjs/common';
import { LanggraphController } from './langgraph.controller';
import { LanggraphService } from './langgraph.service';

@Module({
  controllers: [LanggraphController],
  providers: [LanggraphService],
  exports: [LanggraphService],
})
export class LanggraphModule {}
