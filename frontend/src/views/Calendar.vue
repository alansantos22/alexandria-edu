<template>
  <div class="calendar-view">
    <header>
      <h1>📅 Calendário de aulas</h1>
      <p>Veja todas as aulas ao vivo agendadas. Aulas com <strong>cadeado 🔒</strong> requerem matrícula.</p>
    </header>

    <FullCalendar v-if="calendarOptions" :options="calendarOptions" />

    <LockedEventModal
      :open="modalOpen"
      :event="selectedEvent"
      @close="modalOpen = false"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import LockedEventModal from '../components/shared/LockedEventModal.vue'
import { calendarService } from '../core/services/calendar.service.js'

const router = useRouter()
const calendarOptions = shallowRef(null)
const modalOpen = ref(false)
const selectedEvent = ref({})

onMounted(() => {
  calendarOptions.value = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    firstDay: 1,
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' },
    events: async (info, success, failure) => {
      try {
        const data = await calendarService.listMyCalendar(info.startStr, info.endStr)
        success(data.map(e => ({
          id: e.id,
          title: (e.hasAccess ? '' : '🔒 ') + e.title,
          start: e.startsAt,
          end: e.endsAt,
          backgroundColor: e.hasAccess ? '#2c7be5' : '#888',
          borderColor: e.hasAccess ? '#2c7be5' : '#888',
          extendedProps: e,
        })))
      } catch (err) {
        failure(err)
      }
    },
    eventClick(info) {
      const ev = info.event.extendedProps
      if (ev.hasAccess) {
        router.push(`/live/${ev.id}`)
      } else {
        selectedEvent.value = ev
        modalOpen.value = true
      }
    },
  }
})
</script>

<style lang="scss" scoped>
.calendar-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  header { margin-bottom: 20px;
    h1 { margin: 0 0 6px; }
    p { color: #555; margin: 0; }
  }
}
</style>
