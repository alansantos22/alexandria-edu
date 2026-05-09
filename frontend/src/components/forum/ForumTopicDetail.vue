<template>
  <div class="forum-detail">
    <!-- Header -->
    <div class="forum-detail__header">
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('back')">← Voltar</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="forum-detail__loading">
      <div class="c-skeleton c-skeleton--title" />
      <div class="c-skeleton c-skeleton--post" v-for="n in 3" :key="n" />
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="c-card forum-detail__error">
      <p>{{ error }}</p>
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('retry')">Tentar novamente</button>
    </div>

    <template v-else-if="topic">
      <!-- Título do tópico -->
      <div class="c-card forum-detail__topic-header">
        <span v-if="topic.isPinned" class="c-badge c-badge--gold">📌 Fixado</span>
        <h2 class="forum-detail__title">{{ topic.title }}</h2>
        <p class="u-text--muted forum-detail__meta">
          por <strong>{{ topic.author?.username ?? 'Anônimo' }}</strong>
          · {{ formatDate(topic.createdAt) }}
          · <span class="c-badge c-badge--ghost">👁 {{ topic.views ?? 0 }}</span>
        </p>
      </div>

      <!-- Posts / Respostas -->
      <ul class="forum-detail__posts">
        <li
          v-for="(post, index) in posts"
          :key="post.id"
          class="c-card forum-detail__post"
          :class="{ 'forum-detail__post--op': index === 0 }"
        >
          <div class="forum-detail__post-author">
            <div class="forum-detail__avatar">
              {{ (post.author?.username ?? '?')[0].toUpperCase() }}
            </div>
            <div>
              <strong class="forum-detail__username">{{ post.author?.username ?? 'Anônimo' }}</strong>
              <p class="u-text--muted forum-detail__date">{{ formatDate(post.createdAt) }}</p>
            </div>
            <span v-if="index === 0" class="c-badge c-badge--primary forum-detail__op-badge">OP</span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="forum-detail__post-content" v-html="post.content" />
        </li>
      </ul>

      <!-- Paginação -->
      <div v-if="pagination && pagination.pages > 1" class="forum-detail__pagination">
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
    </template>
  </div>
</template>

<script setup>
defineProps({
  topic:       { type: Object, default: null },
  posts:       { type: Array,  default: () => [] },
  loading:     { type: Boolean, default: false },
  error:       { type: String, default: null },
  pagination:  { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
})

defineEmits(['back', 'retry', 'page'])

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.forum-detail {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header { display: flex; }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__error {
    text-align: center;
    padding: $space-6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
  }

  &__topic-header {
    padding: $space-5;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__title {
    font-size: 1.4rem;
    font-weight: 700;
    color: $neutral-0;
    margin: 0;
  }

  &__meta {
    font-size: 0.85rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-wrap: wrap;
  }

  &__posts {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__post {
    padding: $space-5;

    &--op {
      border-left: 3px solid $brand-primary;
    }
  }

  &__post-author {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-4;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: $gradient-violet;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: $neutral-0;
    flex-shrink: 0;
  }

  &__username {
    font-size: 0.9rem;
    color: $neutral-0;
  }

  &__date {
    font-size: 0.78rem;
    margin: 0;
  }

  &__op-badge {
    margin-left: auto;
  }

  &__post-content {
    font-size: 0.92rem;
    line-height: 1.7;
    color: $neutral-200;

    :deep(a)    { color: $brand-primary; }
    :deep(pre)  { background: rgba($neutral-900, 0.6); padding: $space-4; border-radius: $radius-md; overflow-x: auto; }
    :deep(code) { font-family: monospace; color: $brand-secondary; }
    :deep(img)  { max-width: 100%; border-radius: $radius-sm; }
    :deep(blockquote) {
      border-left: 3px solid rgba($brand-primary, 0.5);
      padding-left: $space-4;
      color: $neutral-400;
      margin: $space-3 0;
    }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-4;
    padding-top: $space-2;
  }
}

.c-skeleton--title {
  height: 96px;
  border-radius: $radius-md;
  background: linear-gradient(90deg, rgba($neutral-700, 0.4) 25%, rgba($neutral-600, 0.4) 50%, rgba($neutral-700, 0.4) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

.c-skeleton--post {
  height: 140px;
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
