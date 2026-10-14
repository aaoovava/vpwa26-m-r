<template>
  <div class="q-mt-md" role="log" aria-label="Channel messages" aria-live="polite">
    <p v-if="messages.length === 0" class="text-grey-7">No messages yet. Start the conversation!</p>
    <q-chat-message
      v-for="message in messages"
      :key="message.id"
      :name="authorName(message.authorId)"
      :text="[message.text]"
      :stamp="formatTime(message.createdAt)"
      :sent="message.authorId === auth.currentUser?.id"
      :bg-color="message.authorId === auth.currentUser?.id ? 'blue-1' : 'grey-3'"
      class="message"
    />
  </div>
</template>

<script setup lang="ts">
import type { Message } from '@/types/message';
import { useAuthStore } from '@/stores/auth-store';

defineProps<{ messages: Message[] }>();
const auth = useAuthStore();

function authorName(authorId: string): string {
  return auth.users.find((user) => user.id === authorId)?.nickName ?? authorId;
}

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleString();
}
</script>

<style scoped>
.message {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
