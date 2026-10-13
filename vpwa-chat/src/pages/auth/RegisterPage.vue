<template>
  <q-page
    class="flex flex-center q-pa-none q-pa-sm-md"
    :class="$q.screen.xs ? 'bg-white' : 'bg-grey-2'"
  >
    <q-card
      class="auth-card full-width"
      style="max-width: 480px"
      :square="$q.screen.xs"
      :flat="$q.screen.xs"
    >
      <q-card-section class="bg-primary text-white text-center q-pa-lg">
        <q-avatar
          size="60px"
          color="white"
          text-color="primary"
          icon="person_add"
        />
        <div class="text-h5 text-weight-medium q-mt-md">Create account</div>
        <div class="text-body2 text-white" style="opacity: 0.85">
          Join vpwa-chat in a few seconds
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-form class="row q-col-gutter-x-md q-col-gutter-y-xs" @submit.prevent="onSubmit">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.firstName"
              label="First name"
              autocomplete="given-name"
              outlined
              dense
              lazy-rules
              :rules="[(v: string) => !!v || 'Required']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.lastName"
              label="Last name"
              autocomplete="family-name"
              outlined
              dense
              lazy-rules
              :rules="[(v: string) => !!v || 'Required']"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.nickName"
              label="Nickname"
              autocomplete="username"
              outlined
              dense
              lazy-rules
              :rules="[
                (v: string) => !!v || 'Required',
                (v: string) => v.length >= 3 || 'At least 3 characters',
              ]"
            >
              <template #prepend><q-icon name="alternate_email" /></template>
            </q-input>
          </div>

          <div class="col-12">
            <q-input
              v-model="form.email"
              label="Email"
              type="email"
              autocomplete="email"
              outlined
              dense
              lazy-rules
              :rules="[
                (v: string) => !!v || 'Required',
                (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
              ]"
            >
              <template #prepend><q-icon name="mail" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.password"
              label="Password"
              autocomplete="new-password"
              outlined
              dense
              lazy-rules
              :type="showPassword ? 'text' : 'password'"
              :rules="[
                (v: string) => !!v || 'Required',
                (v: string) => v.length >= 6 || 'At least 6 characters',
              ]"
            >
              <template #append>
                <q-icon
                  class="cursor-pointer"
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.passwordConfirm"
              label="Confirm password"
              autocomplete="new-password"
              outlined
              dense
              lazy-rules
              :type="showPassword ? 'text' : 'password'"
              :rules="[
                (v: string) => !!v || 'Required',
                (v: string) => v === form.password || 'Passwords do not match',
              ]"
            />
          </div>

          <div v-if="errorMessage" class="col-12">
            <q-banner dense rounded class="bg-red-1 text-red-9">
              <template #avatar>
                <q-icon name="error" color="red-9" />
              </template>
              {{ errorMessage }}
            </q-banner>
          </div>

          <div class="col-12 q-mt-sm">
            <q-btn
              type="submit"
              label="Create account"
              color="primary"
              class="full-width"
              no-caps
              unelevated
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center q-py-sm">
        <span class="text-grey-7">Already have an account?</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Sign in"
          class="q-ml-xs"
          :to="{ name: 'login' }"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  nickName: '',
  email: '',
  password: '',
  passwordConfirm: '',
});

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    auth.register({
      firstName: form.firstName,
      lastName: form.lastName,
      nickName: form.nickName,
      email: form.email,
    });

    $q.notify({
      type: 'positive',
      message: 'Registration successful!',
    });

    await router.push({ name: 'home' });
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