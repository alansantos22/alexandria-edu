<template>
  <div class="container">
    <div class="header">
      <h2>Admin Dashboard</h2>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    <!-- Live Link Section -->
    <div class="section">
      <h3>Live Meeting URL</h3>
      <div class="form-row">
        <input v-model="liveLink" type="text" placeholder="https://meet.google.com/..." />
        <button @click="updateLink">Update</button>
      </div>
      <p v-if="linkMessage" :class="{'success': linkSuccess, 'error': !linkSuccess}">{{ linkMessage }}</p>
    </div>

    <!-- Library Upload Section -->
    <div class="section">
      <h3>Upload to Library</h3>
      <form @submit.prevent="uploadToLibrary">
        <div class="form-group">
          <label>Title:</label>
          <input v-model="libraryTitle" type="text" required />
        </div>
        <div class="form-group">
          <label>File (PDF/Ebook):</label>
          <input type="file" @change="handleFileChange" required />
        </div>
        <button type="submit" :disabled="uploading">Upload</button>
      </form>
      <p v-if="libraryMessage" :class="{'success': librarySuccess, 'error': !librarySuccess}">{{ libraryMessage }}</p>
    </div>

    <!-- Manage Lessons Section -->
    <div class="section">
      <h3>Manage Lessons</h3>
      <div v-if="lessons.length === 0">No lessons found.</div>
      <div v-for="lesson in lessons" :key="lesson.id" class="lesson-editor">
        <h4>{{ lesson.title }}</h4>
        <div class="form-group">
            <label>Title:</label>
            <input v-model="lesson.title" type="text" />
        </div>
        <div class="form-group">
            <label>Video URL:</label>
            <input v-model="lesson.video_url" type="text" />
        </div>
        <div class="form-group">
            <label>Material Link:</label>
            <input v-model="lesson.material_link" type="text" placeholder="URL to material" />
        </div>
        <button @click="updateLesson(lesson)">Save Changes</button>
        <span v-if="lesson.message" :class="{'success': lesson.success, 'error': !lesson.success}" style="margin-left: 10px;">{{ lesson.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Live Link
const liveLink = ref('')
const linkMessage = ref('')
const linkSuccess = ref(false)

// Library
const libraryTitle = ref('')
const libraryFile = ref(null)
const libraryMessage = ref('')
const librarySuccess = ref(false)
const uploading = ref(false)

// Lessons
const lessons = ref([])

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user'))

onMounted(async () => {
    if (!user || user.role !== 'admin') {
        router.push('/')
        return
    }

    fetchLiveLink()
    fetchLessons()
})

const fetchLiveLink = async () => {
    try {
        const res = await axios.get('/get_live_link.php')
        liveLink.value = res.data.url
    } catch (err) {
        console.error(err)
    }
}

const fetchLessons = async () => {
    try {
        // As admin, we can use the same endpoint but we need to ensure we get all data.
        // Currently get_lessons checks for active user, which admin is.
        // And it simulates auth by user_id.
        const res = await axios.get(`/get_lessons.php?user_id=${user.id}`)
        lessons.value = res.data.map(l => ({...l, message: '', success: false}))
    } catch (err) {
        console.error(err)
    }
}

const updateLink = async () => {
    linkMessage.value = ''
    try {
        const res = await axios.post('/update_link.php', {
            user_id: user.id,
            link: liveLink.value
        })
        if (res.data.success) {
            linkSuccess.value = true
            linkMessage.value = 'Link updated successfully'
        }
    } catch (err) {
        linkSuccess.value = false
        linkMessage.value = err.response?.data?.error || 'Failed to update'
    }
}

const handleFileChange = (e) => {
    libraryFile.value = e.target.files[0]
}

const uploadToLibrary = async () => {
    if (!libraryFile.value) return
    uploading.value = true
    libraryMessage.value = ''

    const formData = new FormData()
    formData.append('user_id', user.id)
    formData.append('title', libraryTitle.value)
    formData.append('file', libraryFile.value)

    try {
        const res = await axios.post('/upload_library.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data.success) {
            librarySuccess.value = true
            libraryMessage.value = 'Upload successful'
            libraryTitle.value = ''
            libraryFile.value = null
            // Reset file input manually if needed or just rely on v-model/ref reset
        }
    } catch (err) {
        librarySuccess.value = false
        libraryMessage.value = err.response?.data?.error || 'Upload failed'
    } finally {
        uploading.value = false
    }
}

const updateLesson = async (lesson) => {
    lesson.message = ''
    try {
        const res = await axios.post('/update_lesson.php', {
            user_id: user.id,
            lesson_id: lesson.id,
            title: lesson.title,
            video_url: lesson.video_url,
            material_link: lesson.material_link
        })

        if (res.data.success) {
            lesson.success = true
            lesson.message = 'Saved'
        }
    } catch (err) {
        lesson.success = false
        lesson.message = 'Error'
        console.error(err)
    }
}

const logout = () => {
    localStorage.removeItem('user')
    router.push('/')
}
</script>

<style scoped>
.container { padding: 20px; max-width: 800px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.section { border: 1px solid #ddd; padding: 20px; margin-bottom: 30px; border-radius: 8px; background: #fff; }
.form-row { display: flex; gap: 10px; margin-bottom: 10px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input { width: 100%; padding: 8px; box-sizing: border-box; }
.lesson-editor { border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px; }
button { padding: 8px 16px; cursor: pointer; }
.success { color: green; }
.error { color: red; }
.logout-btn { background: #dc3545; color: white; border: none; border-radius: 4px; }
</style>
