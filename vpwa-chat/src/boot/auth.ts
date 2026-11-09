import { defineBoot } from '#q-app';
import { useAuthStore } from '@/stores/auth-store';

export default defineBoot(async ({ store }) => {
  const auth = useAuthStore(store);
  await auth.restoreSession();
});
