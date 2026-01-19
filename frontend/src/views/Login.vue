<template>
  <div class="container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  try {
    const response = await axios.post('/login.php', {
      email: email.value,
      password: password.value
    })

    if (response.data.success) {
      const user = {
        id: response.data.user_id,
        is_active: response.data.is_active,
        role: response.data.role
      }
      localStorage.setItem('user', JSON.stringify(user))

      if (user.role === 'admin') {
          router.push('/admin')
      } else if (user.is_active) {
        router.push('/home')
      } else {
        router.push('/checkout')
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  }
}
</script>

<style scoped>
.container { max-width: 400px; margin: 0 auto; padding: 20px; }
.error { color: red; }
div { margin-bottom: 15px; }
</style>
