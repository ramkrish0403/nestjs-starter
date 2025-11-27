import { defineStore } from 'pinia';
import { ref } from 'vue';
import { chatApi, type QueryDto, type ChatResponseDto } from '../api/chat.api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: ChatResponseDto['sources'];
  timestamp: Date;
}

export const useChatStore = defineStore('chat', () => {
  const selectedKnowledgeBaseIds = ref<string[]>([]);
  const messages = ref<ChatMessage[]>([]);
  const isQuerying = ref(false);
  const error = ref<string | null>(null);

  function toggleKnowledgeBase(id: string) {
    const index = selectedKnowledgeBaseIds.value.indexOf(id);
    if (index > -1) {
      selectedKnowledgeBaseIds.value.splice(index, 1);
    } else {
      selectedKnowledgeBaseIds.value.push(id);
    }
  }

  async function sendQuery(question: string) {
    if (selectedKnowledgeBaseIds.value.length === 0) {
      error.value = 'Please select at least one knowledge base';
      return;
    }

    isQuerying.value = true;
    error.value = null;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    messages.value.push(userMessage);

    try {
      const queryDto: QueryDto = {
        question,
        knowledgeBaseIds: selectedKnowledgeBaseIds.value,
        topK: 5,
      };

      const response = await chatApi.query(queryDto);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        timestamp: new Date(),
      };
      messages.value.push(assistantMessage);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to query knowledge base';

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error.value}`,
        timestamp: new Date(),
      };
      messages.value.push(errorMessage);

      throw err;
    } finally {
      isQuerying.value = false;
    }
  }

  function clearChat() {
    messages.value = [];
    error.value = null;
  }

  return {
    selectedKnowledgeBaseIds,
    messages,
    isQuerying,
    error,
    toggleKnowledgeBase,
    sendQuery,
    clearChat,
  };
});
