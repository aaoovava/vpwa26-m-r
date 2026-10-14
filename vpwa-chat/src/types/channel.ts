export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  lastMessageAt: string | null;
}

// An invitation adds membership immediately; this tracks its unread indicator.
export interface ChannelInvitation {
  channelId: string;
  userId: string;
}
