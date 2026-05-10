<template>
  <div class="build-dock">

    <!-- Category tabs -->
    <div class="build-dock__tabs" role="tablist">
      <button
        v-for="cat in BUILD_CATEGORIES"
        :key="cat.id"
        class="build-dock__tab"
        :class="{ 'build-dock__tab--active': modelValue === cat.id }"
        :title="cat.label"
        role="tab"
        :aria-selected="modelValue === cat.id"
        @click="$emit('update:modelValue', cat.id)"
      >
        {{ cat.icon }}
        <span class="build-dock__tab-label">{{ cat.label }}</span>
      </button>
    </div>

    <!-- Items scroll area -->
    <div class="build-dock__items" role="tabpanel">
      <button
        v-for="item in items"
        :key="item.id"
        class="build-dock__item"
        :class="{ 'build-dock__item--selected': selectedItem?.id === item.id }"
        :title="`${item.name} — ${item.ccuCost} CCU`"
        @click="$emit('select', item)"
      >
        <span class="build-dock__item-icon">{{ item.icon }}</span>
        <span class="build-dock__item-name">{{ item.name }}</span>
        <div class="build-dock__item-meta">
          <span class="build-dock__item-ccu">{{ item.ccuCost }} CCU</span>
          <span v-if="item.priceCoins > 0" class="build-dock__item-price">
            🪙 {{ item.priceCoins }}
          </span>
          <span v-else class="build-dock__item-free">Grátis</span>
        </div>
      </button>

      <p v-if="!items.length" class="build-dock__empty">
        Nenhum item nesta categoria.
      </p>
    </div>

  </div>
</template>

<script setup>
import { BUILD_CATEGORIES } from '@/composables/useBuildMode.js'

defineProps({
  modelValue:   { type: String,  required: true },
  items:        { type: Array,   required: true },
  selectedItem: { type: Object,  default: null  },
})

defineEmits(['update:modelValue', 'select'])
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.build-dock {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-modal;
  display: flex;
  flex-direction: column;
  width: min(680px, 96vw);
  background: rgba($neutral-900, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba($neutral-600, 0.25);
  border-bottom: none;
  border-radius: $radius-lg $radius-lg 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);

  // ── Category tabs ──────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: 0;
    padding: $space-2 $space-3 0;
    border-bottom: 1px solid rgba($neutral-600, 0.15);
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: $space-1;
    padding: $space-2 $space-4;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: $radius-md $radius-md 0 0;
    color: $neutral-400;
    font-size: 0.8rem;
    font-family: var(--font-display);
    cursor: pointer;
    transition: color $dur-fast $ease-out, border-color $dur-fast $ease-out,
                background $dur-fast $ease-out;
    white-space: nowrap;

    &:hover {
      color: $neutral-200;
      background: rgba($neutral-600, 0.15);
    }

    &--active {
      color: $brand-primary-soft;
      border-bottom-color: $brand-primary;
    }

    &-label {
      font-size: 0.72rem;
      font-weight: 500;
    }
  }

  // ── Items scroll area ──────────────────────────────────────────
  &__items {
    display: flex;
    gap: $space-2;
    padding: $space-3 $space-4;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba($neutral-600, 0.4) transparent;

    &::-webkit-scrollbar       { height: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba($neutral-600, 0.4); border-radius: 2px; }
  }

  // ── Item card ───────────────────────────────────────────────────
  &__item {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
    width: 88px;
    padding: $space-3 $space-2;
    background: rgba($neutral-800, 0.7);
    border: 1px solid rgba($neutral-600, 0.2);
    border-radius: $radius-md;
    cursor: pointer;
    transition: background $dur-fast $ease-out, border-color $dur-fast $ease-out,
                transform $dur-fast $ease-out;

    &:hover {
      background: rgba($neutral-700, 0.7);
      border-color: rgba($brand-primary, 0.4);
      transform: translateY(-2px);
    }

    &--selected {
      background: rgba($brand-primary, 0.15);
      border-color: $brand-primary;
      box-shadow: 0 0 12px rgba($brand-primary, 0.2);
    }

    &-icon {
      font-size: 1.8rem;
      line-height: 1;
    }

    &-name {
      font-size: 0.68rem;
      font-weight: 600;
      color: $neutral-200;
      font-family: var(--font-display);
      text-align: center;
      line-height: 1.3;
    }

    &-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-top: auto;
    }

    &-ccu {
      font-size: 0.6rem;
      color: $neutral-500;
      font-family: var(--font-display);
    }

    &-price {
      font-size: 0.65rem;
      font-weight: 600;
      color: #f0a500;
      font-family: var(--font-display);
    }

    &-free {
      font-size: 0.6rem;
      color: $brand-secondary;
      font-family: var(--font-display);
    }
  }

  // ── Empty state ─────────────────────────────────────────────────
  &__empty {
    padding: $space-4 $space-6;
    font-size: 0.8rem;
    color: $neutral-500;
    font-family: var(--font-display);
    margin: 0;
  }
}
</style>
