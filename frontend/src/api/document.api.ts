import { api } from './index';

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  chunkCount: number;
  errorMessage?: string;
  knowledgeBaseId: string;
  createdAt: string;
  updatedAt: string;
}

export const documentApi = {
  upload: (knowledgeBaseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Document>(`/rag/documents/upload/${knowledgeBaseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getByKnowledgeBase: (knowledgeBaseId: string) =>
    api.get<Document[]>(`/rag/documents/knowledge-base/${knowledgeBaseId}`),
  getOne: (id: string) => api.get<Document>(`/rag/documents/${id}`),
  delete: (id: string) => api.delete(`/rag/documents/${id}`),
};
