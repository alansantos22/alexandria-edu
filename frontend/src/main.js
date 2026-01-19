import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './mock' // Import the mock setup to intercept requests

// Configure axios default
axios.defaults.baseURL = 'http://localhost:8000' // Assuming PHP server runs on port 8000

const app = createApp(App)
app.use(router)
app.mount('#app')
