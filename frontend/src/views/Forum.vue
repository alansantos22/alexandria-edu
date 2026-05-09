<template>
  <div>
    <!-- AppBar reutilizada do padrão Alexandria -->
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo">💬</span>
        <span>Alexandria <small class="u-text--muted">Comunidade</small></span>
      </div>
      <div class="c-appbar__actions">
        <button class="c-btn c-btn--ghost c-btn--sm" @click="router.push('/home')">
          ← Início
        </button>
      </div>
    </header>

    <main class="l-container p-forum">

      <!-- Hero -->
      <section class="p-forum__hero a-fade-in-up">
        <p class="u-text--eyebrow">Comunidade</p>
        <h1 class="p-forum__title">
          Fórum <span class="u-text--gradient">Alexandria</span>
        </h1>
        <p class="p-forum__lead">Tire dúvidas, compartilhe descobertas e aprenda com a comunidade.</p>
      </section>

      <!-- Conteúdo principal -->
      <div class="p-forum__body">

        <!-- VIEW: Categorias -->
        <template v-if="view === 'categories'">
          <ForumCategoryList
            :categories="categories"
            :loading="loading"
            :error="categoryError"
            :selected="selectedCategory?.cid ?? null"
            @select="selectCategory"
            @retry="loadCategories"
          />
        </template>

        <!-- VIEW: Tópicos da categoria -->
        <template v-else-if="view === 'topics'">
          <ForumTopicList
            :topics="topics"
            :loading="loading"
            :error="topicError"
            :category-name="selectedCategory?.name ?? ''"
            :pagination="pagination"
            :current-page="topicPage"
            @back="goToCategories"
            @select="selectTopic"
            @new-topic="openNewTopic"
            @retry="loadTopics"
            @page="changeTopicPage"
          />

          <!-- Formulário de novo tópico -->
          <ForumReplyForm
            v-if="showNewTopicForm"
            ref="newTopicForm"
            :is-new-topic="true"
            :submitting="submitting"
            @submit="submitNewTopic"
            @cancel="showNewTopicForm = false"
          />
        </template>

        <!-- VIEW: Detalhe do tópico -->
        <template v-else-if="view === 'detail'">
          <ForumTopicDetail
            :topic="selectedTopic"
            :posts="posts"
            :loading="loading"
            :error="topicDetailError"
            :pagination="postPagination"
            :current-page="postPage"
            @back="goToTopics"
            @retry="loadTopicDetail"
            @page="changePostPage"
          />

          <!-- Formulário de resposta -->
          <ForumReplyForm
            ref="replyForm"
            :is-new-topic="false"
            :submitting="submitting"
            @submit="submitReply"
            @cancel="() => {}"
          />
        </template>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { forumService } from '@/core/services/forum.service.js'
import ForumCategoryList from '@/components/forum/ForumCategoryList.vue'
import ForumTopicList    from '@/components/forum/ForumTopicList.vue'
import ForumTopicDetail  from '@/components/forum/ForumTopicDetail.vue'
import ForumReplyForm    from '@/components/forum/ForumReplyForm.vue'

const router = useRouter()

// Estado de navegação
const view = ref('categories') // 'categories' | 'topics' | 'detail'

// Dados
const categories       = ref([])
const topics           = ref([])
const posts            = ref([])
const selectedCategory = ref(null)
const selectedTopic    = ref(null)
const pagination       = ref(null)
const postPagination   = ref(null)

// Paginação
const topicPage = ref(1)
const postPage  = ref(1)

// Estado de UI
const loading          = ref(false)
const submitting       = ref(false)
const showNewTopicForm = ref(false)

// Erros por contexto
const categoryError    = ref(null)
const topicError       = ref(null)
const topicDetailError = ref(null)

// Refs de formulários
const replyForm    = ref(null)
const newTopicForm = ref(null)

async function init() {
  loadCategories()
}

async function loadCategories() {
  loading.value = true
  categoryError.value = null
  try {
    const data = await forumService.getCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch {
    categoryError.value = 'Não foi possível carregar as categorias.'
  } finally {
    loading.value = false
  }
}

async function loadTopics() {
  if (!selectedCategory.value) return
  loading.value = true
  topicError.value = null
  try {
    const data = await forumService.getTopics(selectedCategory.value.id, topicPage.value)
    topics.value     = data.topics ?? []
    pagination.value = data.pagination ?? null
  } catch {
    topicError.value = 'Não foi possível carregar os tópicos.'
  } finally {
    loading.value = false
  }
}

async function loadTopicDetail() {
  if (!selectedTopic.value) return
  loading.value = true
  topicDetailError.value = null
  try {
    const data = await forumService.getTopic(selectedTopic.value.id, postPage.value)
    selectedTopic.value  = data.topic
    posts.value          = data.posts ?? []
    postPagination.value = data.pagination ?? null
  } catch {
    topicDetailError.value = 'Não foi possível carregar o tópico.'
  } finally {
    loading.value = false
  }
}

function selectCategory(category) {
  selectedCategory.value = category
  topicPage.value = 1
  view.value = 'topics'
  loadTopics()
}

function selectTopic(topic) {
  selectedTopic.value = topic
  postPage.value = 1
  view.value = 'detail'
  loadTopicDetail()
}

function goToCategories() {
  view.value = 'categories'
  selectedCategory.value = null
}

function goToTopics() {
  view.value = 'topics'
  selectedTopic.value = null
  showNewTopicForm.value = false
}

function openNewTopic() {
  showNewTopicForm.value = true
  setTimeout(() => {
    document.querySelector('.forum-reply')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

function changeTopicPage(page) {
  topicPage.value = page
  loadTopics()
}

function changePostPage(page) {
  postPage.value = page
  loadTopicDetail()
}

async function submitReply({ content }) {
  submitting.value = true
  try {
    await forumService.createReply(selectedTopic.value.id, content)
    replyForm.value?.reset()
    await loadTopicDetail()
  } catch {
    if (replyForm.value) replyForm.value.errors.general = 'Erro ao enviar resposta. Tente novamente.'
  } finally {
    submitting.value = false
  }
}

async function submitNewTopic({ title, content }) {
  submitting.value = true
  try {
    const topic = await forumService.createTopic(selectedCategory.value.id, title, content)
    showNewTopicForm.value = false
    newTopicForm.value?.reset()
    await loadTopics()
    if (topic?.id) {
      selectTopic(topic)
    }
  } catch {
    if (newTopicForm.value) newTopicForm.value.errors.general = 'Erro ao criar tópico. Tente novamente.'
  } finally {
    submitting.value = false
  }
}

onMounted(init)
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.p-forum {
  padding-top: $space-6;
  padding-bottom: $space-9;

  &__hero {
    margin-bottom: $space-6;
  }

  &__title {
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 800;
    margin: $space-2 0;
    color: $neutral-0;
  }

  &__lead {
    color: $neutral-300;
    font-size: 1rem;
    margin: 0;
  }

  &__offline {
    text-align: center;
    padding: $space-8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;

    code {
      background: rgba($neutral-900, 0.6);
      padding: $space-2 $space-3;
      border-radius: $radius-sm;
      font-family: monospace;
      color: $brand-secondary;
      font-size: 0.88rem;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }
}
</style>
