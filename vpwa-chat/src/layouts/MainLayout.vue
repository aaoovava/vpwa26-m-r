<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle channels"
          @click="drawerOpen = !drawerOpen"
        />
        <q-toolbar-title>vpwa-chat</q-toolbar-title>

        <q-btn-dropdown
          flat
          dense
          :label="auth.currentUser?.nickName"
          icon="account_circle"
        >
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup @click="onLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Sign out</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above bordered :width="280" :breakpoint="1023">
      <ChannelList @selected="onChannelSelected" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import ChannelList from '@/components/chat/ChannelList.vue';
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();
const drawerOpen = ref(false);

function onChannelSelected() {
  if ($q.screen.width <= 1023) drawerOpen.value = false;
}

async function onLogout() {
  auth.logout();
  await router.push({ name: 'login' });
}
</script>
