<template>
  <div class="container">
    <div class="header">
      <h2>Event Calendar</h2>
      <button @click="$router.push('/home')">Back to Home</button>
    </div>

    <div class="calendar-controls">
      <button @click="changeMonth(-1)">&lt; Prev</button>
      <span>{{ currentMonthName }} {{ currentYear }}</span>
      <button @click="changeMonth(1)">Next &gt;</button>
    </div>

    <div class="calendar-grid">
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>

      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="day-cell"
        :class="{ 'other-month': !day.isCurrentMonth, 'has-events': day.events.length > 0 }"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>
        <div v-for="event in day.events" :key="event.id" class="event-marker" @click="openEvent(event)">
          {{ event.title }}
        </div>
      </div>
    </div>

    <!-- Modal/Tooltip -->
    <div v-if="selectedEvent" class="modal-overlay" @click.self="selectedEvent = null">
      <div class="modal">
        <h3>{{ selectedEvent.title }}</h3>
        <p><strong>Start:</strong> {{ formatDateTime(selectedEvent.event_start) }}</p>
        <p><strong>End:</strong> {{ formatDateTime(selectedEvent.event_end) }}</p>
        <p>{{ selectedEvent.description }}</p>

        <div class="actions">
          <a :href="googleCalendarLink(selectedEvent)" target="_blank" class="google-btn">
            Add to Google Calendar
          </a>
          <button @click="selectedEvent = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user'))

const events = ref([])
const currentDate = ref(new Date())
const selectedEvent = ref(null)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

onMounted(async () => {
    if (!user) {
        router.push('/')
        return
    }

    try {
        const res = await axios.get(`/get_events.php?user_id=${user.id}`)
        events.value = res.data
    } catch (err) {
        console.error(err)
    }
})

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonthName = computed(() => currentDate.value.toLocaleString('default', { month: 'long' }))

const changeMonth = (offset) => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + offset, 1)
}

const calendarDays = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const days = []

    // Previous month days
    const startDayOfWeek = firstDayOfMonth.getDay()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i)
        days.push({ date, isCurrentMonth: false, events: [] })
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i)
        const dayEvents = events.value.filter(e => {
            const eDate = new Date(e.event_start)
            return eDate.getDate() === i && eDate.getMonth() === month && eDate.getFullYear() === year
        })
        days.push({ date, isCurrentMonth: true, events: dayEvents })
    }

    // Next month days to fill grid (optional, filling to 42 cells is common)
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date, isCurrentMonth: false, events: [] })
    }

    return days
})

const openEvent = (event) => {
    selectedEvent.value = event
}

const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString()
}

const googleCalendarLink = (event) => {
    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "")
    }

    const start = formatDate(new Date(event.event_start))
    const end = formatDate(new Date(event.event_end))

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        details: event.description,
        dates: `${start}/${end}`,
        // location: '' // Optional
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
}
</script>

<style scoped>
.container { padding: 20px; max-width: 900px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.calendar-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-weight: bold; font-size: 1.2em; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid #ddd; }
.day-header { background: #f0f0f0; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; font-weight: bold; }
.day-cell { min-height: 100px; padding: 5px; border-right: 1px solid #eee; border-bottom: 1px solid #eee; position: relative; }
.day-cell:nth-child(7n) { border-right: none; }
.other-month { background: #f9f9f9; color: #ccc; }
.day-number { font-weight: bold; font-size: 0.9em; }
.event-marker { background: #007bff; color: white; padding: 2px 5px; margin-top: 5px; border-radius: 4px; font-size: 0.8em; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-marker:hover { background: #0056b3; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal { background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.actions { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }
.google-btn { background: #4285F4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 0.9em; }
.google-btn:hover { background: #357ae8; }
</style>
