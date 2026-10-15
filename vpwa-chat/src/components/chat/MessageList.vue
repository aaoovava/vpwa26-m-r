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
    <div ref="bottomAnchor" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { scroll } from 'quasar';
import type { Message } from '@/types/message';
import { useAuthStore } from '@/stores/auth-store';

const { getScrollTarget, getScrollHeight, getVerticalScrollPosition, setVerticalScrollPosition } =
  scroll;

const props = defineProps<{ messages: Message[] }>();
const auth = useAuthStore();
const bottomAnchor = ref<HTMLElement | null>(null);

// Find the element (or window) that actually scrolls, e.g. q-layout / q-page container
function getTarget(): Element | Window | null {
  return bottomAnchor.value ? getScrollTarget(bottomAnchor.value) : null;
}

function isNearBottom(threshold = 150): boolean {
  const target = getTarget();
  if (!target) return true;
  const viewport = target instanceof Window ? target.innerHeight : target.clientHeight;
  return getScrollHeight(target) - getVerticalScrollPosition(target) - viewport < threshold;
}

async function scrollToBottom(duration = 300) {
  // Wait for Vue to render the new message
  await nextTick();
  // Wait for the browser to finish layout so scrollHeight is final
  requestAnimationFrame(() => {
    const target = getTarget();
    if (!target) return;
    setVerticalScrollPosition(target, getScrollHeight(target), duration);
  });
}

// New message in the current channel
watch(
  () => props.messages.length,
  () => {
    const lastMessage = props.messages[props.messages.length - 1];
    const isMine = lastMessage?.authorId === auth.currentUser?.id;
    // Always scroll for own messages; for others only if the user is already near the bottom
    if (isMine || isNearBottom()) void scrollToBottom(300);
  },
);

// Channel switched: jump to the bottom instantly, no animation
watch(
  () => props.messages[0]?.id,
  () => void scrollToBottom(0),
);

onMounted(() => void scrollToBottom(0));

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