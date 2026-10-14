<template>
  <div class="q-mt-md" role="log" aria-label="Channel messages" aria-live="polite">
    <p v-if="messages.length === 0" class="text-grey-7">
      No messages yet. Start the conversation!
    </p>
    <q-chat-message
      v-for="message in messages"
      :key="message.id"
      :name="authorName(message.authorId)"
      :text="[message.text]"
      :stamp="formatTime(message.createdAt)"
      :sent="message.authorId === auth.currentUser?.id"
      :bg-color="bgColor(message)"
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

// UC6: highlight messages that mention the current user.
function bgColor(message: Message): string {
  const me = auth.currentUser?.id;
  if (!me) return 'grey-3';
  if (message.mentions?.includes(me)) return 'amber-3';
  if (message.authorId === me) return 'blue-1';
  return 'grey-3';
}
</script>

<style scoped>
.message {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>