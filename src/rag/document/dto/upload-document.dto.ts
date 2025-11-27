import { IsUUID } from 'class-validator';

export class UploadDocumentParamsDto {
  @IsUUID()
  knowledgeBaseId: string;
}
