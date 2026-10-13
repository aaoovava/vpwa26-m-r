import { defineBoot } from '#q-app';
import { useAuthStore } from '@/stores/auth-store';

export default defineBoot(() => {
  const auth = useAuthStore();
  auth.restoreSession();
});