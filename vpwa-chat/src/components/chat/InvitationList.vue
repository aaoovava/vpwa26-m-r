<template>
  <div
    v-if="chat.myInvitations.length || chat.invitationsLoading || chat.invitationsError"
    class="q-mb-sm"
  >
    <q-item-label header>Invitations</q-item-label>
    <q-item v-if="chat.invitationsLoading" role="status">
      <q-item-section>Loading invitations...</q-item-section>
    </q-item>
    <q-banner v-if="chat.invitationsError" role="alert" class="bg-red-1 text-negative q-ma-sm">
      {{ chat.invitationsError }}
      <template #action>
        <q-btn
          flat
          label="Try again"
          :disable="chat.invitationsLoading"
          @click="chat.fetchInvitations()"
        />
      </template>
    </q-banner>
    <div
      v-for="invitation in chat.myInvitations"
      :key="invitation.id"
      class="bg-amber-1 q-pa-sm q-mx-sm q-mb-sm"
    >
      <div class="text-weight-medium invitation-name">
        <q-icon :name="invitation.channel.isPrivate ? 'lock' : 'tag'" />
        {{ invitation.channel.name }}
      </div>
      <div class="text-caption">Invited by {{ invitation.inviter.nickName }}</div>
      <div class="row q-gutter-xs q-mt-xs">
        <q-btn
          dense
          color="primary"
          label="Accept"
          :disable="!!respondingId"
          :loading="respondingId === invitation.id && accepting"
          @click="respond(invitation.id, true)"
        />
        <q-btn
          dense
          flat
          label="Decline"
          :disable="!!respondingId"
          :loading="respondingId === invitation.id && !accepting"
          @click="respond(invitation.id, false)"
        />
      </div>
      <div v-if="errorId === invitation.id" role="alert" class="text-negative text-caption q-mt-sm">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat-store';

const chat = useChatStore();
const emit = defineEmits<{ accepted: [] }>();
const respondingId = ref<string | null>(null);
const accepting = ref(false);
const errorId = ref<string | null>(null);
const error = ref('');

async function respond(id: string, accept: boolean) {
  if (respondingId.value) return;
  respondingId.value = id;
  accepting.value = accept;
  errorId.value = null;
  try {
    await chat.respondToInvitation(id, accept);
    if (accept) emit('accepted');
  } catch (cause) {
    errorId.value = id;
    error.value = cause instanceof Error ? cause.message : 'Unable to respond to invitation.';
  } finally {
    respondingId.value = null;
  }
}
</script>

<style scoped>
.invitation-name {
  overflow-wrap: anywhere;
}
</style>
