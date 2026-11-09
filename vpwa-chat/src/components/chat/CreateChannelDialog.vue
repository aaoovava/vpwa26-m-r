<template>
  <q-dialog v-model="open" :persistent="creating" @before-show="resetForm">
    <q-card class="create-channel-card">
      <q-form @submit="createChannel">
        <q-card-section>
          <h2 class="text-h6 q-ma-none">New channel</h2>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="name"
            :disable="creating"
            outlined
            autofocus
            label="Channel name"
            hint="No spaces; for example, my-channel"
            :error="!!error"
            :error-message="error"
            @update:model-value="error = ''"
          />
          <q-toggle v-model="isPrivate" :disable="creating" label="Private channel" />
          <p class="text-caption text-grey-7 q-mb-none">
            {{ isPrivate ? 'Only the owner can invite members.' : 'Anyone can join this channel.' }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" :disable="creating" />
          <q-btn
            type="submit"
            color="primary"
            label="Create"
            :disable="!name.trim() || creating"
            :loading="creating"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat-store';

const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ created: [] }>();
const chat = useChatStore();
const name = ref('');
const isPrivate = ref(false);
const error = ref('');
const creating = ref(false);

function resetForm() {
  name.value = '';
  isPrivate.value = false;
  error.value = '';
}

async function createChannel() {
  if (creating.value) return;
  creating.value = true;
  error.value = '';
  try {
    await chat.createChannel(name.value, isPrivate.value);
    open.value = false;
    emit('created');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to create channel.';
  } finally {
    creating.value = false;
  }
}
</script>

<style scoped>
.create-channel-card {
  width: 400px;
  max-width: calc(100vw - 32px);
}
</style>
