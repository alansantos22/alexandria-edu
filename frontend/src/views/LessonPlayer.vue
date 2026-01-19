<template>
  <div class="container">
    <button @click="$router.push('/home')">Back to Home</button>
    <div v-if="lesson">
      <h2>{{ lesson.title }}</h2>
      <div class="video-container">
        <iframe :src="lesson.video_url" frameborder="0" allowfullscreen></iframe>
      </div>
      <div v-if="lesson.material_link">
        <a :href="lesson.material_link" target="_blank" class="btn">Download Material</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const lesson = ref(null)
const user = JSON.parse(localStorage.getItem('user'))

onMounted(async () => {
  if (!user) {
      router.push('/')
      return
  }

  try {
    const lessonsRes = await axios.get(`/get_lessons.php?user_id=${user.id}`)
    const found = lessonsRes.data.find(l => l.id == route.params.id)
    if (found) {
        lesson.value = found
    } else {
        router.push('/home')
    }
  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
.container { padding: 20px; }
.video-container { margin: 20px 0; }
iframe { width: 100%; height: 400px; }
.btn { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
</style>
