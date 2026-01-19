<template>
  <div class="container">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div>
        <label>Name:</label>
        <input v-model="name" type="text" required />
      </div>
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Register</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
    <p>Already have an account? <router-link to="/">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const router = useRouter()

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  try {
    const response = await axios.post('/register.php', {
      name: name.value,
      email: email.value,
      password: password.value
    })

    if (response.data.success) {
      success.value = 'Registration successful! Please login.'
      setTimeout(() => router.push('/'), 2000)
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed'
  }
}
</script>

<style scoped>
.container { max-width: 400px; margin: 0 auto; padding: 20px; }
.error { color: red; }
.success { color: green; }
div { margin-bottom: 15px; }
</style>
