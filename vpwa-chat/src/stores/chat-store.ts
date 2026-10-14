import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Channel, ChannelInvitation } from '@/types/channel';
import type { Message } from '@/types/message';
import { useAuthStore } from '@/stores/auth-store';

const CHANNEL_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000;

export const useChatStore = defineStore('chat', {
  state: (): {
    channels: Channel[];
    activeChannelId: string | null;
    messages: Message[];
    pendingInvitations: ChannelInvitation[];
  } => ({
    // Phase 1: mock channels. Phase 2: load channels from the backend.
    channels: [
      {
        id: 'general',
        name: 'general',
        isPrivate: false,
        ownerId: 'matej',
        memberIds: ['roman', 'matej'],
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      },
      {
        id: 'project',
        name: 'project',
        isPrivate: true,
        ownerId: 'roman',
        memberIds: ['roman', 'matej'],
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      },
      {
        id: 'ideas',
        name: 'ideas',
        isPrivate: false,
        ownerId: 'roman',
        memberIds: ['roman'],
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      },
    ],
    activeChannelId: null,
    // Phase 1: messages are kept in memory and reset on page reload.
    messages: [],
    // Demo invitation: sign in as matej to see project highlighted at the top.
    pendingInvitations: [{ channelId: 'project', userId: 'matej' }],
  }),

  getters: {
    myChannels(state): Channel[] {
      const user = useAuthStore().currentUser;
      if (!user) return [];

      const invitedIds = new Set(
        state.pendingInvitations
          .filter((invitation) => invitation.userId === user.id)
          .map((invitation) => invitation.channelId),
      );
      return state.channels
        .filter((channel) => channel.memberIds.includes(user.id))
        .sort((a, b) => Number(invitedIds.has(b.id)) - Number(invitedIds.has(a.id)));
    },

    invitedChannelIds(state): string[] {
      const user = useAuthStore().currentUser;
      if (!user) return [];
      return state.pendingInvitations
        .filter((invitation) => invitation.userId === user.id)
        .map((invitation) => invitation.channelId);
    },

    activeChannel(): Channel | null {
      // Check membership again so a different signed-in user cannot see a private channel.
      return this.myChannels.find((channel) => channel.id === this.activeChannelId) ?? null;
    },

    activeMessages(): Message[] {
      const channel = this.activeChannel;
      if (!channel) return [];

      return this.messages.filter((message) => message.channelId === channel.id);
    },
  },

  actions: {
    // Prototype-only control for demonstrating automatic channel expiration.
    simulateChannelInactivity(channelId: string) {
      const channel = this.myChannels.find((item) => item.id === channelId);
      if (!channel) throw new Error('Select a channel you belong to.');

      const now = Date.now();
      const inactiveSince = new Date(now - CHANNEL_INACTIVITY_MS - 1000).toISOString();
      channel.createdAt = inactiveSince;
      if (channel.lastMessageAt !== null) channel.lastMessageAt = inactiveSince;
      this.removeInactiveChannels(now);
    },

    // Prototype cleanup; the backend will enforce expiration in the final app.
    removeInactiveChannels(now: number = Date.now()) {
      const expiredIds = new Set(
        this.channels
          .filter(
            (channel) =>
              now - Date.parse(channel.lastMessageAt ?? channel.createdAt) > CHANNEL_INACTIVITY_MS,
          )
          .map((channel) => channel.id),
      );
      if (expiredIds.size === 0) return;

      this.channels = this.channels.filter((channel) => !expiredIds.has(channel.id));
      this.messages = this.messages.filter((message) => !expiredIds.has(message.channelId));
      this.pendingInvitations = this.pendingInvitations.filter(
        (invitation) => !expiredIds.has(invitation.channelId),
      );
      if (this.activeChannelId && expiredIds.has(this.activeChannelId)) {
        this.activeChannelId = null;
      }
    },

    inviteUser(channelId: string, nickName: string) {
      this.removeInactiveChannels();
      const auth = useAuthStore();
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in to invite a user.');

      const channel = this.myChannels.find((item) => item.id === channelId);
      if (!channel) throw new Error('You are not a member of this channel.');
      if (channel.isPrivate && channel.ownerId !== user.id) {
        throw new Error('Only the owner can invite users to a private channel.');
      }

      const invitedUser = auth.users.find(
        (item) => item.nickName.toLowerCase() === nickName.trim().toLowerCase(),
      );
      if (!invitedUser) throw new Error('User does not exist.');
      if (channel.memberIds.includes(invitedUser.id)) {
        throw new Error('User is already a member of this channel.');
      }

      channel.memberIds.push(invitedUser.id);
      this.pendingInvitations.push({ channelId, userId: invitedUser.id });
    },

    deleteChannel(channelId: string) {
      const user = useAuthStore().currentUser;
      if (!user) throw new Error('Sign in to delete a channel.');

      const channel = this.channels.find((item) => item.id === channelId);
      if (!channel) throw new Error('Channel no longer exists.');
      if (channel.ownerId !== user.id) throw new Error('Only the owner can delete this channel.');

      this.channels = this.channels.filter((item) => item.id !== channelId);
      this.messages = this.messages.filter((message) => message.channelId !== channelId);
      this.pendingInvitations = this.pendingInvitations.filter(
        (invitation) => invitation.channelId !== channelId,
      );
      if (this.activeChannelId === channelId) this.activeChannelId = null;
    },

    leaveChannel(channelId: string) {
      const user = useAuthStore().currentUser;
      if (!user) throw new Error('Sign in to leave a channel.');

      const channel = this.myChannels.find((item) => item.id === channelId);
      if (!channel) throw new Error('You are not a member of this channel.');

      if (channel.ownerId === user.id) {
        this.deleteChannel(channelId);
      } else {
        channel.memberIds = channel.memberIds.filter((id) => id !== user.id);
        this.pendingInvitations = this.pendingInvitations.filter(
          (invitation) => invitation.channelId !== channelId || invitation.userId !== user.id,
        );
      }

      if (this.activeChannelId === channelId) this.activeChannelId = null;
    },

    createChannel(name: string, isPrivate: boolean = false): Channel {
      this.removeInactiveChannels();
      const user = useAuthStore().currentUser;
      if (!user) throw new Error('Sign in to create a channel.');

      const channelName = name.trim();
      if (!channelName) throw new Error('Channel name cannot be empty.');
      if (
        this.channels.some((channel) => channel.name.toLowerCase() === channelName.toLowerCase())
      ) {
        throw new Error('A channel with this name already exists.');
      }

      const channel: Channel = {
        id: crypto.randomUUID(),
        name: channelName,
        isPrivate,
        ownerId: user.id,
        memberIds: [user.id],
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      };

      this.channels.push(channel);
      this.activeChannelId = channel.id;
      return channel;
    },

    sendMessage(text: string): Message {
      this.removeInactiveChannels();
      const user = useAuthStore().currentUser;
      if (!user) throw new Error('Sign in to send a message.');

      // activeChannel also verifies that the current user is a member.
      const channel = this.activeChannel;
      if (!channel) throw new Error('Select a channel you belong to.');

      const content = text.trim();
      if (!content) throw new Error('Message cannot be empty.');

      const message: Message = {
        id: crypto.randomUUID(),
        channelId: channel.id,
        authorId: user.id,
        text: content,
        createdAt: new Date().toISOString(),
      };

      this.messages.push(message);
      channel.lastMessageAt = message.createdAt;
      return message;
    },

    selectChannel(channelId: string) {
      this.removeInactiveChannels();
      const channel = this.myChannels.find((channel) => channel.id === channelId);
      if (!channel) return;

      this.activeChannelId = channel.id;
      const userId = useAuthStore().currentUser?.id;
      this.pendingInvitations = this.pendingInvitations.filter(
        (invitation) => invitation.channelId !== channelId || invitation.userId !== userId,
      );
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
