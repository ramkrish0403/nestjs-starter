<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-gray-900">RAG Knowledge Base System</h1>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- Tab Navigation -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'kb'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'kb'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            Knowledge Base Management
          </button>
          <button
            @click="activeTab = 'chat'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            Chat Interface
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <KnowledgeBaseView v-if="activeTab === 'kb'" />
      <ChatView v-else-if="activeTab === 'chat'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import KnowledgeBaseView from './views/KnowledgeBaseView.vue';
import ChatView from './views/ChatView.vue';

const activeTab = ref<'kb' | 'chat'>('kb');
</script>
