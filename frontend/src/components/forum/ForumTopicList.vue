<template>
  <div class="forum-topics">
    <!-- Header da categoria -->
    <div class="forum-topics__header">
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('back')">
        ← Voltar
      </button>
      <h2 class="forum-topics__title">{{ categoryName }}</h2>
      <button class="c-btn c-btn--primary c-btn--sm" @click="$emit('new-topic')">
        + Novo tópico
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="forum-topics__loading">
      <div class="c-skeleton c-skeleton--topic" v-for="n in 6" :key="n" />
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="c-card forum-topics__error">
      <p>{{ error }}</p>
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('retry')">Tentar novamente</button>
    </div>

    <!-- Sem tópicos -->
    <div v-else-if="!topics.length" class="forum-topics__empty">
      <p class="u-text--muted">Nenhum tópico nesta categoria ainda.</p>
      <button class="c-btn c-btn--primary" @click="$emit('new-topic')">Criar o primeiro tópico</button>
    </div>

    <!-- Lista de tópicos -->
    <ul v-else class="forum-topics__list">
      <li
        v-for="topic in topics"
        :key="topic.id"
        class="c-card forum-topics__item"
        @click="$emit('select', topic)"
        role="button"
        tabindex="0"
        @keydown.enter="$emit('select', topic)"
      >
        <div class="forum-topics__item-main">
          <span v-if="topic.isPinned" class="c-badge c-badge--gold forum-topics__pin">📌 Fixado</span>
          <h3 class="forum-topics__item-title">{{ topic.title }}</h3>
          <p class="forum-topics__item-meta u-text--muted">
            por <strong>{{ topic.author?.username ?? 'Anônimo' }}</strong>
            · {{ formatDate(topic.createdAt) }}
          </p>
        </div>
        <div class="forum-topics__item-stats">
          <span class="c-badge c-badge--ghost">💬 {{ topic.postCount ?? 0 }}</span>
          <span class="c-badge c-badge--ghost">👁 {{ topic.views ?? 0 }}</span>
        </div>
      </li>
    </ul>

    <!-- Paginação -->
    <div v-if="pagination && pagination.pages > 1" class="forum-topics__pagination">
      <button
        class="c-btn c-btn--ghost c-btn--sm"
        :disabled="currentPage <= 1"
        @click="$emit('page', currentPage - 1)"
      >← Anterior</button>
      <span class="u-text--muted">{{ currentPage }} / {{ pagination.pages }}</span>
      <button
        class="c-btn c-btn--ghost c-btn--sm"
        :disabled="currentPage >= pagination.pages"
        @click="$emit('page', currentPage + 1)"
      >Próximo →</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  topics:       { type: Array,  default: () => [] },
  loading:      { type: Boolean, default: false },
  error:        { type: String, default: null },
  categoryName: { type: String, default: '' },
  pagination:   { type: Object, default: null },
  currentPage:  { type: Number, default: 1 },
})

defineEmits(['back', 'select', 'new-topic', 'retry', 'page'])

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.forum-topics {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;

    h2 { flex: 1; margin: 0; font-size: 1.2rem; }
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__error,
  &__empty {
    text-align: center;
    padding: $space-6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-2;
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
      border-color: rgba($brand-primary, 0.35);
      box-shadow: $shadow-sm;
    }
  }

  &__item-main {
    flex: 1;
    min-width: 0;
  }

  &__pin { margin-bottom: $space-1; display: inline-block; }

  &__item-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: $neutral-0;
    margin: 0 0 $space-1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-meta {
    font-size: 0.8rem;
    margin: 0;
  }

  &__item-stats {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    align-items: flex-end;
    flex-shrink: 0;

    @media (max-width: #{$bp-sm}) { display: none; }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-4;
    padding-top: $space-3;
  }
}

.c-skeleton--topic {
  height: 68px;
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
