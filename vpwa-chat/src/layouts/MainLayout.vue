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
        :loading="submitting"
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
import { onUnmounted, ref, watch } from 'vue';
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
const submitting = ref(false);
const membersDialogOpen = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollVersion = 0;

function stopPolling() {
  pollVersion++;
  clearTimeout(pollTimer);
}

async function poll(version: number, background: boolean) {
  try {
    await chat.refreshChannels(background);
    if (version !== pollVersion) return;
    const channelId = chat.activeChannel?.id;
    if (channelId) await chat.fetchMessages(channelId, true);
  } catch (error) {
    if (version === pollVersion) {
      chat.channelsError = error instanceof Error ? error.message : 'Unable to refresh chat.';
    }
  } finally {
    // Schedule only after requests finish so slow requests cannot overlap cycles.
    if (version === pollVersion) pollTimer = setTimeout(() => void poll(version, true), 3000);
  }
}

watch(
  () => [auth.currentUser?.id, auth.token],
  () => {
    stopPolling();
    if (!auth.isAuthenticated) {
      chat.$reset();
      void router.replace({ name: 'login' });
      return;
    }
    void poll(pollVersion, false);
  },
  { immediate: true },
);

watch(
  () => chat.activeChannelId,
  (channelId) => {
    chat.resetMessageView();
    if (channelId) void chat.fetchMessages(channelId);
  },
  { immediate: true, flush: 'sync' },
);

onUnmounted(() => {
  stopPolling();
  chat.resetMessageView();
});

watch([draft, () => chat.activeChannelId], () => {
  inputError.value = '';
});

// UC4: command line parser.
async function onSubmit(text: string) {
  if (submitting.value) return;
  submitting.value = true;
  inputError.value = '';
  const parsed = parseInput(text);

  try {
    switch (parsed.type) {
      case 'message':
      case 'mention':
        if (!chat.activeChannelId) {
          inputError.value = 'Select a channel first.';
          break;
        }
        await chat.sendMessage(chat.activeChannelId, parsed.text);
        draft.value = '';
        break;

      case 'join': {
        const channel = await chat.joinChannel(parsed.name, parsed.isPrivate);
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
        const result = await chat.inviteUser(chat.activeChannelId, parsed.nickName);
        draft.value = '';
        $q.notify({
          type: 'positive',
          message: result.message,
        });
        break;
      }

      case 'list': {
        await chat.fetchChannels(true);
        if (chat.channelsError) {
          inputError.value = chat.channelsError;
          break;
        }
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
        await chat.leaveChannel(chat.activeChannelId);
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
        await chat.deleteChannel(chat.activeChannelId);
        draft.value = '';
        $q.notify({ type: 'info', message: 'Channel deleted.' });
        break;
      }
      case 'kick':
      case 'revoke': {
        if (!chat.activeChannelId) {
          inputError.value = 'Select a channel first.';
          break;
        }

        const result = parsed.type === 'kick'
          ? await chat.kickUser(chat.activeChannelId, parsed.nickName)
          : await chat.revokeUser(chat.activeChannelId, parsed.nickName);

        draft.value = '';
        $q.notify({ type: 'info', message: result.message });
        break;
      }

      case 'error':
        inputError.value = parsed.message;
        break;
    }
  } catch (error) {
    inputError.value = error instanceof Error ? error.message : 'Something went wrong.';
  } finally {
    submitting.value = false;
  }
}

function onChannelSelected() {
  if ($q.screen.width <= 1023) drawerOpen.value = false;
}

async function onLogout() {
  try {
    await auth.logout();
  } catch {
    $q.notify({
      type: 'warning',
      message: 'Signed out locally. Server logout could not be confirmed.',
    });
  }
  chat.$reset();
  await router.push({ name: 'login' });
}
</script>
