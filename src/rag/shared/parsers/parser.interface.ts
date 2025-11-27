export interface ParsedDocument {
  content: string;
  metadata: Record<string, any>;
}

export interface IDocumentParser {
  parse(filePath: string): Promise<ParsedDocument>;
}
