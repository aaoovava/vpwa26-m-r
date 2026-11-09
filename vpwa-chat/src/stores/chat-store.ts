import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Channel, ChannelInvitation, ApiChannel, ChannelMemberInfo } from '@/types/channel';
import type { Message } from '@/types/message';
import { useAuthStore } from '@/stores/auth-store';
import { validateChannelName } from '@/utils/channel-name';
import { api } from '@/boot/axios';
import { isAxiosError } from 'axios';

export const useChatStore = defineStore('chat', {
  state: (): {
    channels: Channel[];
    channelMembers: Record<string, ChannelMemberInfo[]>;
    activeChannelId: string | null;
    messages: Message[];
    pendingInvitations: ChannelInvitation[];
    channelsLoading: boolean;
    channelsError: string;
    channelsUserId: string | null;
    channelsRequestId: string | null;
    invitationsLoading: boolean;
    invitationsError: string;
    invitationsRequestId: string | null;
    messagesLoading: boolean;
    messagesError: string;
    messagesRequestId: string | null;
  } => ({
    channels: [],
    channelMembers: {},
    activeChannelId: null,
    messages: [],
    pendingInvitations: [],
    channelsLoading: false,
    channelsError: '',
    channelsUserId: null,
    channelsRequestId: null,
    invitationsLoading: false,
    invitationsError: '',
    invitationsRequestId: null,
    messagesLoading: false,
    messagesError: '',
    messagesRequestId: null,
  }),

  getters: {
    myChannels(state): Channel[] {
      const user = useAuthStore().currentUser;
      if (!user || state.channelsUserId !== user.id) return [];

      return state.channels.filter((channel) => channel.memberIds.includes(user.id));
    },

    myInvitations(state): ChannelInvitation[] {
      const userId = useAuthStore().currentUser?.id;
      return state.pendingInvitations.filter((invitation) => invitation.inviteeId === userId);
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

    activeChannelMembers(): ChannelMemberInfo[] {
      const channel = this.activeChannel;
      if (!channel) return [];

      return this.channelMembers[channel.id] ?? [];
    },
  },

  actions: {
    async fetchChannels(background = false) {
      const auth = useAuthStore();
      const userId = auth.currentUser?.id;
      const token = auth.token;
      if (!userId || !token) {
        this.$reset();
        return;
      }
      if (this.channelsUserId !== userId) this.$reset();

      const requestId = crypto.randomUUID();
      this.channelsRequestId = requestId;
      this.channelsUserId = userId;
      this.channelsLoading = !background;
      this.channelsError = '';
      const isCurrentRequest = () =>
        this.channelsRequestId === requestId &&
        auth.currentUser?.id === userId &&
        auth.token === token;

      try {
        const { data } = await api.get<ApiChannel[]>('/channels');
        // Ignore responses from requests made before logout or an account switch.
        if (!isCurrentRequest()) return;
        this.channelMembers = Object.fromEntries(
          data.map((channel) => [
            channel.id,
            channel.members
              .filter((member) => !member.isBanned)
              .map((member) => ({
                id: member.user.id,
                nickName: member.user.nickName,
                isOwner: channel.ownerId === member.user.id,
              })),
          ]),
        );
        this.channels = data.map((channel) => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.isPrivate,
          ownerId: channel.ownerId,
          createdAt: channel.createdAt,
          lastMessageAt: channel.lastMessageAt,
          memberIds: channel.members
            .filter((member) => !member.isBanned)
            .map((member) => member.userId),
        }));
        if (!this.myChannels.some((channel) => channel.id === this.activeChannelId)) {
          this.activeChannelId = null;
        }
        const channelIds = new Set(this.myChannels.map((channel) => channel.id));
        this.messages = this.messages.filter((message) => channelIds.has(message.channelId));
      } catch (error) {
        if (!isCurrentRequest()) return;
        this.channelsError = error instanceof Error ? error.message : 'Unable to load channels.';
        if (isAxiosError(error) && error.response?.status === 401) {
          auth.clearSession();
          this.$reset();
        }
      } finally {
        if (isCurrentRequest()) {
          this.channelsLoading = false;
          this.channelsRequestId = null;
        }
      }
    },

    // Prevent an older list request from restoring a channel removed by an action.
    invalidateChannelListRequest() {
      this.channelsRequestId = null;
      this.channelsLoading = false;
      this.channelsError = '';
    },

    removeChannelLocally(channelId: string) {
      this.invalidateChannelListRequest();
      this.channels = this.channels.filter((channel) => channel.id !== channelId);
      delete this.channelMembers[channelId];
      this.messages = this.messages.filter((message) => message.channelId !== channelId);
      this.pendingInvitations = this.pendingInvitations.filter(
        (invitation) => invitation.channelId !== channelId,
      );
      if (this.activeChannelId === channelId) this.activeChannelId = null;
    },

    async simulateChannelInactivity(channelId: string) {
      const auth = useAuthStore();
      const token = auth.token;
      if (!this.myChannels.some((channel) => channel.id === channelId)) {
        throw new Error('Select a channel you belong to.');
      }
      await api.post(`/channels/${channelId}/simulate-inactivity`);
      if (auth.token === token) this.removeChannelLocally(channelId);
    },

    async refreshChannels(background = false) {
      await this.fetchChannels(background);
      await this.fetchInvitations(background);
    },

    async fetchInvitations(background = false) {
      const auth = useAuthStore();
      const userId = auth.currentUser?.id;
      const token = auth.token;
      if (!userId || !token) return;
      const requestId = crypto.randomUUID();
      this.invitationsRequestId = requestId;
      this.invitationsLoading = !background;
      this.invitationsError = '';
      const isCurrentRequest = () =>
        this.invitationsRequestId === requestId &&
        auth.currentUser?.id === userId &&
        auth.token === token;
      try {
        const { data } = await api.get<ChannelInvitation[]>('/invitations');
        if (isCurrentRequest()) this.pendingInvitations = data;
      } catch (error) {
        if (isCurrentRequest()) {
          this.invitationsError =
            error instanceof Error ? error.message : 'Unable to load invitations.';
        }
      } finally {
        if (isCurrentRequest()) {
          this.invitationsLoading = false;
          this.invitationsRequestId = null;
        }
      }
    },

    async inviteUser(channelId: string, nickName: string): Promise<{ message: string }> {
      const auth = useAuthStore();
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in to invite a user.');
      const channel = this.myChannels.find((item) => item.id === channelId);
      if (!channel) throw new Error('You are not a member of this channel.');
      if (channel.isPrivate && channel.ownerId !== user.id) {
        throw new Error('Only the owner can invite users to a private channel.');
      }
      const { data } = await api.post<{ message: string }>(`/channels/${channelId}/invite`, {
        nickName: nickName.trim(),
      });
      return data;
    },

    async respondToInvitation(invitationId: string, accept: boolean) {
      const auth = useAuthStore();
      const token = auth.token;
      const invitation = this.myInvitations.find((item) => item.id === invitationId);
      if (!invitation) throw new Error('Invitation is no longer available. Refresh the list.');
      await api.post(`/invitations/${invitationId}/${accept ? 'accept' : 'reject'}`);
      if (auth.token !== token) return;
      this.invitationsRequestId = null;
      this.invitationsLoading = false;
      this.invitationsError = '';
      this.pendingInvitations = this.pendingInvitations.filter((item) => item.id !== invitationId);
      if (accept) {
        await this.fetchChannels();
        if (auth.token === token) this.selectChannel(invitation.channelId);
      }
    },

    async deleteChannel(channelId: string) {
      const auth = useAuthStore();
      const user = auth.currentUser;
      const token = auth.token;
      if (!user) throw new Error('Sign in to delete a channel.');
      const channel = this.myChannels.find((item) => item.id === channelId);
      if (!channel) throw new Error('Channel no longer exists.');
      if (channel.ownerId !== user.id) throw new Error('Only the owner can delete this channel.');

      await api.delete(`/channels/${channelId}/destroy`);
      if (auth.token === token) this.removeChannelLocally(channelId);
    },

    async leaveChannel(channelId: string) {
      const auth = useAuthStore();
      const token = auth.token;
      if (!auth.currentUser) throw new Error('Sign in to leave a channel.');
      if (!this.myChannels.some((channel) => channel.id === channelId)) {
        throw new Error('You are not a member of this channel.');
      }
      // The backend deletes the entire channel if its owner leaves.
      await api.delete(`/channels/${channelId}/leave`);
      if (auth.token === token) this.removeChannelLocally(channelId);
    },

    async createChannel(name: string, isPrivate: boolean = false): Promise<Channel> {
      const auth = useAuthStore();
      const user = auth.currentUser;
      const token = auth.token;
      if (!user) throw new Error('Sign in to create a channel.');
      const channelName = validateChannelName(name);
      const { data } = await api.post<Omit<Channel, 'memberIds'>>('/channels', {
        name: channelName,
        isPrivate,
      });
      const channel: Channel = { ...data, memberIds: [user.id] };
      if (auth.token === token) {
        this.invalidateChannelListRequest();
        this.channelsUserId = user.id;
        this.channels = [channel, ...this.channels.filter((item) => item.id !== channel.id)];
        this.channelMembers[channel.id] = [{ id: user.id, nickName: user.nickName, isOwner: true }];
        this.activeChannelId = channel.id;
      }
      return channel;
    },

    // /join creates a channel or joins an existing public channel on the server.
    async joinChannel(name: string, isPrivate: boolean): Promise<Channel> {
      const auth = useAuthStore();
      const user = auth.currentUser;
      const token = auth.token;
      if (!user) throw new Error('Sign in to join a channel.');
      const channelName = validateChannelName(name);
      const { data } = await api.post<Omit<Channel, 'memberIds'>>('/channels/join', {
        channelName,
        isPrivate,
      });
      const channel: Channel = { ...data, memberIds: [user.id] };
      if (auth.token === token) {
        this.invalidateChannelListRequest();
        this.channelsUserId = user.id;
        const existingIndex = this.channels.findIndex((item) => item.id === channel.id);
        if (existingIndex === -1) this.channels.push(channel);
        this.activeChannelId = channel.id;
        // The backend removes redundant pending invitations when joining.
        this.invitationsRequestId = null;
        this.invitationsLoading = false;
        this.pendingInvitations = this.pendingInvitations.filter(
          (item) => item.channelId !== channel.id,
        );
        await this.fetchChannels();
        if (auth.token === token) this.selectChannel(channel.id);
      }
      return channel;
    },

    resetMessageView() {
      this.messagesRequestId = null;
      this.messagesLoading = false;
      this.messagesError = '';
      this.messages = [];
    },

    async fetchMessages(channelId: string, background = false) {
      const auth = useAuthStore();
      const token = auth.token;
      if (!token || this.activeChannel?.id !== channelId || this.messagesRequestId) return;
      const requestId = crypto.randomUUID();
      this.messagesRequestId = requestId;
      this.messagesLoading = !background;
      const isCurrentRequest = () =>
        this.messagesRequestId === requestId &&
        auth.token === token &&
        this.activeChannel?.id === channelId;
      try {
        const { data } = await api.get<Message[]>(`/channels/${channelId}/messages`);
        if (!isCurrentRequest()) return;
        // A full server snapshot replaces the current history without accumulating duplicates.
        this.messages = data;
        this.messagesError = '';
      } catch (error) {
        if (!isCurrentRequest()) return;
        const message = error instanceof Error ? error.message : 'Unable to load messages.';
        if (
          isAxiosError(error) &&
          (error.response?.status === 403 || error.response?.status === 404)
        ) {
          this.removeChannelLocally(channelId);
        }
        this.messagesError = message;
      } finally {
        if (this.messagesRequestId === requestId) {
          this.messagesLoading = false;
          this.messagesRequestId = null;
        }
      }
    },

    async sendMessage(channelId: string, text: string): Promise<Message> {
      const auth = useAuthStore();
      const token = auth.token;
      if (!auth.currentUser) throw new Error('Sign in to send a message.');
      if (!this.myChannels.some((channel) => channel.id === channelId)) {
        throw new Error('Select a channel you belong to.');
      }
      const content = text.trim();
      if (!content) throw new Error('Message cannot be empty.');
      const { data } = await api.post<Message>(`/channels/${channelId}/messages`, {
        text: content,
      });
      if (auth.token === token && this.activeChannel?.id === channelId) {
        // Ignore any older GET response that may not include this just-saved message.
        this.messagesRequestId = null;
        this.messagesLoading = false;
        this.messagesError = '';
        this.messages = [...this.messages.filter((message) => message.id !== data.id), data].sort(
          (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
        );
        this.activeChannel.lastMessageAt = data.createdAt;
      }
      return data;
    },

    selectChannel(channelId: string) {
      const channel = this.myChannels.find((channel) => channel.id === channelId);
      if (!channel) return;

      this.activeChannelId = channel.id;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
