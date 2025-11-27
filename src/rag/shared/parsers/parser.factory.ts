import { Injectable, BadRequestException } from '@nestjs/common';
import { IDocumentParser } from './parser.interface';
import { PdfParser } from './pdf.parser';
import { TxtParser } from './txt.parser';
import { CsvParser } from './csv.parser';
import { JsonParser } from './json.parser';

@Injectable()
export class ParserFactory {
  constructor(
    private readonly pdfParser: PdfParser,
    private readonly txtParser: TxtParser,
    private readonly csvParser: CsvParser,
    private readonly jsonParser: JsonParser,
  ) {}

  getParser(mimeType: string): IDocumentParser {
    switch (mimeType) {
      case 'application/pdf':
        return this.pdfParser;
      case 'text/plain':
        return this.txtParser;
      case 'text/csv':
        return this.csvParser;
      case 'application/json':
        return this.jsonParser;
      default:
        throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
  }
}
