<template>
  <div class="knowledge-base-view">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Panel: Knowledge Bases List -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Knowledge Bases</h2>
          <button
            @click="showCreateModal = true"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New
          </button>
        </div>

        <div v-if="loading && !knowledgeBases.length" class="text-center text-gray-500 py-8">
          Loading...
        </div>

        <div v-else-if="!knowledgeBases.length" class="text-center text-gray-500 py-8">
          No knowledge bases yet. Create one to get started.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="kb in knowledgeBases"
            :key="kb.id"
            @click="selectKb(kb.id)"
            :class="[
              'p-4 border rounded cursor-pointer transition',
              selectedKnowledgeBase?.id === kb.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300',
            ]"
          >
            <h3 class="font-semibold text-gray-900">{{ kb.name }}</h3>
            <p v-if="kb.description" class="text-sm text-gray-600 mt-1">
              {{ kb.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Selected KB Details -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <div v-if="!selectedKnowledgeBase" class="text-center text-gray-500 py-16">
          Select a knowledge base to view documents
        </div>

        <div v-else>
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold">{{ selectedKnowledgeBase.name }}</h2>
              <p v-if="selectedKnowledgeBase.description" class="text-gray-600 mt-1">
                {{ selectedKnowledgeBase.description }}
              </p>
            </div>
            <button
              @click="confirmDelete(selectedKnowledgeBase.id)"
              class="text-red-600 hover:text-red-800"
            >
              Delete KB
            </button>
          </div>

          <!-- Document Upload -->
          <div class="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              accept=".pdf,.txt,.csv,.json"
              class="hidden"
            />
            <button
              @click="() => fileInput?.click()"
              :disabled="loading"
              class="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {{ loading ? 'Uploading & Processing...' : 'Upload Document' }}
            </button>
            <p class="text-sm text-gray-500 mt-2">
              Supported: PDF, TXT, CSV, JSON (max 10MB)
            </p>
          </div>

          <!-- Documents List -->
          <h3 class="text-lg font-semibold mb-4">Documents ({{ documents.length }})</h3>

          <div v-if="!documents.length" class="text-center text-gray-500 py-8">
            No documents uploaded yet
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="border border-gray-200 rounded p-4 hover:border-gray-300"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-medium">{{ doc.originalName }}</h4>
                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{{ formatFileSize(doc.fileSize) }}</span>
                    <span :class="getStatusColor(doc.status)">
                      {{ doc.status.toUpperCase() }}
                    </span>
                    <span v-if="doc.status === 'ready'">{{ doc.chunkCount }} chunks</span>
                  </div>
                  <p v-if="doc.errorMessage" class="text-sm text-red-600 mt-1">
                    Error: {{ doc.errorMessage }}
                  </p>
                </div>
                <button
                  @click="deleteDoc(doc.id)"
                  class="text-red-600 hover:text-red-800 ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Knowledge Base Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Create Knowledge Base</h3>
        <form @submit.prevent="createKb">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              v-model="newKb.name"
              type="text"
              required
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              v-model="newKb.description"
              rows="3"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useKnowledgeBaseStore } from '../stores/knowledgeBase';

const store = useKnowledgeBaseStore();
const { knowledgeBases, selectedKnowledgeBase, documents, loading } = storeToRefs(store);

const showCreateModal = ref(false);
const newKb = ref({ name: '', description: '' });
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  store.fetchKnowledgeBases();
});

const selectKb = async (id: string) => {
  await store.selectKnowledgeBase(id);
};

const createKb = async () => {
  try {
    await store.createKnowledgeBase(newKb.value);
    showCreateModal.value = false;
    newKb.value = { name: '', description: '' };
  } catch (error) {
    alert('Failed to create knowledge base');
  }
};

const confirmDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this knowledge base and all its documents?')) {
    try {
      await store.deleteKnowledgeBase(id);
    } catch (error) {
      alert('Failed to delete knowledge base');
    }
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !selectedKnowledgeBase.value) return;

  try {
    await store.uploadDocument(selectedKnowledgeBase.value.id, file);
    alert('Document uploaded and processed successfully!');
  } catch (error) {
    alert('Failed to upload document. Check file type and size.');
  } finally {
    target.value = '';
  }
};

const deleteDoc = async (id: string) => {
  if (confirm('Are you sure you want to delete this document?')) {
    try {
      await store.deleteDocument(id);
    } catch (error) {
      alert('Failed to delete document');
    }
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ready: 'text-green-600',
    processing: 'text-blue-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600',
  };
  return colors[status] || 'text-gray-600';
};
</script>
