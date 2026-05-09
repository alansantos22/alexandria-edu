<template>
  <div class="forum-categories">
    <!-- Loading -->
    <div v-if="loading" class="forum-categories__loading">
      <div class="c-skeleton c-skeleton--card" v-for="n in 4" :key="n" />
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="c-card c-card--error forum-categories__error">
      <p>{{ error }}</p>
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('retry')">Tentar novamente</button>
    </div>

    <!-- Lista de categorias -->
    <ul v-else class="forum-categories__list">
      <li
        v-for="category in categories"
        :key="category.id"
        class="c-card forum-categories__item"
        :class="{ 'forum-categories__item--active': selected === category.id }"
        @click="$emit('select', category)"
        role="button"
        :aria-pressed="selected === category.id"
        :tabindex="0"
        @keydown.enter="$emit('select', category)"
      >
        <div
          class="forum-categories__icon"
          :style="category.bgColor ? { background: category.bgColor } : {}"
        >
          <span v-if="category.icon" v-html="category.icon" />
          <span v-else>💬</span>
        </div>
        <div class="forum-categories__info">
          <h3 class="forum-categories__name">{{ category.name }}</h3>
          <p class="forum-categories__desc u-text--muted">{{ category.description }}</p>
        </div>
        <div class="forum-categories__meta">
          <span class="c-badge c-badge--secondary">{{ category.topicCount ?? 0 }} tópicos</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  selected: { type: Number, default: null },
})

defineEmits(['select', 'retry'])
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.forum-categories {
  &__loading {
    display: grid;
    gap: $space-3;
  }

  &__error {
    text-align: center;
    padding: $space-5;
    gap: $space-3;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-4;
    cursor: pointer;
    transition: border-color $dur-base $ease-out, box-shadow $dur-base $ease-out;
    border: 1px solid transparent;

    &:hover {
      border-color: rgba($brand-primary, 0.4);
      box-shadow: $shadow-glow-primary;
    }

    &--active {
      border-color: $brand-primary !important;
      box-shadow: $shadow-glow-primary !important;
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    background: rgba($brand-primary, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 1rem;
    font-weight: 600;
    color: $neutral-0;
    margin: 0 0 $space-1;
  }

  &__desc {
    font-size: 0.85rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    align-items: flex-end;
    flex-shrink: 0;

    @media (max-width: #{$bp-sm}) {
      display: none;
    }
  }
}

.c-skeleton--card {
  height: 80px;
  border-radius: $radius-md;
  background: linear-gradient(90deg, rgba($neutral-700, 0.4) 25%, rgba($neutral-600, 0.4) 50%, rgba($neutral-700, 0.4) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
