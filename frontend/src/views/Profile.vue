<template>
  <div>
    <!-- Appbar reutilizando padrão do projeto -->
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo"><Sparkles :size="20" /></span>
        <span>Alexandria <small class="u-text--muted">EDU</small></span>
      </div>
      <div class="c-appbar__actions">
        <router-link to="/home" class="c-btn c-btn--ghost c-btn--sm">
          <ArrowLeft :size="16" /> Voltar
        </router-link>
      </div>
    </header>

    <main class="l-container p-profile">
      <!-- Loading -->
      <div v-if="loading" class="p-profile__loading a-fade-in-up">
        <div class="p-profile__loading-spinner" />
        <p>Carregando perfil…</p>
      </div>

      <!-- 404 -->
      <div v-else-if="notFound" class="p-profile__not-found a-fade-in-up">
        <span class="p-profile__not-found-icon">🔍</span>
        <h2>Perfil não encontrado</h2>
        <p>O usuário <strong>@{{ $route.params.username }}</strong> não existe ou não está ativo.</p>
        <router-link to="/home" class="c-btn c-btn--sm">Voltar para Home</router-link>
      </div>

      <!-- Erro genérico -->
      <div v-else-if="error" class="p-profile__not-found a-fade-in-up">
        <span class="p-profile__not-found-icon">⚠️</span>
        <h2>Erro ao carregar perfil</h2>
        <p>Tente novamente mais tarde.</p>
        <router-link to="/home" class="c-btn c-btn--sm">Voltar para Home</router-link>
      </div>

      <!-- Perfil carregado -->
      <template v-else-if="profile">
        <ProfileHeader :user="profile.user" class="a-fade-in-up" />

        <!-- Bento grid principal -->
        <section class="c-bento p-profile__grid a-fade-in-up">

          <!-- Bloco Stats — pequeno, canto superior esquerdo -->
          <ShowcaseStats
            :stats="profile.stats"
            :user="profile.user"
            class="c-bento__cell p-profile__cell--stats"
          />

          <!-- Bloco Badges — médio, centro -->
          <ShowcaseBadges
            :badges="profile.badges"
            class="c-bento__cell p-profile__cell--badges"
          />

          <!-- Bloco Cards — largo, lateral direita (span 2 linhas no desktop) -->
          <ShowcaseCards
            :cards="profile.cards"
            class="c-bento__cell p-profile__cell--cards"
          />

          <!-- Bloco Trilhas — largura total inferior -->
          <ShowcaseTracks
            :tracks="profile.tracks"
            class="c-bento__cell p-profile__cell--tracks"
          />
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Sparkles, ArrowLeft } from 'lucide-vue-next'

import { getProfile } from '@/core/services/profile.service'
import ProfileHeader    from '@/components/profile/ProfileHeader.vue'
import ShowcaseStats    from '@/components/profile/ShowcaseStats.vue'
import ShowcaseBadges   from '@/components/profile/ShowcaseBadges.vue'
import ShowcaseCards    from '@/components/profile/ShowcaseCards.vue'
import ShowcaseTracks   from '@/components/profile/ShowcaseTracks.vue'

const route  = useRoute()
const router = useRouter()

const profile  = ref(null)
const loading  = ref(true)
const notFound = ref(false)
const error    = ref(false)

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) { router.push('/'); return }

  try {
    profile.value = await getProfile(route.params.username)
  } catch (err) {
    if (err.response?.status === 404) notFound.value = true
    else if (err.response?.status === 401) router.push('/')
    else error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.p-profile {
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-4;
    min-height: 40vh;
    color: var(--text-muted);
  }

  &__loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-3;
    min-height: 40vh;
    text-align: center;

    h2 { margin-bottom: 0; }
    p  { color: var(--text-muted); }
  }

  &__not-found-icon { font-size: 3rem; }

  &__grid {
    // Override bento default para layout assimétrico do perfil
    grid-template-columns: 1fr;
    grid-auto-rows: auto;

    @include breakpoint(md) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @include breakpoint(lg) {
      grid-template-columns: 220px 1fr 280px;
    }
  }

  // Stats: ocupa 1 coluna, 1 linha
  &__cell--stats {
    @include breakpoint(md) { grid-column: span 1; }
  }

  // Badges: ocupa 1 coluna, 1 linha
  &__cell--badges {
    @include breakpoint(md) { grid-column: span 1; }
  }

  // Cards: ocupa 1 coluna, 2 linhas (fica na lateral direita)
  &__cell--cards {
    @include breakpoint(md) { grid-column: span 1; grid-row: span 2; }
    @include breakpoint(lg) { grid-column: 3; grid-row: 1 / span 2; }
  }

  // Trilhas: largura total (exceto a coluna de cards no desktop)
  &__cell--tracks {
    @include breakpoint(md) { grid-column: span 2; }
    @include breakpoint(lg) { grid-column: 1 / span 2; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
