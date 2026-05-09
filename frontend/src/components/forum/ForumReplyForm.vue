<template>
  <div class="forum-reply">
    <h3 class="forum-reply__title">{{ isNewTopic ? 'Novo tópico' : 'Sua resposta' }}</h3>

    <form class="forum-reply__form" @submit.prevent="submit">
      <!-- Campos exclusivos de novo tópico -->
      <template v-if="isNewTopic">
        <div class="forum-reply__field">
          <label class="forum-reply__label" for="forum-title">Título</label>
          <input
            id="forum-title"
            v-model="form.title"
            class="forum-reply__input"
            :class="{ 'forum-reply__input--error': errors.title }"
            type="text"
            placeholder="Título do seu tópico..."
            maxlength="120"
            required
          />
          <span v-if="errors.title" class="forum-reply__error-msg">{{ errors.title }}</span>
        </div>
      </template>

      <!-- Conteúdo -->
      <div class="forum-reply__field">
        <label class="forum-reply__label" for="forum-content">
          {{ isNewTopic ? 'Conteúdo' : 'Mensagem' }}
        </label>
        <textarea
          id="forum-content"
          v-model="form.content"
          class="forum-reply__textarea"
          :class="{ 'forum-reply__textarea--error': errors.content }"
          :placeholder="isNewTopic ? 'Descreva seu tópico...' : 'Escreva sua resposta...'"
          rows="6"
          required
        />
        <span v-if="errors.content" class="forum-reply__error-msg">{{ errors.content }}</span>
        <span class="forum-reply__chars u-text--muted">{{ form.content.length }} caracteres</span>
      </div>

      <!-- Ações -->
      <div class="forum-reply__actions">
        <button type="button" class="c-btn c-btn--ghost" @click="$emit('cancel')">Cancelar</button>
        <button type="submit" class="c-btn c-btn--primary" :disabled="submitting">
          <span v-if="submitting">Enviando...</span>
          <span v-else>{{ isNewTopic ? 'Publicar tópico' : 'Enviar resposta' }}</span>
        </button>
      </div>

      <!-- Erro geral -->
      <p v-if="errors.general" class="forum-reply__error-msg forum-reply__error-msg--general">
        {{ errors.general }}
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  isNewTopic: { type: Boolean, default: false },
  submitting:  { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({ title: '', content: '' })
const errors = reactive({ title: null, content: null, general: null })

function validate() {
  errors.title = null
  errors.content = null
  errors.general = null

  if (props.isNewTopic && (!form.title || form.title.trim().length < 5)) {
    errors.title = 'O título precisa ter pelo menos 5 caracteres.'
    return false
  }
  if (!form.content || form.content.trim().length < 10) {
    errors.content = 'A mensagem precisa ter pelo menos 10 caracteres.'
    return false
  }
  return true
}

function submit() {
  if (!validate()) return
  emit('submit', { title: form.title.trim(), content: form.content.trim() })
}

function reset() {
  form.title = ''
  form.content = ''
  errors.title = null
  errors.content = null
  errors.general = null
}

defineExpose({ reset, errors })
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.forum-reply {
  background: rgba($neutral-800, 0.6);
  border: 1px solid rgba($neutral-600, 0.3);
  border-radius: $radius-lg;
  padding: $space-5;
  backdrop-filter: blur(12px);

  &__title {
    font-size: 1.05rem;
    font-weight: 600;
    color: $neutral-0;
    margin: 0 0 $space-4;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $neutral-300;
  }

  &__input,
  &__textarea {
    background: rgba($neutral-900, 0.5);
    border: 1px solid rgba($neutral-600, 0.4);
    border-radius: $radius-md;
    color: $neutral-0;
    padding: $space-3 $space-4;
    font-size: 0.92rem;
    font-family: inherit;
    transition: border-color $dur-base $ease-out, box-shadow $dur-base $ease-out;
    resize: vertical;
    width: 100%;
    box-sizing: border-box;

    &::placeholder { color: $neutral-500; }

    &:focus {
      outline: none;
      border-color: $brand-primary;
      box-shadow: $shadow-glow-primary;
    }

    &--error {
      border-color: $state-error !important;
    }
  }

  &__textarea { min-height: 120px; }

  &__chars {
    font-size: 0.78rem;
    text-align: right;
  }

  &__error-msg {
    font-size: 0.82rem;
    color: $state-error;
    margin: 0;

    &--general {
      text-align: center;
      padding: $space-2;
      background: rgba($state-error, 0.1);
      border-radius: $radius-sm;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
  }
}
</style>
