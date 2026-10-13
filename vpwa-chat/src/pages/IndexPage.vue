<template>
  <q-page class="q-pa-md">
    <div class="text-h6">
      Welcome, {{ auth.currentUser?.nickName }}!
    </div>
    <p class="text-grey-7">
      The chat will appear here. Coming soon.
    </p>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth-store';
const auth = useAuthStore();
</script>