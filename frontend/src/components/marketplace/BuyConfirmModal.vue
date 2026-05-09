<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="item"
        class="c-modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`buy-modal-title`"
        @click.self="$emit('close')"
        @keydown.esc="$emit('close')"
      >
        <div class="c-modal c-buy-modal">
          <!-- Header -->
          <div class="c-buy-modal__header">
            <div class="c-buy-modal__icon">{{ typeIcon }}</div>
            <span class="c-buy-modal__rarity" :class="`c-buy-modal__rarity--${item.rarity}`">
              {{ rarityLabel }}
            </span>
          </div>

          <h2 id="buy-modal-title" class="c-buy-modal__title">{{ item.name }}</h2>
          <p v-if="item.description" class="c-buy-modal__desc">{{ item.description }}</p>

          <!-- Price row -->
          <div class="c-buy-modal__price-row">
            <div class="c-buy-modal__price-info">
              <span class="c-buy-modal__price-label">Custo</span>
              <span class="c-buy-modal__price-value" :class="{ 'c-buy-modal__price-value--free': item.priceCoins === 0 }">
                {{ item.priceCoins === 0 ? 'Grátis' : `🪙 ${item.priceCoins.toLocaleString('pt-BR')}` }}
              </span>
            </div>
            <div class="c-buy-modal__price-info">
              <span class="c-buy-modal__price-label">Seu saldo</span>
              <span
                class="c-buy-modal__price-value"
                :class="{ 'c-buy-modal__price-value--insufficient': !canAffordItem }"
              >
                🪙 {{ userBalance.toLocaleString('pt-BR') }}
              </span>
            </div>
          </div>

          <!-- Insufficient balance warning -->
          <div v-if="!canAffordItem && item.priceCoins > 0" class="c-buy-modal__warning">
            <span>⚠️</span>
            <p>Você precisa de mais <strong>🪙 {{ (item.priceCoins - userBalance).toLocaleString('pt-BR') }}</strong> moedas. Complete mais aulas para ganhar!</p>
          </div>

          <!-- Seasonal scarcity -->
          <div v-if="seasonEndsAt" class="c-buy-modal__scarcity">
            <span>⏳</span>
            <p>Item exclusivo da temporada · Disponível até <strong>{{ formattedEndsAt }}</strong></p>
          </div>

          <!-- Actions -->
          <div class="c-buy-modal__actions">
            <button class="c-btn c-btn--ghost" @click="$emit('close')" :disabled="loading">
              Cancelar
            </button>
            <button
              class="c-btn c-btn--primary"
              :disabled="(!canAffordItem && item.priceCoins > 0) || loading"
              @click="$emit('confirm')"
            >
              <span v-if="loading" class="c-btn__spinner" aria-hidden="true" />
              {{ item.priceCoins === 0 ? 'Resgatar' : 'Confirmar compra' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item:        { type: Object, default: null },
  userBalance: { type: Number, default: 0 },
  seasonEndsAt:{ type: String, default: null },
  loading:     { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])

const rarityLabels = {
  common:    'Comum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
}
const typeIcons = { avatar: '🧑', wallpaper: '🖼️', badge: '🏅', frame: '🪞' }

const rarityLabel  = computed(() => rarityLabels[props.item?.rarity] || '')
const typeIcon     = computed(() => typeIcons[props.item?.type]      || '🎁')
const canAffordItem = computed(() =>
  !props.item || props.item.priceCoins === 0 || props.userBalance >= props.item.priceCoins,
)
const formattedEndsAt = computed(() => {
  if (!props.seasonEndsAt) return ''
  return new Date(props.seasonEndsAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/colors'    as *;

// ---------------------------------------------------------------------------
// Backdrop
// ---------------------------------------------------------------------------
.c-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba($neutral-900, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
  padding: $space-4;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
.c-modal {
  background: $neutral-800;
  border: 1.5px solid $neutral-700;
  border-radius: $radius-xl;
  width: 100%;
  max-width: 420px;
  padding: $space-6;
  box-shadow: $shadow-lg;
}

.c-buy-modal {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__icon {
    font-size: 2.2rem;
    line-height: 1;
  }

  &__rarity {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 10px;
    border-radius: $radius-pill;

    &--common    { background: rgba($neutral-500, 0.15); color: $neutral-300; }
    &--rare      { background: rgba($brand-secondary, 0.15); color: $brand-secondary; }
    &--epic      { background: rgba($brand-accent, 0.15);    color: $brand-accent; }
    &--legendary { background: rgba($brand-gold, 0.15);      color: $brand-gold; }
  }

  &__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  &__price-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;
    padding: $space-4;
    background: $neutral-900;
    border-radius: $radius-md;
    border: 1px solid $neutral-700;
  }

  &__price-info {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &__price-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-tertiary, #{$neutral-500});
  }

  &__price-value {
    font-size: 1rem;
    font-weight: 700;
    color: $brand-gold;

    &--free         { color: $brand-secondary; }
    &--insufficient { color: $brand-accent; }
  }

  &__warning,
  &__scarcity {
    display: flex;
    gap: $space-3;
    padding: $space-3;
    border-radius: $radius-md;
    font-size: 0.8rem;
    line-height: 1.5;

    p { margin: 0; }
  }

  &__warning {
    background: rgba($brand-accent, 0.1);
    border: 1px solid rgba($brand-accent, 0.25);
    color: $brand-accent;
  }

  &__scarcity {
    background: rgba($brand-gold, 0.08);
    border: 1px solid rgba($brand-gold, 0.22);
    color: $brand-gold;
  }

  &__actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
    margin-top: $space-2;
  }
}

// ---------------------------------------------------------------------------
// Spinner (reutiliza padrão do projeto)
// ---------------------------------------------------------------------------
.c-btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin $dur-slow linear infinite;
}

// ---------------------------------------------------------------------------
// Modal transition
// ---------------------------------------------------------------------------
.modal-enter-active,
.modal-leave-active {
  transition: opacity $dur-base $ease-out;

  .c-modal {
    transition: transform $dur-base $ease-spring, opacity $dur-base $ease-out;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .c-modal {
    transform: scale(0.94) translateY(12px);
    opacity: 0;
  }
}
</style>
