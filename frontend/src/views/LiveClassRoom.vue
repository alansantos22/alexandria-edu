<template>
  <div class="live-room">
    <div v-if="loading" class="state">Carregando…</div>
    <div v-else-if="!event" class="state">Aula não encontrada.</div>

    <template v-else>
      <header>
        <h1>{{ event.title }}</h1>
        <p v-if="event.theme">{{ event.theme }}</p>
        <p class="when">
          {{ fmt(event.startsAt) }} · {{ event.durationMin }} min
          <span class="status" :class="event.status">{{ event.status }}</span>
        </p>
      </header>

      <!-- Sem acesso -->
      <div v-if="!event.hasAccess" class="locked">
        <h2>🔒 Acesso necessário</h2>
        <p>Compre o produto para liberar essa aula.</p>
        <LockedEventModal :open="true" :event="event" @close="$router.push('/calendar')" />
      </div>

      <!-- Com acesso, ainda não no horário -->
      <div v-else-if="windowState === 'before'" class="waiting">
        <h2>⏰ A aula ainda não começou</h2>
        <p>O botão para entrar é liberado 15 minutos antes do horário marcado.</p>
        <p class="countdown">Começa em <strong>{{ countdown }}</strong></p>
      </div>

      <!-- Com acesso, na janela -->
      <div v-else-if="windowState === 'live'" class="join-area">
        <p>A aula está liberada para entrada. Clique abaixo para acessar:</p>
        <button class="primary" @click="join">▶ Entrar na aula</button>
        <p v-if="joinUrl" class="hint">Se não abrir, <a :href="joinUrl" target="_blank">clique aqui</a></p>
      </div>

      <!-- Encerrada com gravação -->
      <div v-else-if="event.hasRecording" class="recording">
        <h2>🎬 Gravação disponível</h2>
        <a :href="event.recordingUrl" target="_blank" class="primary">Assistir gravação</a>
      </div>

      <div v-else class="ended">
        <h2>A aula foi encerrada</h2>
        <p>A gravação será disponibilizada em breve.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LockedEventModal from '../components/shared/LockedEventModal.vue'
import { liveClassService } from '../core/services/live-class.service.js'

const route = useRoute()
const event = ref(null)
const loading = ref(true)
const now = ref(Date.now())
const joinUrl = ref(null)
let tick

onMounted(async () => {
  tick = setInterval(() => { now.value = Date.now() }, 1000)
  try {
    event.value = await liveClassService.get(route.params.id)
  } finally {
    loading.value = false
  }
})
onUnmounted(() => clearInterval(tick))

const startMs = computed(() => event.value ? new Date(event.value.startsAt).getTime() : 0)
const endMs   = computed(() => event.value ? startMs.value + event.value.durationMin * 60_000 : 0)
const windowOpensAt = computed(() => startMs.value - 15 * 60_000)
const windowClosesAt = computed(() => endMs.value + 30 * 60_000)

const windowState = computed(() => {
  if (!event.value) return null
  if (now.value < windowOpensAt.value) return 'before'
  if (now.value > windowClosesAt.value) return 'after'
  return 'live'
})

const countdown = computed(() => {
  const ms = windowOpensAt.value - now.value
  if (ms <= 0) return '0s'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
})

async function join() {
  try {
    const r = await liveClassService.requestJoinToken(route.params.id)
    joinUrl.value = r.joinUrl
    window.open(r.joinUrl, '_blank', 'noopener')
  } catch (err) {
    alert(err.response?.data?.message || 'Falha ao obter link da aula.')
  }
}

function fmt(d) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style lang="scss" scoped>
.live-room { max-width: 720px; margin: 0 auto; padding: 32px 24px;
  header h1 { margin: 0 0 6px; }
  .when { color: #666; .status { margin-left: 10px; padding: 2px 10px; border-radius: 12px; background: #eee; font-size: 0.8rem; text-transform: uppercase; } }
  .state, .ended { text-align: center; padding: 60px 20px; color: #888; }
  .locked, .waiting, .join-area, .recording { margin-top: 28px; padding: 28px; background: #f7f9fc; border-radius: 12px; text-align: center;
    h2 { margin: 0 0 10px; }
    .countdown { font-size: 1.4rem; margin-top: 18px; }
    .primary { padding: 14px 28px; background: #2c7be5; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    .hint { margin-top: 12px; font-size: 0.85rem; color: #888; a { color: #2c7be5; } }
  }
}
</style>
