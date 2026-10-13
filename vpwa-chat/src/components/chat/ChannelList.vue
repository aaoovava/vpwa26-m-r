<template>
  <q-list padding aria-label="Channels">
    <q-item-label header>Channels</q-item-label>

    <q-item
      v-for="channel in chat.myChannels"
      :key="channel.id"
      clickable
      :active="chat.activeChannelId === channel.id"
      active-class="bg-blue-1 text-primary"
      @click="selectChannel(channel.id)"
    >
      <q-item-section avatar>
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="channel-name">{{ channel.name }}</q-item-label>
        <q-item-label caption>{{ channel.isPrivate ? 'Private' : 'Public' }}</q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="chat.myChannels.length === 0">
      <q-item-section class="text-grey-7">You haven't joined any channels yet.</q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat-store';

const chat = useChatStore();
const emit = defineEmits<{ selected: [] }>();

function selectChannel(channelId: string) {
  chat.selectChannel(channelId);
  emit('selected');
}
</script>

<style scoped>
.channel-name {
  overflow-wrap: anywhere;
}
</style>
