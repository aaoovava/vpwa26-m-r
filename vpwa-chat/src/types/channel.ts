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
    user: { id: string; nickName: string };
  }[];
}

export interface ChannelMemberInfo {
  id: string;
  nickName: string;
  isOwner: boolean;
}

// Pending invitations do not grant membership until accepted.
export interface ChannelInvitation {
  id: string;
  channelId: string;
  inviterId: string;
  inviteeId: string;
  createdAt: string;
  channel: Omit<Channel, 'memberIds'>;
  inviter: { id: string; nickName: string };
}
