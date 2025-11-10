<!-- src/views/AuthCallback.vue -->
<template>
  <div class="auth-callback">
    <p v-if="!error">Signing you in…</p>
    <p v-else class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import api from '@/services/apiService';

const error = ref(null);
const store = useStore();
const router = useRouter();

onMounted(async () => {
  try {
    await store.dispatch('auth/handleCallback');
    // 1) Sync Cognito → DB (upsert user) using the ID token
    const idToken = store.state.auth.user?.id_token; // set by oidc-client-ts
    if (idToken) {
      await api.post('/users/sync', {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
    }
    // 2) Go home
    router.replace({ name: 'Home' });
  } catch (e) {
    error.value = e.message || 'Authentication failed';
  }
});
</script>

<style scoped>
.auth-callback {
  padding: 2rem;
  text-align: center;
}

.error {
  color: red;
}
</style>
