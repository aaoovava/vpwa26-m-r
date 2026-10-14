<template>
  <q-list padding aria-label="Channels">
    <q-item-label header>Channels</q-item-label>

    <div class="q-px-md q-pb-sm">
      <q-btn
        outline
        color="primary"
        icon="add"
        label="New channel"
        class="full-width"
        @click="createDialogOpen = true"
      />
    </div>

    <q-item
      v-for="channel in chat.myChannels"
      :key="channel.id"
      clickable
      :active="chat.activeChannelId === channel.id"
      active-class="bg-blue-1 text-primary"
      :class="{ 'bg-amber-1': chat.invitedChannelIds.includes(channel.id) }"
      @click="selectChannel(channel.id)"
    >
      <q-item-section avatar>
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="channel-name">{{ channel.name }}</q-item-label>
        <q-item-label caption>{{ channel.isPrivate ? 'Private' : 'Public' }}</q-item-label>
        <q-item-label v-if="chat.invitedChannelIds.includes(channel.id)">
          <q-badge color="orange-9" label="New invitation" />
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          round
          dense
          icon="logout"
          :aria-label="`Leave ${channel.name}`"
          @click.stop="requestLeave(channel.id)"
        >
          <q-tooltip>Leave channel</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section v-if="channel.ownerId === auth.currentUser?.id" side>
        <q-btn
          flat
          round
          dense
          color="negative"
          icon="delete"
          :aria-label="`Delete ${channel.name}`"
          @click.stop="requestLeave(channel.id, 'delete')"
        >
          <q-tooltip>Delete channel</q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>

    <q-item v-if="chat.myChannels.length === 0">
      <q-item-section class="text-grey-7">You haven't joined any channels yet.</q-item-section>
    </q-item>
  </q-list>
  <CreateChannelDialog v-model="createDialogOpen" @created="emit('selected')" />
  <q-dialog v-model="leaveDialogOpen">
    <q-card class="leave-channel-card">
      <q-card-section>
        <h2 class="text-h6 q-ma-none">{{ actionLabel }}</h2>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <p class="channel-name">
          {{ channelAction === 'delete' ? 'Delete' : 'Leave' }} {{ channelToLeave?.name }}?
        </p>
        <p v-if="channelAction === 'delete'" class="text-negative">
          This will delete the channel and all its messages for every member. This cannot be undone.
        </p>
        <p v-else-if="channelToLeave?.ownerId === auth.currentUser?.id" class="text-negative">
          You own this channel. Leaving will delete it and all its messages for every member.
        </p>
        <p v-else>You will no longer see this channel in your list.</p>
        <p v-if="leaveError" role="alert" class="text-negative">{{ leaveError }}</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn color="negative" :label="actionLabel" @click="confirmLeave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CreateChannelDialog from '@/components/chat/CreateChannelDialog.vue';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';

const chat = useChatStore();
const auth = useAuthStore();
const createDialogOpen = ref(false);
const leaveDialogOpen = ref(false);
const leaveChannelId = ref<string | null>(null);
const leaveError = ref('');
const channelAction = ref<'leave' | 'delete'>('leave');
const actionLabel = computed(() =>
  channelAction.value === 'delete' ? 'Delete channel' : 'Leave channel',
);
const channelToLeave = computed(() =>
  chat.myChannels.find((channel) => channel.id === leaveChannelId.value),
);
const emit = defineEmits<{ selected: [] }>();

function requestLeave(channelId: string, action: 'leave' | 'delete' = 'leave') {
  channelAction.value = action;
  leaveChannelId.value = channelId;
  leaveError.value = '';
  leaveDialogOpen.value = true;
}

function confirmLeave() {
  if (!leaveChannelId.value) return;
  try {
    if (channelAction.value === 'delete') {
      chat.deleteChannel(leaveChannelId.value);
    } else {
      chat.leaveChannel(leaveChannelId.value);
    }
    leaveDialogOpen.value = false;
  } catch (error) {
    leaveError.value =
      error instanceof Error ? error.message : 'Unable to complete channel action.';
  }
}

function selectChannel(channelId: string) {
  chat.selectChannel(channelId);
  emit('selected');
}
</script>

<style scoped>
.channel-name {
  overflow-wrap: anywhere;
}
.leave-channel-card {
  width: 400px;
  max-width: calc(100vw - 32px);
}
</style>
