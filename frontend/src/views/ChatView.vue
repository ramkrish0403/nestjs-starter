<template>
  <div class="chat-view h-[calc(100vh-12rem)]">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      <!-- Left Sidebar: KB Selector -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow p-6 overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Select Knowledge Bases</h2>

        <div v-if="!knowledgeBases.length" class="text-gray-500 text-sm">
          No knowledge bases available. Create one in the KB Management tab.
        </div>

        <div v-else class="space-y-2">
          <label
            v-for="kb in knowledgeBases"
            :key="kb.id"
            class="flex items-start p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :value="kb.id"
              :checked="selectedKnowledgeBaseIds.includes(kb.id)"
              @change="toggleKb(kb.id)"
              class="mt-1 mr-3"
            />
            <div class="flex-1">
              <div class="font-medium">{{ kb.name }}</div>
              <div v-if="kb.description" class="text-sm text-gray-600 mt-1">
                {{ kb.description }}
              </div>
            </div>
          </label>
        </div>

        <div v-if="selectedKnowledgeBaseIds.length > 0" class="mt-4 pt-4 border-t">
          <button
            @click="clearChat"
            class="w-full text-sm text-red-600 hover:text-red-800"
          >
            Clear Chat
          </button>
        </div>
      </div>

      <!-- Center: Chat Messages -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow flex flex-col h-full">
        <!-- Messages Area -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            v-if="!messages.length"
            class="text-center text-gray-500 py-16"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p>Select knowledge bases and start asking questions!</p>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex',
              message.type === 'user' ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'max-w-[80%] rounded-lg p-4',
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900',
              ]"
            >
              <div class="whitespace-pre-wrap">{{ message.content }}</div>
              <div
                v-if="message.sources && message.sources.length > 0"
                class="mt-3 pt-3 border-t border-gray-300"
              >
                <div class="text-sm font-semibold mb-2">
                  Sources ({{ message.sources.length }}):
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(source, idx) in message.sources"
                    :key="idx"
                    @click="selectedSource = source"
                    class="text-sm cursor-pointer hover:underline"
                  >
                    {{ idx + 1 }}. {{ source.documentName }} ({{
                      (source.relevanceScore * 100).toFixed(1)
                    }}% match)
                  </div>
                </div>
              </div>
              <div class="text-xs mt-2 opacity-70">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>

          <div v-if="isQuerying" class="flex justify-start">
            <div class="bg-gray-100 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <div class="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="border-t p-4">
          <form @submit.prevent="sendQuestion" class="flex gap-2">
            <input
              v-model="question"
              type="text"
              placeholder="Ask a question..."
              :disabled="!selectedKnowledgeBaseIds.length || isQuerying"
              class="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              :disabled="!question.trim() || !selectedKnowledgeBaseIds.length || isQuerying"
              class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>
          <div v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</div>
        </div>
      </div>

      <!-- Right Panel: Source Details -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow p-6 overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Source Details</h2>

        <div v-if="!selectedSource" class="text-gray-500 text-sm">
          Click on a source to view details
        </div>

        <div v-else>
          <h3 class="font-semibold mb-2">{{ selectedSource.documentName }}</h3>
          <div class="text-sm text-gray-600 mb-4">
            Relevance: {{ (selectedSource.relevanceScore * 100).toFixed(1) }}%
          </div>
          <div class="bg-gray-50 p-4 rounded text-sm">
            <div class="font-medium mb-2">Content:</div>
            <div class="whitespace-pre-wrap">{{ selectedSource.chunkContent }}</div>
          </div>
          <button
            @click="selectedSource = null"
            class="mt-4 text-sm text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../stores/chat';
import { useKnowledgeBaseStore } from '../stores/knowledgeBase';
import type { SourceDto } from '../api/chat.api';

const chatStore = useChatStore();
const kbStore = useKnowledgeBaseStore();

const { selectedKnowledgeBaseIds, messages, isQuerying, error } = storeToRefs(chatStore);
const { knowledgeBases } = storeToRefs(kbStore);

const question = ref('');
const selectedSource = ref<SourceDto | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  kbStore.fetchKnowledgeBases();
});

// Auto-scroll to bottom when new messages arrive
watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

const toggleKb = (id: string) => {
  chatStore.toggleKnowledgeBase(id);
};

const sendQuestion = async () => {
  if (!question.value.trim()) return;

  try {
    await chatStore.sendQuery(question.value);
    question.value = '';
  } catch (error) {
    // Error is handled in store
  }
};

const clearChat = () => {
  if (confirm('Are you sure you want to clear the chat history?')) {
    chatStore.clearChat();
    selectedSource.value = null;
  }
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>
