<template>
  <div class="container">
    <h2>Admin Dashboard</h2>
    <div class="link-updater">
      <label>Live Meeting URL:</label>
      <input v-model="liveLink" type="text" placeholder="https://meet.google.com/..." />
      <button @click="updateLink">Update Link</button>
    </div>
    <p v-if="message" :class="{'success': success, 'error': !success}">{{ message }}</p>
    <button @click="logout" style="margin-top: 20px;">Logout</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const liveLink = ref('')
const message = ref('')
const success = ref(false)
const router = useRouter()
const user = JSON.parse(localStorage.getItem('user'))

onMounted(async () => {
    if (!user || user.role !== 'admin') {
        router.push('/')
        return
    }

    // Fetch current link
    try {
        const res = await axios.get('/get_live_link.php')
        liveLink.value = res.data.url
    } catch (err) {
        console.error(err)
    }
})

const updateLink = async () => {
    message.value = ''
    try {
        const res = await axios.post('/update_link.php', {
            user_id: user.id,
            link: liveLink.value
        })
        if (res.data.success) {
            success.value = true
            message.value = 'Link updated successfully'
        }
    } catch (err) {
        success.value = false
        message.value = err.response?.data?.error || 'Failed to update'
    }
}

const logout = () => {
    localStorage.removeItem('user')
    router.push('/')
}
</script>

<style scoped>
.container { padding: 20px; max-width: 600px; margin: 0 auto; }
.link-updater { display: flex; gap: 10px; margin-top: 20px; }
input { flex: 1; padding: 5px; }
.success { color: green; }
.error { color: red; }
</style>
