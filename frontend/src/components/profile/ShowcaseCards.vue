<template>
  <div class="c-card c-showcase-cards">
    <p class="c-card__eyebrow">🃏 Coleção de Cartas</p>

    <div v-if="cards.length" class="c-showcase-cards__grid">
      <div
        v-for="card in cards"
        :key="card.id"
        :class="['c-card-collectible', `c-card-collectible--${card.rarity}`, 'c-showcase-cards__card']"
        @mousemove="tilt($event)"
        @mouseleave="resetTilt($event)"
      >
        <!-- Arte / placeholder -->
        <div class="c-showcase-cards__art">
          <img
            v-if="card.artUrl"
            :src="card.artUrl"
            :alt="card.name"
            loading="lazy"
            class="c-showcase-cards__art-img"
          />
          <div v-else class="c-showcase-cards__art-placeholder">
            <span>🃏</span>
          </div>
        </div>

        <!-- Info da carta -->
        <div class="c-showcase-cards__card-body">
          <span :class="['c-showcase-cards__rarity-dot', `c-showcase-cards__rarity-dot--${card.rarity}`]" />
          <p class="c-showcase-cards__card-name">{{ card.name }}</p>
          <p v-if="card.eventName" class="c-showcase-cards__event">{{ card.eventName }}</p>
          <span v-if="card.quantity > 1" class="c-showcase-cards__qty">×{{ card.quantity }}</span>
        </div>
      </div>
    </div>

    <div v-else class="c-showcase-cards__empty">
      <p>Nenhuma carta na coleção.</p>
      <small>Participe de eventos e mentorias ao vivo para receber cartas exclusivas.</small>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cards: { type: Array, required: true },
})

function tilt(event) {
  const el   = event.currentTarget
  const rect = el.getBoundingClientRect()
  const x    = event.clientX - rect.left
  const y    = event.clientY - rect.top
  const rotX = ((y - rect.height / 2) / rect.height) * -12
  const rotY = ((x - rect.width  / 2) / rect.width)  *  12
  el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`
}

function resetTilt(event) {
  event.currentTarget.style.transform = ''
}
</script>

<style scoped lang="scss">
.c-showcase-cards {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: $space-3;
    margin-top: $space-3;
  }

  &__card {
    background: var(--glass-bg);
    cursor: default;
    transition: transform $dur-base $ease-out;
  }

  &__art {
    width: 100%;
    aspect-ratio: 3/4;
    border-radius: $radius-md $radius-md 0 0;
    overflow: hidden;
    background: var(--bg-elevated);
  }

  &__art-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__art-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2.5rem;
    color: var(--text-muted);
    background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
  }

  &__card-body {
    padding: $space-2 $space-3 $space-3;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &__rarity-dot {
    position: absolute;
    top: $space-2;
    right: $space-2;
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--common    { background: var(--text-muted); }
    &--rare      { background: var(--color-secondary); }
    &--epic      { background: var(--color-primary-soft); }
    &--legendary { background: var(--color-gold); box-shadow: 0 0 6px var(--color-gold); }
  }

  &__card-name {
    font-size: $fs-xs;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  &__event {
    font-size: 0.62rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.3;
  }

  &__qty {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-gold);
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
