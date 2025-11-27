import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { IDocumentParser, ParsedDocument } from './parser.interface';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

@Injectable()
export class PdfParser implements IDocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const buffer = await fs.readFile(filePath);

    // pdf-parse v2 requires instantiation with new and data parameter
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    return {
      content: result.text,
      metadata: {
        pageCount: result.numPages || 0,
        info: result.info || {},
      },
    };
  }
}
