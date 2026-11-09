export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  lastMessageAt: string | null;
}

// GET /channels returns membership records rather than a memberIds array.
export interface ApiChannel extends Omit<Channel, 'memberIds'> {
  members: {
    userId: string;
    isBanned: boolean;
  }[];
}

// An invitation adds membership immediately; this tracks its unread indicator.
export interface ChannelInvitation {
  channelId: string;
  userId: string;
}
