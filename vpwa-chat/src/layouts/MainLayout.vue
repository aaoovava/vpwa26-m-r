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

        <q-btn-dropdown flat dense :label="auth.currentUser?.nickName" icon="account_circle">
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup @click="onLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Sign out</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
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
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import ChannelList from '@/components/chat/ChannelList.vue';
import ChatInput from '@/components/chat/ChatInput.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { parseInput } from '@/utils/command-parser';

const auth = useAuthStore();
const chat = useChatStore();
const router = useRouter();
const $q = useQuasar();
const drawerOpen = ref(false);
const draft = ref('');
const inputError = ref('');
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
        chat.sendMention(parsed.nickName, parsed.text);
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
        const members = chat.activeChannelMembers;
        if (members.length === 0) {
          inputError.value = 'No active channel.';
          break;
        }
        $q.notify({
          type: 'info',
          message: `Members: ${members.map((m) => m.nickName).join(', ')}`,
          timeout: 5000,
        });
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