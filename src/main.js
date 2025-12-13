// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { surveyPlugin } from 'survey-vue3-ui'
import 'survey-core/survey-core.css'
import 'primeicons/primeicons.css'
import './assets/styles/global.css'

import surveyjs from './plugins/surveyjs'
import vueQRCode from './plugins/vueQRCode'
import { userManager } from '@/services/authService';

// Initialize theme before app mount to avoid flash
function initializeTheme() {
  // Priority: 1) localStorage, 2) system preference, 3) default to light
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', savedTheme);
    return;
  }
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    // Default to light mode
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

// Initialize theme immediately
initializeTheme();

const app = createApp(App);

// make userManager available via inject()
app.provide('userManager', userManager);

app.use(router);
app.use(store);
app.use(surveyjs);
app.use(surveyPlugin);
app.use(vueQRCode);

(async () => {
  // hydrate auth from existing oidc session (if any)
  await store.dispatch('auth/initialize');
  // ensure initial route is ready
  await router.isReady();
  app.mount('#app');
})();
