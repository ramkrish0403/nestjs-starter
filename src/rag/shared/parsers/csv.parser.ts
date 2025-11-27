import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { IDocumentParser, ParsedDocument } from './parser.interface';

@Injectable()
export class CsvParser implements IDocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, any>[];

    // Convert CSV rows to readable text format
    const lines: string[] = [];

    if (records.length > 0) {
      const headers = Object.keys(records[0]);
      lines.push(`Columns: ${headers.join(', ')}`);
      lines.push('');

      for (const record of records) {
        const row = headers.map((h) => `${h}: ${record[h]}`).join(' | ');
        lines.push(row);
      }
    }

    return {
      content: lines.join('\n'),
      metadata: {
        rowCount: records.length,
        columns: records.length > 0 ? Object.keys(records[0]) : [],
      },
    };
  }
}
