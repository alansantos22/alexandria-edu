<template>
  <div class="container">
    <div class="header">
      <h2>Library</h2>
      <button @click="$router.push('/home')">Back to Home</button>
    </div>

    <div v-if="items.length === 0" class="empty">
      No items in the library yet.
    </div>

    <div class="library-grid">
      <div v-for="item in items" :key="item.id" class="library-item">
        <h3>{{ item.title }}</h3>
        <p class="date">Uploaded: {{ new Date(item.created_at).toLocaleDateString() }}</p>
        <a :href="item.file_path" target="_blank" class="btn" download>Download / View</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const items = ref([])
const router = useRouter()
const user = JSON.parse(localStorage.getItem('user'))

onMounted(async () => {
    if (!user) {
        router.push('/')
        return
    }

    try {
        const res = await axios.get(`/get_library.php?user_id=${user.id}`)
        items.value = res.data
    } catch (err) {
        console.error(err)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
             router.push('/')
        }
    }
})
</script>

<style scoped>
.container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.library-item { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }
.btn { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px; }
.date { font-size: 0.8em; color: #666; }
</style>
