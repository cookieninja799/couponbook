<!-- src/views/AuthCallback.vue -->
<template>
  <div class="auth-callback">
    <p v-if="!error">Signing you in…</p>
    <p v-else class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref }   from 'vue';
import { useRouter }        from 'vue-router';
import { useStore }         from 'vuex';

const error  = ref(null);
const store  = useStore();
const router = useRouter();

onMounted(async () => {
  try {
    await store.dispatch('auth/handleCallback');
    // now that state.auth.user is set, go home
    router.replace({ name: 'Home' });
  } catch (e) {
    error.value = e.message || 'Authentication failed';
  }
});
</script>

<style scoped>
.auth-callback { padding: 2rem; text-align: center; }
.error         { color: red; }
</style>
