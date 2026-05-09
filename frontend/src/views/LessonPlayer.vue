<template>
  <div class="p-player-root">
    <!-- ── Appbar ── -->
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo"><PlayCircle :size="20" /></span>
        <span>Alexandria <small class="u-text--muted">Player</small></span>
      </div>
      <div class="c-appbar__actions">
        <!-- Streak badge -->
        <span v-if="progress.streakDays > 0" class="c-badge c-badge--gold p-player__streak">
          🔥 {{ progress.streakDays }} {{ progress.streakDays === 1 ? 'dia' : 'dias' }}
        </span>
        <!-- XP badge -->
        <span class="c-badge c-badge--secondary u-hide-sm">
          ⚡ {{ progress.xp }} XP · Lv{{ progress.level }}
        </span>
        <button class="c-btn c-btn--ghost c-btn--sm" @click="$router.push('/home')">
          <ArrowLeft :size="16" /> Voltar
        </button>
      </div>
    </header>

    <!-- ── Layout: player + sidebar ── -->
    <div class="p-player-layout" v-if="lesson">

      <!-- ── Main area ── -->
      <main class="p-player-main a-fade-in-up">
        <!-- Progress bar -->
        <div class="p-player__progress-bar-wrap">
          <div class="p-player__progress-bar-track">
            <div
              class="p-player__progress-bar-fill"
              :style="{ width: progress.percentComplete + '%' }"
            ></div>
          </div>
          <span class="p-player__progress-label">{{ progress.percentComplete }}% concluído</span>
        </div>

        <section class="p-lesson__head">
          <p class="u-text--eyebrow"><BookOpen :size="14" /> Aula {{ currentIndex + 1 }} de {{ progress.lessons.length }}</p>
          <h1 class="p-lesson__title">{{ lesson.title }}</h1>
        </section>

        <!-- Video -->
        <section class="c-card p-lesson__player">
          <div class="p-lesson__video">
            <iframe
              :src="lesson.videoUrl"
              frameborder="0"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
        </section>

        <!-- About -->
        <section v-if="lesson.description" class="c-card p-lesson__about">
          <p class="u-text--eyebrow"><FileText :size="14" /> Sobre esta aula</p>
          <p class="p-lesson__desc">{{ lesson.description }}</p>
        </section>

        <!-- Actions -->
        <section class="p-lesson__actions">
          <a
            v-if="lesson.materialLink"
            :href="lesson.materialLink"
            target="_blank"
            rel="noopener"
            class="c-btn c-btn--secondary"
          >
            <Download :size="18" /> Baixar material
          </a>
          <button
            class="c-btn"
            :class="currentLessonCompleted ? 'c-btn--ghost' : 'c-btn--primary'"
            :disabled="completingLesson"
            @click="completeLesson"
          >
            <CheckCircle :size="18" />
            {{ currentLessonCompleted ? 'Já concluída ✓' : (completingLesson ? 'Salvando…' : 'Marcar como concluída') }}
          </button>
          <button v-if="nextLesson" class="c-btn c-btn--ghost" @click="goToLesson(nextLesson.id)">
            Próxima <ChevronRight :size="16" />
          </button>
        </section>

        <!-- Auto-play countdown -->
        <div v-if="autoplayCountdown > 0" class="p-player__autoplay c-card">
          <p>▶ Próxima aula: <strong>{{ nextLesson?.title }}</strong></p>
          <p class="p-player__autoplay-timer">Iniciando em <strong>{{ autoplayCountdown }}s</strong></p>
          <div class="p-player__autoplay-track">
            <div class="p-player__autoplay-fill" :style="{ width: ((5 - autoplayCountdown) / 5 * 100) + '%' }"></div>
          </div>
          <button class="c-btn c-btn--ghost c-btn--sm" @click="cancelAutoplay">Cancelar</button>
        </div>
      </main>

      <!-- ── Sidebar ── -->
      <aside class="p-player-sidebar">
        <div class="p-player-sidebar__header">
          <p class="u-text--eyebrow"><Library :size="14" /> Conteúdo do curso</p>
          <div class="p-player-sidebar__progress-mini">
            <div class="p-player-sidebar__mini-track">
              <div class="p-player-sidebar__mini-fill" :style="{ width: progress.percentComplete + '%' }"></div>
            </div>
            <span>{{ progress.completedCount }}/{{ progress.totalCount }}</span>
          </div>
        </div>

        <nav class="p-player-sidebar__list">
          <button
            v-for="(item, index) in progress.lessons"
            :key="item.id"
            class="p-player-sidebar__item"
            :class="{
              'is-active':    item.id === lesson.id,
              'is-completed': item.completed,
            }"
            @click="goToLesson(item.id)"
          >
            <span class="p-player-sidebar__icon">
              <CheckCircle v-if="item.completed" :size="16" />
              <PlayCircle  v-else-if="item.id === lesson.id" :size="16" />
              <Circle      v-else :size="16" />
            </span>
            <span class="p-player-sidebar__text">
              <span class="p-player-sidebar__num">{{ index + 1 }}.</span>
              {{ item.title }}
            </span>
          </button>
        </nav>
      </aside>
    </div>

    <!-- Loading -->
    <main v-else class="l-container p-lesson__loading">
      <Loader :size="32" class="a-pulse-glow" />
      <p>Carregando aula…</p>
    </main>

    <!-- ── XP Popup ── -->
    <Transition name="xp-pop">
      <div v-if="xpPopup.visible" class="p-player__xp-popup">
        <span class="p-player__xp-icon">⚡</span>
        <span>+{{ xpPopup.amount }} XP</span>
        <span v-if="xpPopup.levelUp" class="p-player__xp-level">Nível {{ progress.level }} 🎉</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/core/api'
import {
  PlayCircle, ArrowLeft, BookOpen, FileText, Download, Loader,
  CheckCircle, ChevronRight, Circle, Library,
} from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()
const lesson = ref(null)
const user   = JSON.parse(localStorage.getItem('user') || 'null')

const progress = ref({
  lessons: [],
  completedCount: 0,
  totalCount: 0,
  percentComplete: 0,
  xp: 0,
  level: 1,
  streakDays: 0,
})

const completingLesson = ref(false)
const autoplayCountdown = ref(0)
const xpPopup = ref({ visible: false, amount: 0, levelUp: false })
let autoplayTimer = null
let prevLevel = 1

const currentIndex = computed(() =>
  progress.value.lessons.findIndex((l) => l.id === lesson.value?.id),
)
const currentLessonCompleted = computed(() =>
  progress.value.lessons.find((l) => l.id === lesson.value?.id)?.completed ?? false,
)
const nextLesson = computed(() => {
  const idx = currentIndex.value
  if (idx === -1 || idx >= progress.value.lessons.length - 1) return null
  return progress.value.lessons[idx + 1]
})

async function loadAll() {
  if (!user) { router.push('/'); return }
  try {
    const [lessonRes, progressRes] = await Promise.all([
      api.get(`/lessons/${route.params.id}`),
      api.get('/lessons/progress'),
    ])
    lesson.value   = lessonRes.data
    progress.value = progressRes.data
    prevLevel = progressRes.data.level
  } catch (err) {
    if (err.response?.status === 404) router.push('/home')
    if (err.response?.status === 403) router.push('/checkout')
    if (err.response?.status === 401) router.push('/')
  }
}

async function completeLesson() {
  if (completingLesson.value || currentLessonCompleted.value) return
  completingLesson.value = true
  try {
    const { data } = await api.post(`/lessons/${lesson.value.id}/complete`)

    // Refresh progress
    const progressRes = await api.get('/lessons/progress')
    progress.value = progressRes.data

    if (!data.alreadyCompleted) {
      const leveledUp = progress.value.level > prevLevel
      prevLevel = progress.value.level
      showXpPopup(data.xpEarned, leveledUp)

      // Start autoplay if there's a next lesson
      if (nextLesson.value) startAutoplay()
    }
  } catch {
    // noop
  } finally {
    completingLesson.value = false
  }
}

function showXpPopup(amount, levelUp = false) {
  xpPopup.value = { visible: true, amount, levelUp }
  setTimeout(() => { xpPopup.value.visible = false }, 2800)
}

function startAutoplay() {
  autoplayCountdown.value = 5
  autoplayTimer = setInterval(() => {
    autoplayCountdown.value--
    if (autoplayCountdown.value <= 0) {
      clearInterval(autoplayTimer)
      goToLesson(nextLesson.value?.id)
    }
  }, 1000)
}

function cancelAutoplay() {
  clearInterval(autoplayTimer)
  autoplayCountdown.value = 0
}

function goToLesson(id) {
  cancelAutoplay()
  router.push(`/lesson/${id}`)
}

onMounted(loadAll)
onUnmounted(cancelAutoplay)
</script>

<style scoped lang="scss">
// ── Layout root
.p-player-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.p-player-layout {
  display: flex;
  flex: 1;
  gap: $space-5;
  padding: $space-5 $space-5 $space-7;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: #{$bp-lg}) {
    flex-direction: column;
  }
}

// ── Main
.p-player-main {
  flex: 1;
  min-width: 0;
}

// ── Progress bar (top of main)
.p-player__progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;
}

.p-player__progress-bar-track {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: $radius-pill;
  overflow: hidden;
}

.p-player__progress-bar-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: $radius-pill;
  transition: width 0.6s $ease-out;
}

.p-player__progress-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

// ── Lesson content
.p-lesson {
  &__head  { margin-bottom: $space-5; }
  &__title { font-size: clamp(#{$fs-xl}, 3.5vw, #{$fs-3xl}); }

  &__player {
    padding: $space-3;
    margin-bottom: $space-5;
  }

  &__video {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: $radius-lg;
    overflow: hidden;
    background: #000;
    box-shadow: $shadow-lg;

    iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  }

  &__about  { margin-bottom: $space-5; }
  &__desc   { color: var(--text-secondary); margin-top: $space-2; }
  &__actions { display: flex; gap: $space-3; flex-wrap: wrap; margin-bottom: $space-5; }

  &__loading {
    display: flex; flex-direction: column; align-items: center; gap: $space-3;
    padding: $space-9 $space-4;
    color: var(--text-muted);
  }
}

// ── Streak badge in appbar
.p-player__streak {
  font-size: 0.8rem;
}

// ── Auto-play card
.p-player__autoplay {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  margin-bottom: $space-5;
  border: 1px solid var(--border);

  p { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }

  &-timer { font-size: 1rem; color: var(--text-primary); }

  &-track {
    height: 4px;
    background: var(--border);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &-fill {
    height: 100%;
    background: var(--gradient-primary);
    border-radius: $radius-pill;
    transition: width 0.9s linear;
  }
}

// ── Sidebar
.p-player-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: $radius-xl;
  padding: $space-4;
  height: fit-content;
  position: sticky;
  top: calc(64px + #{$space-4});

  @media (max-width: #{$bp-lg}) {
    width: 100%;
    position: static;
  }

  &__header {
    margin-bottom: $space-4;
    border-bottom: 1px solid var(--border);
    padding-bottom: $space-3;
  }

  &__progress-mini {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-top: $space-2;

    span { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
  }

  &__mini-track {
    flex: 1;
    height: 4px;
    background: var(--border);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__mini-fill {
    height: 100%;
    background: var(--gradient-primary);
    border-radius: $radius-pill;
    transition: width 0.5s $ease-out;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    max-height: 480px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: var(--border); border-radius: $radius-pill; }
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    width: 100%;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--text-secondary);
    font-size: 0.85rem;
    transition: background $dur-fast $ease-out, color $dur-fast;

    &:hover {
      background: var(--surface-raised);
      color: var(--text-primary);
    }

    &.is-active {
      background: rgba(108, 92, 231, 0.15);
      color: var(--primary);
      font-weight: 600;
    }

    &.is-completed {
      color: #2ECC71;
      .p-player-sidebar__icon { color: #2ECC71; }
    }
  }

  &__icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--text-muted);
  }

  &__num {
    color: var(--text-muted);
    margin-right: $space-1;
    font-size: 0.75rem;
  }
}

// ── XP Popup
.p-player__xp-popup {
  position: fixed;
  bottom: $space-6;
  right: $space-6;
  z-index: $z-toast;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;
  background: var(--surface);
  border: 1px solid rgba(255, 209, 102, 0.5);
  border-radius: $radius-xl;
  padding: $space-4 $space-5;
  box-shadow: 0 8px 32px rgba(255, 209, 102, 0.25);
  font-size: 1.4rem;
  font-weight: 700;
  color: #FFD166;
  pointer-events: none;

  @media (max-width: #{$bp-sm}) {
    bottom: $space-4;
    right: $space-4;
  }
}

.p-player__xp-icon  { font-size: 2rem; }
.p-player__xp-level { font-size: 0.9rem; color: var(--text-primary); }

// ── Transition
.xp-pop-enter-active { animation: xp-rise 0.4s $ease-spring both; }
.xp-pop-leave-active { animation: xp-rise 0.3s $ease-in-out reverse both; }

@keyframes xp-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.8); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
</style>
