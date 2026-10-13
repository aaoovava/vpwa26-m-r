import { defineRouter } from '#q-app';
import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '@/stores/auth-store';

export default defineRouter(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory(),
  });

  Router.beforeEach((to) => {
    const auth = useAuthStore();

    // Route requires auth and user is not logged in
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    // Guest-only route and user is already logged in
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'home' };
    }

    return true;
  });

  return Router;
});