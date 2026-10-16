<template>
  <div>
    <!-- Reserved height prevents layout shift when the indicator appears -->
    <div class="typing-indicator text-caption text-grey-7 q-px-sm" aria-live="polite">
      <template v-if="someoneTyping">
        <q-spinner-dots size="16px" class="q-mr-xs" />
        Someone is typing...
      </template>
    </div>

    <form class="row items-start q-gutter-sm q-pa-sm" @submit.prevent="submit">
      <q-input
        v-model="text"
        class="col"
        outlined
        dense
        label="Message or command"
        :placeholder="placeholder"
        :error="!!error"
        :error-message="error"
        hide-bottom-space
      />
      <q-btn
        class="send-button"
        type="submit"
        color="primary"
        icon="send"
        aria-label="Send"
        :disable="!text.trim()"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ error?: string; placeholder: string }>();
const text = defineModel<string>({ default: '' });
const emit = defineEmits<{ submit: [text: string] }>();

// Prototype only: fake "someone is typing" indicator
const TYPING_INTERVAL_MS = 5_000; // how often the indicator appears
const TYPING_DURATION_MS = 2_000; // how long it stays visible

const someoneTyping = ref(false);
let intervalId: ReturnType<typeof setInterval> | undefined;
let hideTimeoutId: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  intervalId = setInterval(() => {
    someoneTyping.value = true;
    clearTimeout(hideTimeoutId);
    hideTimeoutId = setTimeout(() => {
      someoneTyping.value = false;
    }, TYPING_DURATION_MS);
  }, TYPING_INTERVAL_MS);
});

// Clean up timers so nothing runs after the component is destroyed
onBeforeUnmount(() => {
  clearInterval(intervalId);
  clearTimeout(hideTimeoutId);
});

function submit() {
  const value = text.value.trim();
  if (!value) return;

  emit('submit', value);
}
</script>

<style scoped>
.send-button {
  height: 40px;
}

.typing-indicator {
  min-height: 20px;
}
</style>
