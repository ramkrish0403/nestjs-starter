import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { IDocumentParser, ParsedDocument } from './parser.interface';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfParser implements IDocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const buffer = await fs.readFile(filePath);
    // pdf-parse default export needs .default in some cases
    const parser = pdfParse.default || pdfParse;
    const data = await parser(buffer);

    return {
      content: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info,
      },
    };
  }
}
