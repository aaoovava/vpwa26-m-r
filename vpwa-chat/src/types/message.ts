export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO 8601 timestamp
}
