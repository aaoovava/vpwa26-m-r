import { acceptHMRUpdate, defineStore } from 'pinia';
import type { NotificationPreference, User } from '@/types/user';
import { isAxiosError } from 'axios';
import { api, TOKEN_STORAGE_KEY } from '@/boot/axios';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  password: string;
}

type ApiUser = Omit<User, 'notificationPreference'> & {
  notificationPreference: 'all' | 'mention';
};
interface AuthResponse {
  user: ApiUser;
  token: string;
}

// Preserve the visual settings locally until profile updates have an API endpoint.
const SETTINGS_KEY = 'vpwa-chat.userSettings';
function toUser(user: ApiUser): User {
  return {
    ...user,
    notificationPreference: user.notificationPreference === 'mention' ? 'mentions' : 'all',
  };
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    // Compatibility for chat components; channel members will come from the API next.
    users: [] as User[],
    token: localStorage.getItem(TOKEN_STORAGE_KEY),
    sessionError: '',
  }),

  getters: {
    isAuthenticated: (state) => state.currentUser !== null && state.token !== null,
  },

  actions: {
    setCurrentUser(data: ApiUser) {
      const user = toUser(data);
      try {
        const settings = JSON.parse(
          localStorage.getItem(`${SETTINGS_KEY}.${user.id}`) ?? 'null',
        ) as { status?: User['status']; notificationPreference?: NotificationPreference } | null;
        if (settings?.status && ['online', 'dnd', 'offline'].includes(settings.status)) {
          user.status = settings.status;
        }
        if (
          settings?.notificationPreference === 'all' ||
          settings?.notificationPreference === 'mentions'
        ) {
          user.notificationPreference = settings.notificationPreference;
        }
      } catch {
        localStorage.removeItem(`${SETTINGS_KEY}.${user.id}`);
      }
      this.currentUser = user;
      this.users = [user];
      this.sessionError = '';
    },

    clearSession() {
      this.currentUser = null;
      this.users = [];
      this.token = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('vpwa-chat.currentUser');
    },

    async restoreSession() {
      // Legacy prototype sessions are not proof of authentication.
      localStorage.removeItem('vpwa-chat.currentUser');
      if (!this.token) return;
      try {
        const response = await api.get<ApiUser>('/auth/me');
        this.setCurrentUser(response.data);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          this.clearSession();
        } else {
          this.currentUser = null;
          this.sessionError = error instanceof Error ? error.message : 'Unable to restore session.';
        }
      }
    },

    async login(nickName: string, password: string) {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        nickName: nickName.trim(),
        password,
      });
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      this.token = data.token;
      this.setCurrentUser(data.user);
    },

    async register(payload: RegisterPayload) {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      this.token = data.token;
      this.setCurrentUser(data.user);
    },

    async logout() {
      try {
        await api.post('/auth/logout');
      } finally {
        this.clearSession();
      }
    },

    persistSession() {
      if (!this.currentUser) return;
      const { id, status, notificationPreference } = this.currentUser;
      localStorage.setItem(
        `${SETTINGS_KEY}.${id}`,
        JSON.stringify({ status, notificationPreference }),
      );
    },

    setStatus(status: User['status']) {
      if (!this.currentUser) return;
      this.currentUser.status = status;
      this.persistSession();
    },

    setNotificationPreference(preference: NotificationPreference) {
      if (!this.currentUser) return;
      this.currentUser.notificationPreference = preference;
      this.persistSession();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
