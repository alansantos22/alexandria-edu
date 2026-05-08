<template>
  <div>
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo"><PlayCircle :size="20" /></span>
        <span>Alexandria <small class="u-text--muted">Player</small></span>
      </div>
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$router.push('/home')">
        <ArrowLeft :size="16" /> Voltar
      </button>
    </header>

    <main class="l-container p-lesson" v-if="lesson">
      <section class="p-lesson__head a-fade-in-up">
        <p class="u-text--eyebrow">
          <BookOpen :size="14" /> Aula
        </p>
        <h1 class="p-lesson__title">{{ lesson.title }}</h1>
      </section>

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

      <section v-if="lesson.description" class="c-card p-lesson__about">
        <p class="u-text--eyebrow">
          <FileText :size="14" /> Sobre esta aula
        </p>
        <p class="p-lesson__desc">{{ lesson.description }}</p>
      </section>

      <section v-if="lesson.materialLink" class="p-lesson__actions">
        <a
          :href="lesson.materialLink"
          target="_blank"
          rel="noopener"
          class="c-btn c-btn--secondary"
        >
          <Download :size="18" /> Baixar material de apoio
        </a>
      </section>
    </main>

    <main v-else class="l-container p-lesson__loading">
      <Loader :size="32" class="a-pulse-glow" />
      <p>Carregando aula…</p>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/core/api'
import {
  PlayCircle, ArrowLeft, BookOpen, FileText, Download, Loader,
} from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()
const lesson = ref(null)
const user = JSON.parse(localStorage.getItem('user') || 'null')

onMounted(async () => {
  if (!user) { router.push('/'); return }
  try {
    const { data } = await api.get(`/lessons/${route.params.id}`)
    lesson.value = data
  } catch (err) {
    console.error(err)
    if (err.response?.status === 404) router.push('/home')
    if (err.response?.status === 403) router.push('/checkout')
    if (err.response?.status === 401) router.push('/')
  }
})
</script>

<style scoped lang="scss">
.p-lesson {
  &__head { margin-bottom: $space-5; }
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

  &__about { margin-bottom: $space-5; }
  &__desc  { color: var(--text-secondary); margin-top: $space-2; }

  &__actions { display: flex; gap: $space-3; flex-wrap: wrap; }

  &__loading {
    display: flex; flex-direction: column; align-items: center; gap: $space-3;
    padding: $space-9 $space-4;
    color: var(--text-muted);
  }
}
</style>
