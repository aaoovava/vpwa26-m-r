export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  ownerId: string;
  memberIds: string[];
}
