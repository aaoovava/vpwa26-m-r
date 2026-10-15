<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle channels"
          @click="drawerOpen = !drawerOpen"
        />
        <q-toolbar-title>vpwa-chat</q-toolbar-title>

        <UserMenu @logout="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above bordered :width="280" :breakpoint="1023">
      <ChannelList @selected="onChannelSelected" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-white text-dark">
      <ChatInput
        v-model="draft"
        :error="inputError"
        :placeholder="
          chat.activeChannel
            ? 'Type a message or command'
            : 'Type /join channelName or select a channel'
        "
        @submit="onSubmit"
      />
    </q-footer>
    <ChannelMembersDialog
      v-model="membersDialogOpen"
      :channel-name="chat.activeChannel?.name ?? ''"
      :members="chat.activeChannelMembers"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import ChannelList from '@/components/chat/ChannelList.vue';
import ChatInput from '@/components/chat/ChatInput.vue';
import UserMenu from '@/components/chat/UserMenu.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { parseInput } from '@/utils/command-parser';
import ChannelMembersDialog from '@/components/chat/ChannelMembersDialog.vue';

const auth = useAuthStore();
const chat = useChatStore();
const router = useRouter();
const $q = useQuasar();
const drawerOpen = ref(false);
const draft = ref('');
const inputError = ref('');
const membersDialogOpen = ref(false);
let cleanupInterval: ReturnType<typeof setInterval> | undefined;

function checkInactiveChannels() {
  chat.removeInactiveChannels();
}

onMounted(() => {
  checkInactiveChannels();
  cleanupInterval = setInterval(checkInactiveChannels, 60_000);
  document.addEventListener('visibilitychange', checkInactiveChannels);
});

onUnmounted(() => {
  clearInterval(cleanupInterval);
  document.removeEventListener('visibilitychange', checkInactiveChannels);
});

watch([draft, () => chat.activeChannelId], () => {
  inputError.value = '';
});

// UC4: command line parser.
function onSubmit(text: string) {
  inputError.value = '';
  const parsed = parseInput(text);

  try {
    switch (parsed.type) {
      case 'message':
        chat.sendMessage(parsed.text);
        draft.value = '';
        break;

      case 'mention':
        chat.sendMention(parsed.nickName, text);
        draft.value = '';
        break;

      case 'join': {
        const channel = chat.joinChannel(parsed.name, parsed.isPrivate);
        draft.value = '';
        $q.notify({
          type: 'positive',
          message: `Joined #${channel.name}`,
        });
        break;
      }

      case 'invite': {
        if (!chat.activeChannelId) {
          inputError.value = 'Select a channel first.';
          break;
        }
        chat.inviteUser(chat.activeChannelId, parsed.nickName);
        draft.value = '';
        $q.notify({
          type: 'positive',
          message: `Invited ${parsed.nickName}`,
        });
        break;
      }

      case 'list': {
        if (!chat.activeChannelId) {
          inputError.value = 'No active channel.';
          break;
        }
        if (chat.activeChannelMembers.length === 0) {
          inputError.value = 'No members to show.';
          break;
        }
        membersDialogOpen.value = true;
        draft.value = '';
        break;
      }

      case 'cancel': {
        if (!chat.activeChannelId) {
          inputError.value = 'No active channel.';
          break;
        }
        const wasOwner = chat.activeChannel?.ownerId === auth.currentUser?.id;
        chat.leaveChannel(chat.activeChannelId);
        draft.value = '';
        $q.notify({
          type: 'info',
          message: wasOwner ? 'Channel deleted (you were the owner).' : 'You left the channel.',
        });
        break;
      }

      case 'quit': {
        if (!chat.activeChannelId) {
          inputError.value = 'No active channel.';
          break;
        }
        chat.deleteChannel(chat.activeChannelId);
        draft.value = '';
        $q.notify({ type: 'info', message: 'Channel deleted.' });
        break;
      }

      case 'error':
        inputError.value = parsed.message;
        break;
    }
  } catch (error) {
    inputError.value = error instanceof Error ? error.message : 'Something went wrong.';
  }
}

function onChannelSelected() {
  if ($q.screen.width <= 1023) drawerOpen.value = false;
}

async function onLogout() {
  auth.logout();
  await router.push({ name: 'login' });
}
</script>