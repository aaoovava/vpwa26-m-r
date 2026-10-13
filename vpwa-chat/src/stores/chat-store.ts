import { defineStore } from 'pinia';
import type { Channel } from '@/types/channel';
import { useAuthStore } from '@/stores/auth-store';

export const useChatStore = defineStore('chat', {
  state: (): { channels: Channel[]; activeChannelId: string | null } => ({
    // Phase 1: mock channels. Phase 2: load channels from the backend.
    channels: [
      {
        id: 'general',
        name: 'general',
        isPrivate: false,
        ownerId: 'matej',
        memberIds: ['roman', 'matej'],
      },
      {
        id: 'project',
        name: 'project',
        isPrivate: true,
        ownerId: 'roman',
        memberIds: ['roman', 'matej'],
      },
      {
        id: 'ideas',
        name: 'ideas',
        isPrivate: false,
        ownerId: 'roman',
        memberIds: ['roman'],
      },
    ],
    activeChannelId: null,
  }),

  getters: {
    myChannels(state): Channel[] {
      const user = useAuthStore().currentUser;
      if (!user) return [];

      return state.channels.filter((channel) => channel.memberIds.includes(user.id));
    },

    activeChannel(): Channel | null {
      // Check membership again so a different signed-in user cannot see a private channel.
      return this.myChannels.find((channel) => channel.id === this.activeChannelId) ?? null;
    },
  },

  actions: {
    selectChannel(channelId: string) {
      const channel = this.myChannels.find((channel) => channel.id === channelId);
      if (!channel) return;

      this.activeChannelId = channel.id;
    },
  },
});
