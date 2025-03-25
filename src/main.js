// Import the createApp function from Vue 3
import { createApp } from 'vue'

// Import the root component
import App from './App.vue'

// Import the router and the Vuex store
import router from './router'
import store from './store'

// Import global styles (if any)
import './assets/styles/global.css'

// Optionally, import and use plugins
import surveyjs from './plugins/surveyjs'
import vueQRCode from './plugins/vueQRCode'

// Create the Vue application instance
const app = createApp(App)

// Register the router and store with the application
app.use(router)
app.use(store)

// Register any additional plugins
app.use(surveyjs)
app.use(vueQRCode)

// Mount the app to the #app element in index.html
app.mount('#app')
