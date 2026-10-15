<template>
  <q-btn-dropdown flat dense :aria-label="`${auth.currentUser?.nickName}: ${currentStatus.label}`">
    <template #label>
      <q-icon :name="currentStatus.icon" :color="currentStatus.color" class="q-mr-sm" />
      <span>{{ auth.currentUser?.nickName }} · {{ currentStatus.label }}</span>
    </template>

    <q-list style="min-width: 220px">
      <q-item-label header>Status</q-item-label>
      <q-item
        v-for="option in statusOptions"
        :key="option.value"
        v-close-popup
        clickable
        :active="auth.currentUser?.status === option.value"
        @click="auth.setStatus(option.value)"
      >
        <q-item-section avatar>
          <q-icon :name="option.icon" :color="option.color" />
        </q-item-section>
        <q-item-section>{{ option.label }}</q-item-section>
        <q-item-section v-if="auth.currentUser?.status === option.value" side>
          <q-icon name="check" color="primary" aria-label="Selected" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item-label header>Notifications</q-item-label>
      <q-item
        v-for="option in notificationOptions"
        :key="option.value"
        v-close-popup
        clickable
        :active="(auth.currentUser?.notificationPreference ?? 'all') === option.value"
        @click="auth.setNotificationPreference(option.value)"
      >
        <q-item-section avatar>
          <q-icon :name="option.icon" />
        </q-item-section>
        <q-item-section>{{ option.label }}</q-item-section>
        <q-item-section
          v-if="(auth.currentUser?.notificationPreference ?? 'all') === option.value"
          side
        >
          <q-icon name="check" color="primary" aria-label="Selected" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item v-close-popup clickable @click="emit('logout')">
        <q-item-section avatar>
          <q-icon name="logout" />
        </q-item-section>
        <q-item-section>Sign out</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationPreference, UserStatus } from '@/types/user';

const auth = useAuthStore();
const emit = defineEmits<{ logout: [] }>();
const notificationOptions: {
  value: NotificationPreference;
  label: string;
  icon: string;
}[] = [
  { value: 'all', label: 'All messages', icon: 'notifications' },
  { value: 'mentions', label: 'Only mentions of me', icon: 'alternate_email' },
];
const statusOptions: { value: UserStatus; label: string; icon: string; color: string }[] = [
  { value: 'online', label: 'Online', icon: 'circle', color: 'positive' },
  { value: 'dnd', label: 'DND', icon: 'do_not_disturb_on', color: 'negative' },
  { value: 'offline', label: 'Offline', icon: 'radio_button_unchecked', color: 'grey-5' },
];
const currentStatus = computed(
  () =>
    statusOptions.find((option) => option.value === auth.currentUser?.status) ?? {
      label: 'Offline',
      icon: 'radio_button_unchecked',
      color: 'grey-5',
    },
);
</script>
