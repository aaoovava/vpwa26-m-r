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
      <q-separator />
      <p class="text-grey-7 q-mt-md">Messages will appear here.</p>
    </div>
    <div v-else>
      <h1 class="text-h6 q-mt-none">Select a channel</h1>
      <p class="text-grey-7">
        Choose a channel from the sidebar. On mobile, open it using the menu button.
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat-store';

const chat = useChatStore();
</script>

<style scoped>
.channel-name {
  overflow-wrap: anywhere;
}
</style>
