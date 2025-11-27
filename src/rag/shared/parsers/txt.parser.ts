import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { IDocumentParser, ParsedDocument } from './parser.interface';

@Injectable()
export class TxtParser implements IDocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const content = await fs.readFile(filePath, 'utf-8');

    return {
      content,
      metadata: {
        characterCount: content.length,
        lineCount: content.split('\n').length,
      },
    };
  }
}
