import { acceptHMRUpdate, defineStore } from 'pinia';
import type { NotificationPreference, User } from '@/types/user';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
}

// Phase 1: mock users. Phase 2: real backend.
const mockUsers: User[] = [
  {
    id: 'roman',
    nickName: 'roman',
    firstName: 'Roman',
    lastName: 'Kováč',
    email: 'roman@test.sk',
    status: 'online',
    notificationPreference: 'all',
  },
  {
    id: 'matej',
    nickName: 'matej',
    firstName: 'Matej',
    lastName: 'Horváth',
    email: 'matej@test.sk',
    status: 'online',
    notificationPreference: 'all',
  },
];

const STORAGE_KEY = 'vpwa-chat.currentUser';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    users: [...mockUsers] as User[],
  }),

  getters: {
    isAuthenticated: (state) => state.currentUser !== null,
  },

  actions: {
    // Restore session from localStorage (so F5 keeps you logged in)
    restoreSession() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        this.currentUser = JSON.parse(raw) as User;
        this.currentUser.notificationPreference =
          this.currentUser.notificationPreference === 'mentions' ? 'mentions' : 'all';
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    persistSession() {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    login(nickName: string) {
      const user = this.users.find((u) => u.nickName.toLowerCase() === nickName.toLowerCase());
      if (!user) {
        throw new Error(`User "${nickName}" does not exist`);
      }
      this.currentUser = user;
      this.persistSession();
    },

    register(payload: RegisterPayload) {
      const { nickName, email } = payload;

      if (this.users.some((u) => u.nickName.toLowerCase() === nickName.toLowerCase())) {
        throw new Error('Nickname is already taken');
      }
      if (this.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email is already registered');
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        ...payload,
        status: 'online',
        notificationPreference: 'all',
      };
      this.users.push(newUser);
      this.currentUser = newUser;
      this.persistSession();
    },

    logout() {
      this.currentUser = null;
      this.persistSession();
    },

    setStatus(status: User['status']) {
      if (this.currentUser) {
        this.currentUser.status = status;
        this.persistSession();
      }
    },

    setNotificationPreference(preference: NotificationPreference) {
      if (!this.currentUser) return;
      this.currentUser.notificationPreference = preference;
      const user = this.users.find((item) => item.id === this.currentUser?.id);
      if (user) user.notificationPreference = preference;
      this.persistSession();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
