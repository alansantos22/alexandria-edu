<template>
  <article
    class="c-mkt-card"
    :class="[`c-mkt-card--${item.rarity}`, { 'c-mkt-card--owned': item.owned }]"
    @click="$emit('select', item)"
    tabindex="0"
    role="button"
    :aria-label="`${item.name} — ${item.priceCoins === 0 ? 'Grátis' : item.priceCoins + ' moedas'}`"
    @keydown.enter="$emit('select', item)"
  >
    <!-- Rarity glow border is done via CSS on the class -->

    <!-- Badges top-right -->
    <div class="c-mkt-card__badges">
      <span v-if="item.owned" class="c-mkt-card__badge c-mkt-card__badge--owned">
        ✓ Seu
      </span>
      <span v-if="isSeasonal && !item.owned" class="c-mkt-card__badge c-mkt-card__badge--season">
        ⏳ Temp.
      </span>
    </div>

    <!-- Rarity label top-left -->
    <span class="c-mkt-card__rarity">{{ rarityLabel }}</span>

    <!-- Item visual -->
    <div class="c-mkt-card__visual">
      <!-- Wallpaper: mostra a imagem real -->
      <img
        v-if="item.type === 'wallpaper' && wallpaperImageUrl"
        :src="wallpaperImageUrl"
        class="c-mkt-card__wallpaper-thumb"
        alt=""
        loading="lazy"
      />
      <!-- Paleta: strip de 5 bolinhas coloridas -->
      <div v-else-if="item.type === 'palette' && paletteColors"
           class="c-mkt-card__palette-strip">
        <span
          v-for="(color, i) in paletteColors"
          :key="i"
          class="c-mkt-card__palette-dot"
          :style="{ background: color }"
        />
      </div>
      <!-- Fallback: emoji do tipo -->
      <span v-else class="c-mkt-card__type-icon">{{ typeIcon }}</span>
    </div>

    <!-- Info -->
    <div class="c-mkt-card__info">
      <h3 class="c-mkt-card__name">{{ item.name }}</h3>
      <p v-if="item.description" class="c-mkt-card__desc">{{ item.description }}</p>

      <div class="c-mkt-card__footer">
        <span v-if="item.priceCoins === 0" class="c-mkt-card__price c-mkt-card__price--free">
          Grátis
        </span>
        <span
          v-else
          class="c-mkt-card__price"
          :class="{ 'c-mkt-card__price--cant-afford': !item.owned && !item.canAfford }"
        >
          🪙 {{ item.priceCoins.toLocaleString('pt-BR') }}
        </span>

        <button
          v-if="!item.owned"
          class="c-btn c-btn--sm"
          :class="item.canAfford || item.priceCoins === 0 ? 'c-btn--primary' : 'c-btn--ghost'"
          :disabled="!item.canAfford && item.priceCoins > 0"
          @click.stop="$emit('select', item)"
        >
          {{ item.priceCoins === 0 ? 'Resgatar' : 'Comprar' }}
        </button>

        <button
          v-else
          class="c-btn c-btn--sm c-btn--secondary"
          @click.stop="$emit('equip', item)"
        >
          Equipar
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item:       { type: Object, required: true },
  isSeasonal: { type: Boolean, default: false },
})

defineEmits(['select', 'equip'])

const rarityLabels = {
  common:    'Comum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
}

const typeIcons = {
  avatar:    '🧑',
  wallpaper: '🖼️',
  badge:     '🏅',
  frame:     '🪞',
  palette:   '🎨',
}

const rarityLabel = rarityLabels[props.item.rarity] || props.item.rarity
const typeIcon    = typeIcons[props.item.type]       || '🎁'

// Wallpaper: imageUrl é um path direto (não começa com 'palette:')
const wallpaperImageUrl = computed(() => {
  const url = props.item.imageUrl
  if (!url || url.startsWith('palette:')) return null
  if (url.startsWith('http')) return url
  // Caminho relativo como 'backgrounds/xyz.jpg' ou '/uploads/backgrounds/xyz.jpg'
  const clean = url.replace(/^\/uploads\//, '').replace(/^\//, '')
  return `/uploads/${clean}`
})

// Paleta: extrai as 5 cores do JSON armazenado em imageUrl
const paletteColors = computed(() => {
  const url = props.item.imageUrl
  if (!url?.startsWith('palette:')) return null
  try {
    const data = JSON.parse(url.slice('palette:'.length))
    return [
      data.primary      || '#6C5CE7',
      data.primaryDark  || '#4B3FBA',
      data.secondary    || '#00D9C0',
      data.secondaryDark|| '#00A68F',
      data.tertiary     || '#FF6B9D',
    ]
  } catch { return null }
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/colors'    as *;

// ---------------------------------------------------------------------------
// Card base
// ---------------------------------------------------------------------------
.c-mkt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-lg;
  background: $neutral-800;
  border: 1.5px solid $neutral-700;
  cursor: pointer;
  transition: transform $dur-base $ease-out, box-shadow $dur-base $ease-out, border-color $dur-base $ease-out;
  outline: none;

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    box-shadow: $shadow-md;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba($brand-primary, 0.55);
  }

  // ── Rarity borders ───────────────────────────────────────────────────────
  &--common    { border-color: $neutral-600; }
  &--rare      { border-color: $brand-secondary; box-shadow: 0 0 0 1px rgba($brand-secondary, 0.25); }
  &--epic      { border-color: $brand-accent;    box-shadow: 0 0 0 1px rgba($brand-accent, 0.30); }
  &--legendary {
    border-color: $brand-gold;
    box-shadow: 0 0 12px rgba($brand-gold, 0.30), 0 0 0 1px rgba($brand-gold, 0.40);
    background: linear-gradient(155deg, rgba($brand-gold, 0.06) 0%, $neutral-800 60%);
  }

  // ── Owned state ──────────────────────────────────────────────────────────
  &--owned {
    opacity: 0.82;
    border-style: dashed;
  }

  // ── Badges ───────────────────────────────────────────────────────────────
  &__badges {
    position: absolute;
    top: $space-3;
    right: $space-3;
    display: flex;
    gap: $space-1;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: $radius-pill;
    letter-spacing: 0.05em;
    text-transform: uppercase;

    &--owned   { background: rgba($brand-secondary, 0.18); color: $brand-secondary; }
    &--season  { background: rgba($brand-gold, 0.18);      color: $brand-gold; }
  }

  // ── Rarity label ─────────────────────────────────────────────────────────
  &__rarity {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-tertiary, #{$neutral-500});

    .c-mkt-card--rare      & { color: $brand-secondary; }
    .c-mkt-card--epic      & { color: $brand-accent; }
    .c-mkt-card--legendary & { color: $brand-gold; }
  }

  // ── Visual area ──────────────────────────────────────────────────────────
  &__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    border-radius: $radius-md;
    background: $neutral-700;
    font-size: 2.5rem;
    overflow: hidden;
  }

  &__wallpaper-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: $radius-md;
    display: block;
  }

  &__palette-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 0 $space-3;
  }

  &__palette-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.15);
    flex-shrink: 0;
  }

  // ── Info ─────────────────────────────────────────────────────────────────
  &__info {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    flex: 1;
  }

  &__name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
    margin-top: auto;
  }

  &__price {
    font-size: 0.85rem;
    font-weight: 700;
    color: $brand-gold;

    &--free       { color: $brand-secondary; }
    &--cant-afford { color: var(--text-tertiary, #{$neutral-500}); }
  }
}
</style>
