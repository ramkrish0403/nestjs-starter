import { Injectable } from '@nestjs/common';

export interface TextChunk {
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
    chunkIndex: number;
  };
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

@Injectable()
export class ChunkingService {
  private readonly defaultChunkSize = 1000;
  private readonly defaultChunkOverlap = 200;
  private readonly defaultSeparators = ['\n\n', '\n', '. ', ' '];

  chunk(text: string, options?: ChunkingOptions): TextChunk[] {
    const chunkSize = options?.chunkSize ?? this.defaultChunkSize;
    const chunkOverlap = options?.chunkOverlap ?? this.defaultChunkOverlap;
    const separators = options?.separators ?? this.defaultSeparators;

    const chunks: TextChunk[] = [];
    const splits = this.recursiveSplit(text, separators, chunkSize);

    let currentChunk = '';
    let currentStartIndex = 0;
    let chunkIndex = 0;

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];

      if (currentChunk.length + split.length <= chunkSize) {
        currentChunk += split;
      } else {
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              startIndex: currentStartIndex,
              endIndex: currentStartIndex + currentChunk.length,
              chunkIndex: chunkIndex++,
            },
          });
        }

        // Calculate overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentStartIndex =
          currentStartIndex + currentChunk.length - overlapText.length;
        currentChunk = overlapText + split;
      }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          startIndex: currentStartIndex,
          endIndex: currentStartIndex + currentChunk.length,
          chunkIndex: chunkIndex,
        },
      });
    }

    return chunks;
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    chunkSize: number,
  ): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const separator = separators[0];
    const remainingSeparators = separators.slice(1);

    const splits = text.split(separator);
    const result: string[] = [];

    for (const split of splits) {
      if (split.length <= chunkSize) {
        result.push(split + (separator !== ' ' ? separator : ' '));
      } else if (remainingSeparators.length > 0) {
        result.push(
          ...this.recursiveSplit(split, remainingSeparators, chunkSize),
        );
      } else {
        // Force split at chunkSize if no separators work
        for (let i = 0; i < split.length; i += chunkSize) {
          result.push(split.slice(i, i + chunkSize));
        }
      }
    }

    return result;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text;
    }
    return text.slice(-overlapSize);
  }
}
