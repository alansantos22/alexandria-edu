<template>
  <div class="container">
    <div class="header">
      <h1>Mentorship Home</h1>
      <button @click="logout">Logout</button>
    </div>

    <div v-if="liveLink" class="live-card">
      <h3>Live Mentorship Session</h3>
      <p>Join the live session now!</p>
      <a :href="liveLink" target="_blank" class="btn">Enter Mentorship Now</a>
    </div>

    <div class="lessons-list">
      <h3>Lessons</h3>
      <div v-for="lesson in lessons" :key="lesson.id" class="lesson-card">
        <h4>{{ lesson.title }}</h4>
        <p>{{ lesson.description }}</p>
        <router-link :to="'/lesson/' + lesson.id">Watch Video</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const liveLink = ref('')
const lessons = ref([])
const router = useRouter()
const user = JSON.parse(localStorage.getItem('user'))

onMounted(async () => {
  if (!user) {
      router.push('/')
      return
  }

  try {
    // Get live link
    const linkRes = await axios.get('/get_live_link.php')
    liveLink.value = linkRes.data.url

    // Get lessons
    const lessonsRes = await axios.get(`/get_lessons.php?user_id=${user.id}`)
    lessons.value = lessonsRes.data
  } catch (err) {
    console.error(err)
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        router.push('/')
    }
  }
})

const logout = () => {
    localStorage.removeItem('user')
    router.push('/')
}
</script>

<style scoped>
.container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; }
.live-card { background: #e0f7fa; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
.btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
.lesson-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
</style>
