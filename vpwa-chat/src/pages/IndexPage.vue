<template>
  <q-page class="q-pa-md">
    <div v-if="chat.activeChannel">
      <h1 class="text-h6 q-mt-none q-mb-sm channel-name">
        <q-icon :name="chat.activeChannel.isPrivate ? 'lock' : 'tag'" class="q-mr-xs" />
        {{ chat.activeChannel.name }}
      </h1>
      <p class="text-grey-7">
        {{ chat.activeChannel.isPrivate ? 'Private channel' : 'Public channel' }}
      </p>
      <q-btn
        outline
        color="warning"
        text-color="dark"
        icon="history"
        label="Demo: simulate 30 days of inactivity"
        class="q-mb-md"
        @click="openSimulation"
      />
      <q-separator />
      <MessageList :messages="chat.activeMessages" />
    </div>
    <div v-else>
      <h1 class="text-h6 q-mt-none">Select a channel</h1>
      <p class="text-grey-7">
        Choose a channel from the sidebar. On mobile, open it using the menu button.
      </p>
    </div>
    <q-dialog v-model="simulationOpen">
      <q-card style="width: 400px; max-width: calc(100vw - 32px)">
        <q-card-section>
          <h2 class="text-h6 q-ma-none">Simulate inactivity</h2>
        </q-card-section>
        <q-card-section class="q-pt-none">
          This demo simulates more than 30 days without a new message in the selected channel. The
          channel, its messages and invitations will be removed.
          <p v-if="simulationError" role="alert" class="text-negative q-mt-sm">
            {{ simulationError }}
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn color="negative" label="Simulate expiration" @click="simulateInactivity" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat-store';
import MessageList from '@/components/chat/MessageList.vue';

const chat = useChatStore();
const simulationOpen = ref(false);
const simulationChannelId = ref<string | null>(null);
const simulationError = ref('');

function openSimulation() {
  simulationChannelId.value = chat.activeChannel?.id ?? null;
  simulationError.value = '';
  simulationOpen.value = true;
}

function simulateInactivity() {
  if (!simulationChannelId.value) return;
  try {
    chat.simulateChannelInactivity(simulationChannelId.value);
    simulationOpen.value = false;
  } catch (error) {
    simulationError.value =
      error instanceof Error ? error.message : 'Unable to simulate inactivity.';
  }
}
</script>

<style scoped>
.channel-name {
  overflow-wrap: anywhere;
}
</style>
