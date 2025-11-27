import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentService } from './document.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('rag/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload/:knowledgeBaseId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed types: PDF, TXT, CSV, JSON`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadDocument(
    @Param('knowledgeBaseId', ParseUUIDPipe) knowledgeBaseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.documentService.uploadAndProcess(file, knowledgeBaseId);
  }

  @Get('knowledge-base/:knowledgeBaseId')
  findByKnowledgeBase(
    @Param('knowledgeBaseId', ParseUUIDPipe) knowledgeBaseId: string,
  ) {
    return this.documentService.findByKnowledgeBase(knowledgeBaseId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.remove(id);
  }
}
