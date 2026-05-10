<template>
  <div class="ccu-bar">
    <div class="ccu-bar__header">
      <span class="ccu-bar__title">Complexidade</span>
      <span class="ccu-bar__values">{{ ccuUsed }} / {{ ccuLimit }} CCU</span>
    </div>
    <div class="ccu-bar__track">
      <div
        class="ccu-bar__fill"
        :style="{ width: `${percent}%` }"
        :class="{
          'ccu-bar__fill--warning': percent >= 70 && percent < 90,
          'ccu-bar__fill--danger':  percent >= 90,
        }"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  ccuUsed:  { type: Number, required: true },
  ccuLimit: { type: Number, required: true },
  percent:  { type: Number, required: true },
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.ccu-bar {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  width: 220px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $neutral-400;
    font-family: var(--font-display);
  }

  &__values {
    font-size: 0.72rem;
    font-weight: 600;
    color: $neutral-300;
    font-family: var(--font-display);
  }

  &__track {
    height: 6px;
    background: rgba($neutral-600, 0.3);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $brand-secondary;
    border-radius: $radius-pill;
    transition: width 0.25s $ease-out, background 0.25s $ease-out;

    &--warning { background: #f0a500; }
    &--danger  { background: $state-error; }
  }
}
</style>
