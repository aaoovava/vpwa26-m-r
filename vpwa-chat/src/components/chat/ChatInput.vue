<template>
  <form class="row items-center q-gutter-sm q-pa-sm" @submit.prevent="submit">
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
    <q-btn type="submit" color="primary" icon="send" aria-label="Send" :disable="!text.trim()" />
  </form>
</template>

<script setup lang="ts">
defineProps<{ error?: string; placeholder: string }>();
const text = defineModel<string>({ default: '' });
const emit = defineEmits<{ submit: [text: string] }>();

function submit() {
  const value = text.value.trim();
  if (!value) return;

  emit('submit', value);
}
</script>
