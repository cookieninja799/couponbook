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
