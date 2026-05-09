<template>
  <div class="c-card c-showcase-tracks">
    <p class="c-card__eyebrow">🗺️ Trilhas de Aprendizado</p>

    <div v-if="tracks.length" class="c-showcase-tracks__list">
      <div
        v-for="track in tracks"
        :key="track.id"
        class="c-showcase-tracks__track"
      >
        <!-- Cabeçalho da trilha -->
        <button
          class="c-showcase-tracks__track-header"
          @click="toggleTrack(track.id)"
          :aria-expanded="openTracks.has(track.id)"
        >
          <div class="c-showcase-tracks__track-left">
            <span class="c-showcase-tracks__track-icon">{{ track.icon }}</span>
            <div>
              <p class="c-showcase-tracks__track-name">{{ track.name }}</p>
              <p class="c-showcase-tracks__track-meta">
                {{ track.completedLessons }}/{{ track.totalLessons }} aulas
              </p>
            </div>
          </div>
          <div class="c-showcase-tracks__track-right">
            <span class="c-showcase-tracks__pct">{{ track.progress }}%</span>
            <span class="c-showcase-tracks__chevron" :class="{ 'c-showcase-tracks__chevron--open': openTracks.has(track.id) }">
              ›
            </span>
          </div>
        </button>

        <!-- Barra de progresso da trilha -->
        <div class="c-progress-track c-showcase-tracks__track-bar">
          <div class="c-progress-track__fill" :style="{ width: track.progress + '%' }" />
        </div>

        <!-- Módulos (colapsável) -->
        <div v-if="openTracks.has(track.id)" class="c-showcase-tracks__modules">
          <div
            v-for="mod in track.modules"
            :key="mod.id"
            class="c-showcase-tracks__module"
          >
            <div class="c-showcase-tracks__module-header">
              <span class="c-showcase-tracks__module-name">{{ mod.name }}</span>
              <span class="c-showcase-tracks__module-meta">
                {{ mod.completedLessons }}/{{ mod.totalLessons }}
              </span>
            </div>
            <div class="c-progress-track c-showcase-tracks__module-bar">
              <div class="c-progress-track__fill" :style="{ width: mod.progress + '%' }" />
            </div>
          </div>

          <p v-if="!track.modules.length" class="c-showcase-tracks__no-modules">
            Nenhum módulo disponível nesta trilha ainda.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="c-showcase-tracks__empty">
      <p>Nenhuma trilha disponível.</p>
      <small>As trilhas de aprendizado aparecerão aqui assim que forem criadas.</small>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

defineProps({
  tracks: { type: Array, required: true },
})

const openTracks = reactive(new Set())

function toggleTrack(id) {
  if (openTracks.has(id)) openTracks.delete(id)
  else openTracks.add(id)
}
</script>

<style scoped lang="scss">
.c-showcase-tracks {
  &__list { margin-top: $space-3; display: flex; flex-direction: column; gap: $space-3; }

  &__track {
    background: var(--bg-elevated);
    border-radius: $radius-md;
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  &__track-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: $space-3 $space-4;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    gap: $space-3;

    &:hover { background: var(--glass-bg); }
  }

  &__track-left {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__track-icon { font-size: 1.5rem; }

  &__track-name {
    font-size: $fs-base;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  &__track-meta {
    font-size: $fs-xs;
    color: var(--text-muted);
    margin: 0;
  }

  &__track-right {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-shrink: 0;
  }

  &__pct {
    font-size: $fs-sm;
    font-weight: 700;
    color: var(--color-secondary);
    min-width: 36px;
    text-align: right;
  }

  &__chevron {
    font-size: 1.25rem;
    color: var(--text-muted);
    transition: transform $dur-fast $ease-out;
    line-height: 1;

    &--open { transform: rotate(90deg); }
  }

  &__track-bar { margin: 0 $space-4 $space-3; }

  &__modules {
    padding: 0 $space-4 $space-3;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__module {
    padding: $space-3;
    background: var(--bg-surface);
    border-radius: $radius-sm;
    border: 1px solid var(--border-subtle);
  }

  &__module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-2;
  }

  &__module-name {
    font-size: $fs-sm;
    color: var(--text-secondary);
  }

  &__module-meta {
    font-size: $fs-xs;
    color: var(--text-muted);
  }

  &__module-bar { }

  &__no-modules {
    font-size: $fs-sm;
    color: var(--text-muted);
    text-align: center;
    padding: $space-2 0;
    margin: 0;
  }

  &__empty {
    margin-top: $space-4;
    text-align: center;
    color: var(--text-muted);

    p     { font-size: $fs-sm; margin-bottom: $space-1; }
    small { font-size: $fs-xs; }
  }
}
</style>
