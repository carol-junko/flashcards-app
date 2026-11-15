import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { registerServiceWorker, listenForInstallPrompt } from './utils/pwa'

const app = createApp(App)

app.use(router)

app.mount('#app')

// Installable app: offline support + "Install app" button
listenForInstallPrompt()
registerServiceWorker()
