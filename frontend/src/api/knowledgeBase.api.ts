import { api } from './index';

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseDto {
  name: string;
  description?: string;
}

export const knowledgeBaseApi = {
  getAll: () => api.get<KnowledgeBase[]>('/rag/knowledge-bases'),
  getOne: (id: string) => api.get<KnowledgeBase>(`/rag/knowledge-bases/${id}`),
  create: (data: CreateKnowledgeBaseDto) =>
    api.post<KnowledgeBase>('/rag/knowledge-bases', data),
  update: (id: string, data: Partial<CreateKnowledgeBaseDto>) =>
    api.patch<KnowledgeBase>(`/rag/knowledge-bases/${id}`, data),
  delete: (id: string) => api.delete(`/rag/knowledge-bases/${id}`),
};
