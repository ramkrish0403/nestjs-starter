import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { ItemsModule } from './items/items.module';
import { McpModule } from './mcp/mcp.module';
import { LanggraphModule } from './langgraph/langgraph.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    ItemsModule,
    McpModule,
    LanggraphModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
