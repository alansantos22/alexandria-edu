<template>
  <div class="c-card c-showcase-stats">
    <p class="c-card__eyebrow">📊 Estatísticas</p>
    <div class="c-showcase-stats__grid">
      <div class="c-showcase-stats__item">
        <span class="c-showcase-stats__value">{{ stats.completedLessons }}</span>
        <span class="c-showcase-stats__label">Aulas concluídas</span>
      </div>
      <div class="c-showcase-stats__item">
        <span class="c-showcase-stats__value">{{ stats.completionRate }}%</span>
        <span class="c-showcase-stats__label">Taxa de conclusão</span>
      </div>
      <div class="c-showcase-stats__item">
        <span class="c-showcase-stats__value">{{ user.streakDays }}</span>
        <span class="c-showcase-stats__label">🔥 Dias seguidos</span>
      </div>
      <div class="c-showcase-stats__item">
        <span class="c-showcase-stats__value">{{ user.coinsBalance.toLocaleString('pt-BR') }}</span>
        <span class="c-showcase-stats__label">💰 Moedas</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: { type: Object, required: true },
  user:  { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.c-showcase-stats {
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;
    margin-top: $space-3;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    padding: $space-3;
    background: var(--bg-elevated);
    border-radius: $radius-md;
    border: 1px solid var(--border-subtle);
  }

  &__value {
    font-size: $fs-xl;
    font-weight: 700;
    font-family: var(--font-display);
    color: var(--text-primary);
    line-height: 1;
  }

  &__label {
    font-size: $fs-xs;
    color: var(--text-muted);
  }
}
</style>
