<template>
  <q-dialog v-model="open">
    <q-card class="members-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Members of #{{ channelName }}</div>
        <q-space />
        <q-btn flat round dense icon="close" aria-label="Close" v-close-popup />
      </q-card-section>

      <q-card-section>
        <div v-if="members.length === 0" class="text-grey-7">
          No members to show.
        </div>

        <q-list v-else separator>
          <q-item v-for="member in members" :key="member.id">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" size="36px">
                {{ member.nickName.charAt(0).toUpperCase() }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ member.nickName }}</q-item-label>
              <q-item-label caption>
                {{ member.isOwner ? 'Owner' : 'Member' }}
              </q-item-label>
            </q-item-section>

            <q-item-section v-if="member.nickName === currentUserNick" side>
              <q-badge color="primary" label="You" />
            </q-item-section>
          </q-item>
        </q-list>

        <div class="text-caption text-grey-7 q-mt-md">
          {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth-store';

interface MemberInfo {
  id: string;
  nickName: string;
  isOwner: boolean;
}

defineProps<{
  channelName: string;
  members: MemberInfo[];
}>();

const open = defineModel<boolean>({ default: false });
const auth = useAuthStore();

const currentUserNick = computed(() => auth.currentUser?.nickName ?? '');
</script>

<style scoped>
.members-dialog {
  width: 420px;
  max-width: calc(100vw - 32px);
}
</style>