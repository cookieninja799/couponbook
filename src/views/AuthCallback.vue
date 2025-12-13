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
    // 1) Handle OIDC callback (Cognito → SPA)
    await store.dispatch('auth/handleCallback');

    // 2) Sync Cognito user → DB using ID token
    const idToken = store.state.auth.user?.id_token;
    if (idToken) {
      await api.post('/users/sync', {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
    }

    // 3) Read the redirect we saved before the user logged in
    let redirectPath = localStorage.getItem("postLoginRedirect");

    // Remove so it never loops or reuses
    localStorage.removeItem("postLoginRedirect");

    // ⚠️ Security: Only allow internal redirects
    if (!redirectPath || !redirectPath.startsWith("/")) {
      redirectPath = "/";
    }

    console.log("🔁 Redirecting user back to:", redirectPath);

    // 4) Send user back to original page
    router.replace(redirectPath);

  } catch (e) {
    console.error("Callback error:", e);
    error.value = e.message || 'Authentication failed';
  }
});
</script>

<style scoped>
.auth-callback {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-primary);
}
.error {
  color: var(--color-error);
}
</style>
