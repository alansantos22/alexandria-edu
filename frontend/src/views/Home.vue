<template>
  <div>
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo"><Sparkles :size="20" /></span>
        <span>Alexandria <small class="u-text--muted">EDU</small></span>
      </div>
      <div class="c-appbar__actions">
        <span class="c-badge c-badge--secondary u-hide-sm">
          <CircleUser :size="12" /> {{ user?.username || 'Aluno' }}
        </span>
        <button class="c-btn c-btn--ghost c-btn--sm" @click="logout">
          <LogOut :size="16" /> Sair
        </button>
      </div>
    </header>

    <main class="l-container p-home">
      <section class="p-home__hero a-fade-in-up">
        <p class="u-text--eyebrow">Sua jornada</p>
        <h1 class="p-home__title">
          Olá, <span class="u-text--gradient">{{ user?.username || 'aluno' }}</span> 👋
        </h1>
        <p class="p-home__lead">
          Continue de onde parou ou entre direto na próxima mentoria ao vivo.
        </p>
      </section>

      <!-- BENTO grid principal -->
      <section class="c-bento p-home__grid">
        <!-- HERO cell · live mentorship -->
        <article
          class="c-card c-card--feature c-bento__cell--hero p-home__live"
          :class="{ 'p-home__live--offline': !liveLink }"
        >
          <span class="c-badge c-badge--gold p-home__live-badge">
            <Radio :size="12" /> {{ liveLink ? 'AO VIVO' : 'OFFLINE' }}
          </span>
          <h2 class="p-home__live-title">
            <Video :size="24" />
            Mentoria ao vivo
          </h2>
          <p class="p-home__live-lead">
            {{ liveLink
              ? 'A sala está aberta. Entre agora e participe da sessão com a comunidade.'
              : 'Nenhuma sessão ativa no momento. Volte em breve para a próxima mentoria.' }}
          </p>
          <a
            v-if="liveLink"
            :href="liveLink"
            target="_blank"
            rel="noopener"
            class="c-btn c-btn--gold c-btn--lg"
          >
            <PlayCircle :size="20" /> Entrar na mentoria
          </a>
        </article>

        <!-- Stats / trilhas -->
        <article class="c-card c-card--secondary c-bento__cell">
          <div class="c-card__icon"><BrainCircuit :size="22" /></div>
          <p class="c-card__eyebrow">Trilha</p>
          <h3 class="c-card__title">IA aplicada</h3>
          <p class="c-card__body">Modelos, prompts e agentes para o mundo real.</p>
        </article>

        <article class="c-card c-card--primary c-bento__cell">
          <div class="c-card__icon"><Workflow :size="22" /></div>
          <p class="c-card__eyebrow">Trilha</p>
          <h3 class="c-card__title">Automação</h3>
          <p class="c-card__body">No-code, scripts e fluxos inteligentes.</p>
        </article>

        <article class="c-card c-card--accent c-bento__cell">
          <div class="c-card__icon"><Gamepad2 :size="22" /></div>
          <p class="c-card__eyebrow">Trilha</p>
          <h3 class="c-card__title">Gamificação</h3>
          <p class="c-card__body">Engaje pessoas com mecânicas de jogo.</p>
        </article>

        <article class="c-card c-bento__cell">
          <div class="c-card__icon" style="background: var(--gradient-aurora);">
            <Wallet :size="22" />
          </div>
          <p class="c-card__eyebrow">Trilha</p>
          <h3 class="c-card__title">Web3</h3>
          <p class="c-card__body">Wallets, contratos e cultura on-chain.</p>
        </article>
      </section>

      <!-- Lessons -->
      <section class="p-home__lessons">
        <header class="p-home__section-header">
          <div>
            <p class="u-text--eyebrow">
              <BookOpen :size="14" /> Conteúdo
            </p>
            <h2>Aulas disponíveis</h2>
          </div>
          <span class="c-badge">
            <Library :size="12" /> {{ lessons.length }} aulas
          </span>
        </header>

        <div v-if="lessons.length" class="c-bento p-home__lessons-grid">
          <article
            v-for="lesson in lessons"
            :key="lesson.id"
            class="c-card c-bento__cell"
          >
            <div class="c-card__icon"><PlayCircle :size="22" /></div>
            <p class="c-card__eyebrow">Aula</p>
            <h3 class="c-card__title">{{ lesson.title }}</h3>
            <p class="c-card__body">{{ lesson.description }}</p>
            <div class="c-card__footer">
              <span class="c-badge c-badge--secondary">
                <Clock :size="12" /> {{ lesson.duration || 'Em vídeo' }}
              </span>
              <router-link
                :to="'/lesson/' + lesson.id"
                class="c-btn c-btn--sm"
              >
                <Play :size="14" /> Assistir
              </router-link>
            </div>
          </article>
        </div>

        <div v-else class="c-card p-home__empty">
          <BookOpen :size="32" />
          <p>Nenhuma aula publicada ainda. Volte em breve.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/core/api'
import {
  Sparkles, CircleUser, LogOut, Radio, Video, PlayCircle,
  BrainCircuit, Workflow, Gamepad2, Wallet, BookOpen,
  Library, Clock, Play,
} from 'lucide-vue-next'

const liveLink = ref('')
const lessons  = ref([])
const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')

onMounted(async () => {
  if (!user) { router.push('/'); return }
  try {
    const [linkRes, lessonsRes] = await Promise.all([
      api.get('/settings/live-link'),
      api.get('/lessons'),
    ])
    liveLink.value = linkRes.data.url
    lessons.value  = lessonsRes.data
  } catch (err) {
    console.error(err)
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      router.push(err.response.status === 403 ? '/checkout' : '/')
    }
  }
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<style scoped lang="scss">
.u-hide-sm { display: none; @include breakpoint(sm) { display: inline-flex; } }

.p-home {
  &__hero { margin-bottom: $space-6; }
  &__title { font-size: clamp(#{$fs-2xl}, 4vw, #{$fs-3xl}); }
  &__lead  { color: var(--text-secondary); }

  &__grid { margin-bottom: $space-7; }

  &__live {
    background:
      radial-gradient(120% 80% at 0% 0%, rgba(255,209,102,0.20), transparent 60%),
      var(--gradient-violet);
    display: flex; flex-direction: column; gap: $space-3;
    padding: $space-6;

    @include breakpoint(md) { padding: $space-7; }

    &-badge { width: max-content; animation: pulse-glow 2.4s $ease-out infinite; }
    &-title { display: flex; align-items: center; gap: $space-3; color: #fff; margin: 0; }
    &-lead  { color: rgba(255,255,255,0.88); margin-bottom: $space-3; }

    &--offline { filter: saturate(0.85); }
  }

  &__section-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: $space-4; margin-bottom: $space-5;
    h2 { margin: 0; }
  }

  &__lessons-grid {
    .c-card__footer { margin-top: auto; }
    .c-bento__cell  { display: flex; flex-direction: column; }
  }

  &__empty {
    text-align: center;
    padding: $space-7;
    color: var(--text-muted);
    display: flex; flex-direction: column; align-items: center; gap: $space-3;
  }
}
</style>
