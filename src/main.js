// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/global.css'

import surveyjs from './plugins/surveyjs'
import vueQRCode from './plugins/vueQRCode'

// NEW: bring in your auth service
import { userManager } from '@/services/authService';

const app = createApp(App);

// make userManager available via inject()
app.provide('userManager', userManager);

app.use(router)
app.use(store)
app.use(surveyjs)
app.use(vueQRCode)
app.mount('#app')
