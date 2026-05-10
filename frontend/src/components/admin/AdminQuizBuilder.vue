<template>
  <div class="quiz-builder">
    <h4 class="quiz-builder__title">
      <BookOpen :size="16" /> Nova Prova para "{{ moduleName }}"
    </h4>

    <!-- Cabeçalho da prova -->
    <div class="c-field">
      <label class="c-field__label">Título da prova *</label>
      <input v-model="form.title" class="c-field__input" placeholder="Ex: Avaliação do Módulo 1" />
    </div>

    <div class="quiz-builder__row">
      <div class="c-field">
        <label class="c-field__label">Tempo por questão (seg)</label>
        <input v-model.number="form.timeWindowSeconds" class="c-field__input" type="number" min="10" />
      </div>
      <div class="c-field">
        <label class="c-field__label">Nota mínima (%)</label>
        <input v-model.number="form.passingScore" class="c-field__input" type="number" min="0" max="100" />
      </div>
    </div>

    <div class="c-field">
      <label class="c-field__label">Descrição</label>
      <textarea v-model="form.description" class="c-field__input" rows="2" />
    </div>

    <!-- Questões -->
    <div class="quiz-builder__questions">
      <div
        v-for="(q, qi) in form.questions"
        :key="qi"
        class="quiz-builder__question"
      >
        <div class="quiz-builder__q-header">
          <span class="quiz-builder__q-num">Q{{ qi + 1 }}</span>
          <button class="c-btn c-btn--ghost c-btn--sm quiz-builder__remove" @click="removeQuestion(qi)">
            <Trash2 :size="14" />
          </button>
        </div>

        <div class="c-field">
          <label class="c-field__label">Enunciado *</label>
          <textarea v-model="q.text" class="c-field__input" rows="2" placeholder="Digite a pergunta..." />
        </div>

        <div class="c-field">
          <label class="c-field__label">Aula de revisão (opcional)</label>
          <select v-model="q.reviewLessonId" class="c-field__input">
            <option value="">— Nenhuma —</option>
            <option v-for="lesson in availableLessons" :key="lesson.id" :value="lesson.id">
              {{ lesson.title }}
            </option>
          </select>
        </div>

        <!-- Opções -->
        <div class="quiz-builder__options">
          <div
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="quiz-builder__option"
          >
            <input
              v-model="opt.isCorrect"
              type="radio"
              :name="`q-${qi}-correct`"
              :value="true"
              class="quiz-builder__radio"
              @change="setCorrect(qi, oi)"
            />
            <input v-model="opt.text" class="c-field__input quiz-builder__opt-input" :placeholder="`Opção ${oi + 1}`" />
            <button class="c-btn c-btn--ghost c-btn--sm" @click="removeOption(qi, oi)">
              <X :size="12" />
            </button>
          </div>

          <button class="c-btn c-btn--ghost c-btn--sm quiz-builder__add-opt" @click="addOption(qi)">
            <Plus :size="14" /> Opção
          </button>
        </div>
      </div>
    </div>

    <button class="c-btn c-btn--ghost quiz-builder__add-q" @click="addQuestion">
      <Plus :size="16" /> Adicionar questão
    </button>

    <div v-if="error" class="c-field__error">{{ error }}</div>

    <div class="quiz-builder__footer">
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('cancel')">Cancelar</button>
      <button class="c-btn" :disabled="saving" @click="save">
        <Save :size="16" /> {{ saving ? 'Salvando…' : 'Criar prova' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BookOpen, Trash2, Plus, Save, X } from 'lucide-vue-next'
import api from '@/core/api'

const props = defineProps({
  moduleId:        { type: String, required: true },
  moduleName:      { type: String, default: '' },
  availableLessons:{ type: Array,  default: () => [] },
})

const emit = defineEmits(['created', 'cancel'])

const saving = ref(false)
const error  = ref('')

const form = ref({
  title:             '',
  description:       '',
  timeWindowSeconds: 45,
  passingScore:      70,
  questions:         [],
})

function addQuestion() {
  form.value.questions.push({
    text:           '',
    reviewLessonId: '',
    options:        [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ],
  })
}

function removeQuestion(qi) {
  form.value.questions.splice(qi, 1)
}

function addOption(qi) {
  form.value.questions[qi].options.push({ text: '', isCorrect: false })
}

function removeOption(qi, oi) {
  form.value.questions[qi].options.splice(oi, 1)
}

function setCorrect(qi, oi) {
  form.value.questions[qi].options.forEach((opt, idx) => {
    opt.isCorrect = idx === oi
  })
}

async function save() {
  error.value = ''
  if (!form.value.title.trim()) { error.value = 'Título obrigatório.'; return }

  const invalidQ = form.value.questions.findIndex(
    (q) => !q.text.trim() || q.options.length < 2 || !q.options.some((o) => o.isCorrect),
  )
  if (invalidQ !== -1) {
    error.value = `Questão ${invalidQ + 1}: preencha o enunciado, ao menos 2 opções e marque a correta.`
    return
  }

  saving.value = true
  try {
    const payload = {
      moduleId:          props.moduleId,
      title:             form.value.title,
      description:       form.value.description || undefined,
      timeWindowSeconds: form.value.timeWindowSeconds,
      passingScore:      form.value.passingScore,
      questions:         form.value.questions.map((q) => ({
        text:           q.text,
        reviewLessonId: q.reviewLessonId || undefined,
        options:        q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      })),
    }
    const { data } = await api.post('/admin/content/quizzes', payload)
    emit('created', data)
  } catch (e) {
    error.value = e.response?.data?.message || 'Erro ao criar prova.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.quiz-builder {
  padding: $space-4;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-lg;
  background: var(--bg-elevated);
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &__title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-base;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-3;
  }

  &__questions {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__question {
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: $space-3;
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__q-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__q-num {
    font-size: $fs-sm;
    font-weight: 700;
    color: var(--color-primary);
  }

  &__remove {
    color: var(--color-danger, #e74c3c);
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    margin-top: $space-1;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__radio {
    accent-color: var(--color-success, #00d9c0);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__opt-input {
    flex: 1;
  }

  &__add-opt {
    align-self: flex-start;
    font-size: $fs-xs;
  }

  &__add-q {
    align-self: flex-start;
  }

  &__footer {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
  }
}
</style>
