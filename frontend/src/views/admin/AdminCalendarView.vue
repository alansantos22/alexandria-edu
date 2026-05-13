<template>
  <div class="admin-calendar">
    <header>
      <h2>Calendário (Admin)</h2>
      <button class="primary" @click="openCreate(null)">+ Nova aula ao vivo</button>
    </header>

    <FullCalendar v-if="calendarOptions" :options="calendarOptions" />

    <div v-if="modalOpen" class="modal-bg" @click.self="modalOpen = false">
      <div class="modal">
        <h3>{{ editing?.id ? 'Editar' : 'Nova' }} aula ao vivo</h3>
        <label>Título</label>
        <input v-model="form.title" />
        <label>Tema</label>
        <input v-model="form.theme" />
        <label>Turma (cohortId)</label>
        <input v-model="form.cohortId" placeholder="UUID da turma" />
        <label>Data e hora</label>
        <input type="datetime-local" v-model="form.startsAt" />
        <label>Duração (min)</label>
        <input type="number" v-model.number="form.durationMin" />
        <label>Provedor</label>
        <select v-model="form.provider">
          <option value="external_link">Link externo</option>
          <option value="livekit">LiveKit</option>
          <option value="zoom">Zoom</option>
          <option value="meet">Google Meet</option>
          <option value="youtube">YouTube ao vivo</option>
        </select>
        <label>URL externa (oculta dos alunos)</label>
        <input v-model="form.externalUrl" placeholder="https://…" />
        <div class="actions">
          <button @click="modalOpen = false">Cancelar</button>
          <button v-if="editing?.id" class="danger" @click="remove">Excluir</button>
          <button class="primary" @click="save">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { calendarService } from '../../core/services/calendar.service.js'
import { liveClassService } from '../../core/services/live-class.service.js'

const calendarOptions = shallowRef(null)
const modalOpen = ref(false)
const editing = ref(null)
const form = ref({})
let calendarApi = null

onMounted(() => {
  calendarOptions.value = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    firstDay: 1,
    height: 'auto',
    selectable: true,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    datesSet(arg) { calendarApi = arg.view.calendar },
    events: async (info, success, failure) => {
      try {
        const data = await calendarService.listAdminCalendar(info.startStr, info.endStr)
        success(data.map(e => ({
          id: e.id, title: e.title, start: e.startsAt, end: e.endsAt,
          backgroundColor: e.status === 'live' ? '#1aa260' : (e.status === 'ended' ? '#888' : '#2c7be5'),
          extendedProps: e,
        })))
      } catch (err) { failure(err) }
    },
    dateClick(info) { openCreate(info.dateStr) },
    eventClick(info) { openEdit(info.event.extendedProps) },
  }
})

function openCreate(dateStr) {
  editing.value = null
  form.value = {
    title: '', theme: '', cohortId: '',
    startsAt: dateStr ? dateStr.slice(0, 16) : new Date().toISOString().slice(0, 16),
    durationMin: 60, provider: 'external_link', externalUrl: '',
  }
  modalOpen.value = true
}

function openEdit(e) {
  editing.value = e
  form.value = {
    title: e.title, theme: e.theme || '', cohortId: e.cohortId,
    startsAt: new Date(e.startsAt).toISOString().slice(0, 16),
    durationMin: e.durationMin, provider: 'external_link', externalUrl: '',
  }
  modalOpen.value = true
}

async function save() {
  try {
    const payload = { ...form.value, startsAt: new Date(form.value.startsAt).toISOString() }
    if (editing.value?.id) await liveClassService.adminUpdate(editing.value.id, payload)
    else await liveClassService.adminCreate(payload)
    modalOpen.value = false
    calendarApi?.refetchEvents()
  } catch (err) {
    alert(err.response?.data?.message || err.message)
  }
}

async function remove() {
  if (!confirm('Excluir esta aula?')) return
  await liveClassService.adminDelete(editing.value.id)
  modalOpen.value = false
  calendarApi?.refetchEvents()
}
</script>

<style lang="scss" scoped>
.admin-calendar { padding: 16px;
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h2 { margin: 0; }
    .primary { padding: 8px 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
  }
}
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center;
  .modal { background: white; border-radius: 12px; padding: 24px; width: min(540px, 92vw);
    h3 { margin: 0 0 16px; }
    label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 0.9rem; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;
      button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #eee;
        &.primary { background: #2c7be5; color: white; }
        &.danger { background: #d33; color: white; }
      }
    }
  }
}
</style>
