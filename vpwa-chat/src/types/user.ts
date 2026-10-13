export type UserStatus = 'online' | 'dnd' | 'offline';

export interface User {
  id: string;
  nickName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
}