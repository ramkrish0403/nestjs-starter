import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  knowledgeBaseApi,
  type KnowledgeBase,
  type CreateKnowledgeBaseDto,
} from '../api/knowledgeBase.api';
import { documentApi, type Document } from '../api/document.api';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  const knowledgeBases = ref<KnowledgeBase[]>([]);
  const selectedKnowledgeBase = ref<KnowledgeBase | null>(null);
  const documents = ref<Document[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchKnowledgeBases() {
    loading.value = true;
    error.value = null;
    try {
      const response = await knowledgeBaseApi.getAll();
      knowledgeBases.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge bases';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function selectKnowledgeBase(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const [kbResponse, docsResponse] = await Promise.all([
        knowledgeBaseApi.getOne(id),
        documentApi.getByKnowledgeBase(id),
      ]);
      selectedKnowledgeBase.value = kbResponse.data;
      documents.value = docsResponse.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load knowledge base';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createKnowledgeBase(data: CreateKnowledgeBaseDto) {
    loading.value = true;
    error.value = null;
    try {
      const response = await knowledgeBaseApi.create(data);
      knowledgeBases.value.push(response.data);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge base';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteKnowledgeBase(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await knowledgeBaseApi.delete(id);
      knowledgeBases.value = knowledgeBases.value.filter((kb) => kb.id !== id);
      if (selectedKnowledgeBase.value?.id === id) {
        selectedKnowledgeBase.value = null;
        documents.value = [];
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge base';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function uploadDocument(knowledgeBaseId: string, file: File) {
    loading.value = true;
    error.value = null;
    try {
      const response = await documentApi.upload(knowledgeBaseId, file);
      documents.value.push(response.data);
      await selectKnowledgeBase(knowledgeBaseId);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to upload document';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDocument(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await documentApi.delete(id);
      documents.value = documents.value.filter((doc) => doc.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete document';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    knowledgeBases,
    selectedKnowledgeBase,
    documents,
    loading,
    error,
    fetchKnowledgeBases,
    selectKnowledgeBase,
    createKnowledgeBase,
    deleteKnowledgeBase,
    uploadDocument,
    deleteDocument,
  };
});
