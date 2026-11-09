export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO 8601 timestamp
  author: { id: string; nickName: string };
  mentions: { userId: string }[];
}
