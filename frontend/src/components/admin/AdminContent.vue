<template>
  <div class="content-admin">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="content-admin__header">
      <h2 class="content-admin__heading">
        <Library :size="20" /> Hierarquia de Conteúdo
      </h2>
      <button class="c-btn c-btn--sm" @click="showTrailForm = true">
        <Plus :size="16" /> Nova Trilha
      </button>
    </div>

    <!-- ── Formulário: Nova Trilha ────────────────────────────────────────── -->
    <div v-if="showTrailForm" class="content-admin__form c-card">
      <h4>Nova Trilha</h4>
      <div class="c-field">
        <label class="c-field__label">Título *</label>
        <input v-model="trailForm.title" class="c-field__input" placeholder="Ex: Desenvolvimento Web" />
      </div>
      <div class="c-field">
        <label class="c-field__label">Descrição</label>
        <textarea v-model="trailForm.description" class="c-field__input" rows="2" />
      </div>
      <div class="content-admin__form-actions">
        <button class="c-btn c-btn--ghost c-btn--sm" @click="cancelTrailForm">Cancelar</button>
        <button class="c-btn c-btn--sm" :disabled="saving" @click="createTrail">
          <Save :size="14" /> {{ saving ? 'Salvando…' : 'Criar' }}
        </button>
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="content-admin__loading">
      <Loader2 :size="24" class="content-admin__spinner" /> Carregando hierarquia…
    </div>

    <!-- ── Árvore ─────────────────────────────────────────────────────────── -->
    <div v-else-if="trails.length" class="content-admin__tree">

      <!-- TRILHAS (D&D) -->
      <VueDraggable
        v-model="trails"
        item-key="id"
        handle=".drag-handle"
        animation="200"
        @end="saveOrder('trails', trails)"
      >
        <template #item="{ element: trail }">
          <div class="content-admin__trail">

            <!-- Cabeçalho da trilha -->
            <div class="content-admin__node content-admin__node--trail">
              <span class="drag-handle"><GripVertical :size="16" /></span>
              <BookMarked :size="16" />
              <span class="content-admin__node-title">{{ trail.title }}</span>
              <span :class="['c-badge', trail.isPublished ? 'c-badge--success' : 'c-badge--muted']">
                {{ trail.isPublished ? 'Publicada' : 'Rascunho' }}
              </span>
              <div class="content-admin__node-actions">
                <button class="c-btn c-btn--ghost c-btn--sm" @click="togglePublish('trails', trail)">
                  {{ trail.isPublished ? 'Despublicar' : 'Publicar' }}
                </button>
                <button class="c-btn c-btn--ghost c-btn--sm" @click="openCourseForm(trail)">
                  <Plus :size="14" /> Curso
                </button>
                <button
                  class="c-btn c-btn--ghost c-btn--sm"
                  @click="trail._open = !trail._open"
                >
                  <component :is="trail._open ? ChevronUp : ChevronDown" :size="14" />
                </button>
              </div>
            </div>

            <!-- Formulário novo curso inline -->
            <div v-if="activeCourseTrailId === trail.id" class="content-admin__inline-form">
              <input v-model="courseForm.title" class="c-field__input" placeholder="Título do curso *" />
              <textarea v-model="courseForm.description" class="c-field__input" rows="1" placeholder="Descrição (opcional)" />
              <div class="content-admin__form-actions">
                <button class="c-btn c-btn--ghost c-btn--sm" @click="activeCourseTrailId = null">Cancelar</button>
                <button class="c-btn c-btn--sm" :disabled="saving" @click="createCourse(trail)">
                  <Save :size="14" /> Criar curso
                </button>
              </div>
            </div>

            <!-- CURSOS (D&D) -->
            <div v-if="trail._open !== false" class="content-admin__children">
              <VueDraggable
                v-model="trail.courses"
                item-key="id"
                handle=".drag-handle"
                animation="200"
                @end="saveOrder('courses', trail.courses)"
              >
                <template #item="{ element: course }">
                  <div class="content-admin__course">

                    <div class="content-admin__node content-admin__node--course">
                      <span class="drag-handle"><GripVertical :size="16" /></span>
                      <BookOpen :size="16" />
                      <span class="content-admin__node-title">{{ course.title }}</span>
                      <span :class="['c-badge', course.isPublished ? 'c-badge--success' : 'c-badge--muted']">
                        {{ course.isPublished ? 'Publicado' : 'Rascunho' }}
                      </span>
                      <div class="content-admin__node-actions">
                        <button class="c-btn c-btn--ghost c-btn--sm" @click="togglePublish('courses', course)">
                          {{ course.isPublished ? 'Despublicar' : 'Publicar' }}
                        </button>
                        <button class="c-btn c-btn--ghost c-btn--sm" @click="openModuleForm(course)">
                          <Plus :size="14" /> Módulo
                        </button>
                        <button
                          class="c-btn c-btn--ghost c-btn--sm"
                          @click="course._open = !course._open"
                        >
                          <component :is="course._open ? ChevronUp : ChevronDown" :size="14" />
                        </button>
                      </div>
                    </div>

                    <!-- Formulário novo módulo inline -->
                    <div v-if="activeModuleCourseId === course.id" class="content-admin__inline-form">
                      <input v-model="moduleForm.title" class="c-field__input" placeholder="Título do módulo *" />
                      <textarea v-model="moduleForm.description" class="c-field__input" rows="1" placeholder="Descrição (opcional)" />
                      <div class="content-admin__form-actions">
                        <button class="c-btn c-btn--ghost c-btn--sm" @click="activeModuleCourseId = null">Cancelar</button>
                        <button class="c-btn c-btn--sm" :disabled="saving" @click="createModule(course)">
                          <Save :size="14" /> Criar módulo
                        </button>
                      </div>
                    </div>

                    <!-- MÓDULOS (D&D) -->
                    <div v-if="course._open !== false" class="content-admin__children">
                      <VueDraggable
                        v-model="course.modules"
                        item-key="id"
                        handle=".drag-handle"
                        animation="200"
                        @end="saveOrder('modules', course.modules)"
                      >
                        <template #item="{ element: mod }">
                          <div class="content-admin__module">

                            <div class="content-admin__node content-admin__node--module">
                              <span class="drag-handle"><GripVertical :size="16" /></span>
                              <Layers :size="16" />
                              <span class="content-admin__node-title">{{ mod.title }}</span>
                              <span :class="['c-badge', mod.isPublished ? 'c-badge--success' : 'c-badge--muted']">
                                {{ mod.isPublished ? 'Publicado' : 'Rascunho' }}
                              </span>
                              <div class="content-admin__node-actions">
                                <button class="c-btn c-btn--ghost c-btn--sm" @click="togglePublish('modules', mod)">
                                  {{ mod.isPublished ? 'Despublicar' : 'Publicar' }}
                                </button>
                                <button class="c-btn c-btn--ghost c-btn--sm" @click="openQuizBuilder(mod)">
                                  <ClipboardList :size="14" /> Prova
                                </button>
                                <button
                                  class="c-btn c-btn--ghost c-btn--sm"
                                  @click="mod._open = !mod._open"
                                >
                                  <component :is="mod._open ? ChevronUp : ChevronDown" :size="14" />
                                </button>
                              </div>
                            </div>

                            <!-- Quiz builder inline -->
                            <AdminQuizBuilder
                              v-if="activeQuizModuleId === mod.id"
                              :module-id="mod.id"
                              :module-name="mod.title"
                              :available-lessons="mod.lessons"
                              @created="onQuizCreated(mod, $event)"
                              @cancel="activeQuizModuleId = null"
                            />

                            <!-- AULAS (D&D) -->
                            <div v-if="mod._open !== false" class="content-admin__children">
                              <!-- Provas existentes -->
                              <div
                                v-for="quiz in mod.quizzes"
                                :key="quiz.id"
                                class="content-admin__node content-admin__node--quiz"
                              >
                                <ClipboardList :size="14" />
                                <span class="content-admin__node-title">{{ quiz.title }}</span>
                                <span class="c-badge c-badge--accent">
                                  {{ quiz.timeWindowSeconds }}s · ≥{{ quiz.passingScore }}%
                                </span>
                                <span :class="['c-badge', quiz.isPublished ? 'c-badge--success' : 'c-badge--muted']">
                                  {{ quiz.isPublished ? 'Publicada' : 'Rascunho' }}
                                </span>
                              </div>

                              <!-- Aulas -->
                              <VueDraggable
                                v-model="mod.lessons"
                                item-key="id"
                                handle=".drag-handle"
                                animation="200"
                                @end="saveOrder('lessons', mod.lessons)"
                              >
                                <template #item="{ element: lesson }">
                                  <div class="content-admin__node content-admin__node--lesson">
                                    <span class="drag-handle"><GripVertical :size="14" /></span>
                                    <PlayCircle :size="14" />
                                    <span class="content-admin__node-title">{{ lesson.title }}</span>
                                    <span :class="['c-badge', lesson.isPublished ? 'c-badge--success' : 'c-badge--muted']">
                                      {{ lesson.isPublished ? 'Publicada' : 'Rascunho' }}
                                    </span>
                                  </div>
                                </template>
                              </VueDraggable>
                            </div>

                          </div>
                        </template>
                      </VueDraggable>
                    </div>

                  </div>
                </template>
              </VueDraggable>
            </div>

          </div>
        </template>
      </VueDraggable>
    </div>

    <!-- ── Empty ──────────────────────────────────────────────────────────── -->
    <div v-else class="content-admin__empty">
      <Library :size="36" style="opacity:.3" />
      <p>Nenhuma trilha cadastrada. Crie a primeira!</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VueDraggable }   from 'vue-draggable-plus'
import {
  Library, Plus, Save, Loader2, GripVertical,
  BookMarked, BookOpen, Layers, PlayCircle,
  ClipboardList, ChevronDown, ChevronUp,
} from 'lucide-vue-next'
import api from '@/core/api'
import AdminQuizBuilder from './AdminQuizBuilder.vue'

// ── Estado ─────────────────────────────────────────────────────────────────

const trails  = ref([])
const loading = ref(false)
const saving  = ref(false)

const showTrailForm       = ref(false)
const activeCourseTrailId = ref(null)
const activeModuleCourseId= ref(null)
const activeQuizModuleId  = ref(null)

const trailForm  = ref({ title: '', description: '' })
const courseForm = ref({ title: '', description: '' })
const moduleForm = ref({ title: '', description: '' })

// ── Carga inicial ───────────────────────────────────────────────────────────

onMounted(loadHierarchy)

async function loadHierarchy() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/content/hierarchy')
    // Adicionar _open = true para exibir por padrão
    trails.value = data.map((t) => ({
      ...t,
      _open: true,
      courses: (t.courses || []).map((c) => ({
        ...c,
        _open: true,
        modules: (c.modules || []).map((m) => ({ ...m, _open: true })),
      })),
    }))
  } catch (e) {
    console.error('Erro ao carregar hierarquia:', e)
  } finally {
    loading.value = false
  }
}

// ── Criar trilha ───────────────────────────────────────────────────────────

function cancelTrailForm() {
  showTrailForm.value = false
  trailForm.value = { title: '', description: '' }
}

async function createTrail() {
  if (!trailForm.value.title.trim()) return
  saving.value = true
  try {
    const { data } = await api.post('/admin/content/trails', {
      title:       trailForm.value.title,
      description: trailForm.value.description || undefined,
    })
    trails.value.push({ ...data, _open: true, courses: [] })
    cancelTrailForm()
  } finally {
    saving.value = false
  }
}

// ── Criar curso ────────────────────────────────────────────────────────────

function openCourseForm(trail) {
  activeCourseTrailId.value = activeCourseTrailId.value === trail.id ? null : trail.id
  courseForm.value = { title: '', description: '' }
}

async function createCourse(trail) {
  if (!courseForm.value.title.trim()) return
  saving.value = true
  try {
    const { data } = await api.post('/admin/content/courses', {
      trailId:     trail.id,
      title:       courseForm.value.title,
      description: courseForm.value.description || undefined,
    })
    trail.courses.push({ ...data, _open: true, modules: [] })
    activeCourseTrailId.value = null
  } finally {
    saving.value = false
  }
}

// ── Criar módulo ───────────────────────────────────────────────────────────

function openModuleForm(course) {
  activeModuleCourseId.value = activeModuleCourseId.value === course.id ? null : course.id
  moduleForm.value = { title: '', description: '' }
}

async function createModule(course) {
  if (!moduleForm.value.title.trim()) return
  saving.value = true
  try {
    const { data } = await api.post('/admin/content/modules', {
      courseId:    course.id,
      title:       moduleForm.value.title,
      description: moduleForm.value.description || undefined,
    })
    course.modules.push({ ...data, _open: true, lessons: [], quizzes: [] })
    activeModuleCourseId.value = null
  } finally {
    saving.value = false
  }
}

// ── Prova ──────────────────────────────────────────────────────────────────

function openQuizBuilder(mod) {
  activeQuizModuleId.value = activeQuizModuleId.value === mod.id ? null : mod.id
}

function onQuizCreated(mod, quiz) {
  mod.quizzes = mod.quizzes || []
  mod.quizzes.push(quiz)
  activeQuizModuleId.value = null
}

// ── Publicar / Despublicar ─────────────────────────────────────────────────

async function togglePublish(type, item) {
  const routeMap = { trails: 'trails', courses: 'courses', modules: 'modules' }
  try {
    await api.patch(`/admin/content/${routeMap[type]}/${item.id}`, {
      isPublished: !item.isPublished,
    })
    item.isPublished = !item.isPublished
  } catch (e) {
    console.error('Erro ao atualizar publicação:', e)
  }
}

// ── Reordenar (D&D) ────────────────────────────────────────────────────────

async function saveOrder(type, items) {
  try {
    await api.patch('/admin/content/reorder', {
      type,
      items: items.map((item, idx) => ({ id: item.id, orderIndex: idx })),
    })
  } catch (e) {
    console.error('Erro ao salvar ordem:', e)
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.content-admin {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-lg;
    font-weight: 700;
  }

  &__form {
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__inline-form {
    padding: $space-3;
    background: var(--bg-elevated);
    border-radius: $radius-md;
    display: flex;
    flex-direction: column;
    gap: $space-2;
    margin: $space-1 0 $space-1 $space-6;
  }

  &__form-actions {
    display: flex;
    gap: $space-2;
    justify-content: flex-end;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: $space-2;
    color: var(--text-muted);
    padding: $space-6 0;
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  // ── Árvore ────────────────────────────────────────────────────────────────

  &__tree {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__trail,
  &__course,
  &__module {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__children {
    margin-left: $space-6;
    display: flex;
    flex-direction: column;
    gap: $space-2;
    border-left: 2px solid var(--border-subtle);
    padding-left: $space-3;
  }

  // ── Nó da árvore ──────────────────────────────────────────────────────────

  &__node {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    flex-wrap: wrap;

    &--trail  { background: rgba(108, 92, 231, 0.08); border-color: rgba(108, 92, 231, 0.25); }
    &--course { background: rgba(0, 217, 192, 0.06);  border-color: rgba(0, 217, 192, 0.2); }
    &--module { background: var(--bg-elevated); }
    &--lesson { padding: $space-1 $space-3; font-size: $fs-sm; }
    &--quiz   { padding: $space-1 $space-3; font-size: $fs-sm; gap: $space-2; }
  }

  &__node-title {
    flex: 1;
    font-weight: 500;
    font-size: $fs-sm;
    color: var(--text-primary);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__node-actions {
    display: flex;
    gap: $space-1;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    flex-shrink: 0;
    &:active { cursor: grabbing; }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    padding: $space-8 0;
    color: var(--text-muted);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
