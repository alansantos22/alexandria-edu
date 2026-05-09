<template>
  <div class="c-card c-showcase-badges">
    <p class="c-card__eyebrow">🏅 Insígnias</p>

    <div v-if="badges.length" class="c-showcase-badges__grid">
      <div
        v-for="badge in badges"
        :key="badge.id"
        :class="['c-badge-tile', `c-badge-tile--${badge.rarity}`]"
        :title="`${badge.name}${badge.description ? ': ' + badge.description : ''}`"
      >
        <span class="c-badge-tile__icon">{{ badge.icon }}</span>
        <span class="c-badge-tile__name">{{ badge.name }}</span>
        <span :class="['c-badge-tile__rarity', `c-badge-tile__rarity--${badge.rarity}`]">
          {{ rarityLabel[badge.rarity] }}
        </span>
      </div>
    </div>

    <div v-else class="c-showcase-badges__empty">
      <p>Nenhuma insígnia conquistada ainda.</p>
      <small>Complete aulas e missões para ganhar medalhas.</small>
    </div>
  </div>
</template>

<script setup>
defineProps({
  badges: { type: Array, required: true },
})

const rarityLabel = {
  common:    'Comum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
}
</script>

<style scoped lang="scss">
.c-showcase-badges {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: $space-2;
    margin-top: $space-3;
  }

  &__empty {
    margin-top: $space-4;
    text-align: center;
    color: var(--text-muted);

    p { font-size: $fs-sm; margin-bottom: $space-1; }
    small { font-size: $fs-xs; }
  }
}

// Estende .c-badge-tile com rarity label
.c-badge-tile {
  &__rarity {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);

    &--rare      { color: var(--color-secondary); }
    &--epic      { color: var(--color-primary-soft); }
    &--legendary { color: var(--color-gold); }
  }
}
</style>
