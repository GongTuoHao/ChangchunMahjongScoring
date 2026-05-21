import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'

registerSW({
  onRegisterError(error) {
    console.error('PWA registration failed:', error)
  },
})

createApp(App).mount('#app')
