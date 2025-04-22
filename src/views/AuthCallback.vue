<template>
    <div class="auth-callback">
      <p v-if="!error">Signing you in…</p>
      <p v-else class="error">{{ error }}</p>
  
      <!-- your “pre” blocks from the snippet -->
      <div v-if="user">
        <div>
          Hello: <pre>{{ user.profile?.email }}</pre>
        </div>
        <div>
          Access token: <pre>{{ user.access_token }}</pre>
        </div>
        <div>
          ID token: <pre>{{ user.id_token }}</pre>
        </div>
        <div>
          Refresh token: <pre>{{ user.refresh_token }}</pre>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { userManager } from '@/services/authService';
  
  const user    = ref(null);
  const error   = ref(null);
  const router  = useRouter();
  
  onMounted(async () => {
    try {
      // this is the equivalent of userManager.signinCallback()
      user.value = await userManager.signinRedirectCallback();
  
      // you’ll probably want to persist these somewhere more
      localStorage.setItem('user', JSON.stringify({
        email:       user.value.profile.email,
        access_token: user.value.access_token,
        id_token:    user.value.id_token,
        refresh_token: user.value.refresh_token
      }));
  
      // then send them to your home/dashboard
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
  