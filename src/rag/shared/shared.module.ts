import { Module } from '@nestjs/common';
import { ParserFactory } from './parsers/parser.factory';
import { PdfParser } from './parsers/pdf.parser';
import { TxtParser } from './parsers/txt.parser';
import { CsvParser } from './parsers/csv.parser';
import { JsonParser } from './parsers/json.parser';
import { ChunkingService } from './chunking/chunking.service';

@Module({
  providers: [
    ParserFactory,
    PdfParser,
    TxtParser,
    CsvParser,
    JsonParser,
    ChunkingService,
  ],
  exports: [ParserFactory, ChunkingService],
})
export class SharedModule {}
