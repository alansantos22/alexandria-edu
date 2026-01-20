import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Configure axios default
axios.defaults.baseURL = 'http://localhost:8000' // Assuming PHP server runs on port 8000

// Conditionally load mock
if (import.meta.env.VITE_USE_MOCK === 'true') {
    console.log('Running in MOCK mode')
    import('./mock').then(() => {
        mountApp()
    })
} else {
    mountApp()
}

function mountApp() {
    const app = createApp(App)
    app.use(router)
    app.mount('#app')
}
