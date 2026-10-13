<template>
  <q-page
    class="flex flex-center q-pa-none q-pa-sm-md"
    :class="$q.screen.xs ? 'bg-white' : 'bg-grey-2'"
  >
    <q-card
      class="auth-card full-width"
      style="max-width: 420px"
      :square="$q.screen.xs"
      :flat="$q.screen.xs"
    >
      <q-card-section class="bg-primary text-white text-center q-pa-lg">
        <q-avatar size="60px" color="white" text-color="primary" icon="forum" />
        <div class="text-h5 text-weight-medium q-mt-md">Sign in</div>
        <div class="text-body2 text-white" style="opacity: 0.85">
          Welcome back to vpwa-chat
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.nickName"
            label="Nickname"
            autocomplete="username"
            outlined
            dense
            lazy-rules
            :rules="[(v: string) => !!v || 'Please enter your nickname']"
          >
            <template #prepend><q-icon name="person" /></template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Password"
            autocomplete="current-password"
            outlined
            dense
            lazy-rules
            :type="showPassword ? 'text' : 'password'"
            :rules="[(v: string) => !!v || 'Please enter your password']"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon
                class="cursor-pointer"
                :name="showPassword ? 'visibility_off' : 'visibility'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-banner
            v-if="errorMessage"
            dense
            rounded
            class="bg-red-1 text-red-9"
          >
            <template #avatar>
              <q-icon name="error" color="red-9" />
            </template>
            {{ errorMessage }}
          </q-banner>

          <q-btn
            type="submit"
            label="Sign in"
            color="primary"
            class="full-width"
            no-caps
            unelevated
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center q-py-sm">
        <span class="text-grey-7">Don't have an account?</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Sign up"
          class="q-ml-xs"
          :to="{ name: 'register' }"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const auth = useAuthStore();

const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

const form = reactive({
  nickName: '',
  password: '',
});

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    // Phase 1: password is not validated yet
    auth.login(form.nickName);

    $q.notify({
      type: 'positive',
      message: `Welcome, ${form.nickName}!`,
      icon: 'check',
    });

    // Return to originally requested page if any
    const redirect = route.query.redirect as string | undefined;
    await router.push(redirect ?? { name: 'home' });
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.auth-card {
  border-radius: 16px;
  overflow: hidden;

  // phones: square, edge-to-edge card (set by the :square prop)
  &.q-card--square {
    border-radius: 0;
  }
}
</style>