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

    // 4) Special logic: if landing on homepage, redirect to their coupon book if they have one
    if (redirectPath === "/") {
      try {
        const token = store.state.auth.user?.access_token;
        if (token) {
          const res = await api.get('/groups/my/purchases', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const purchases = res.data || [];
          const now = new Date();

          // Active coupon books: status === 'paid' and not expired
          const activePurchases = purchases.filter(p => {
            if (p.status !== 'paid') return false;
            if (!p.expiresAt) return true;
            const exp = new Date(p.expiresAt);
            return !isNaN(exp.getTime()) && exp >= now;
          });

          if (activePurchases.length === 1) {
            redirectPath = `/foodie-group/${activePurchases[0].groupId}`;
          } else if (activePurchases.length > 1) {
            redirectPath = "/coupon-book?my=1";
          }
        }
      } catch (e) {
        console.error("Error fetching purchases for redirect:", e);
      }
    }

    console.log("🔁 Redirecting user back to:", redirectPath);

    // 5) Send user back to original page
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
