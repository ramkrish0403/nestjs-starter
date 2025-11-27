import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { IDocumentParser, ParsedDocument } from './parser.interface';

@Injectable()
export class JsonParser implements IDocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Convert JSON to readable text format
    const content = this.jsonToText(data);

    return {
      content,
      metadata: {
        type: Array.isArray(data) ? 'array' : 'object',
        itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
      },
    };
  }

  private jsonToText(data: any, prefix = ''): string {
    const lines: string[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${prefix}Item ${index + 1}:`);
          lines.push(this.jsonToText(item, prefix + '  '));
        } else {
          lines.push(`${prefix}Item ${index + 1}: ${item}`);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          lines.push(`${prefix}${key}:`);
          lines.push(this.jsonToText(value, prefix + '  '));
        } else {
          lines.push(`${prefix}${key}: ${value}`);
        }
      }
    } else {
      lines.push(`${prefix}${data}`);
    }

    return lines.join('\n');
  }
}
