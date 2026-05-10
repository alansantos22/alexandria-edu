<template>
  <section class="c-bento p-admin__grid a-fade-in-up">
    <article class="c-card c-bento__cell--hero p-admin__live">
      <div class="c-card__icon"><Radio :size="22" /></div>
      <p class="c-card__eyebrow">Mentoria ao vivo</p>
      <h2 class="c-card__title">URL da sala</h2>
      <p class="c-card__body">
        Cole aqui o link do Google Meet, Zoom ou outra plataforma.
        Os alunos verão o botão "Entrar na mentoria" assim que estiver salvo.
      </p>
      <div class="c-field p-admin__live-field">
        <label class="c-field__label" for="live-link">
          <LinkIcon :size="16" /> Live URL
        </label>
        <input
          id="live-link"
          v-model="liveLink"
          class="c-field__input"
          type="url"
          placeholder="https://meet.google.com/..."
        />
      </div>
      <div class="p-admin__actions">
        <button class="c-btn" :disabled="loading" @click="updateLink">
          <Save :size="16" />
          <span>{{ loading ? 'Salvando…' : 'Salvar link' }}</span>
        </button>
        <a
          v-if="liveLink"
          :href="liveLink"
          target="_blank"
          rel="noopener"
          class="c-btn c-btn--ghost c-btn--sm"
        >
          <ExternalLink :size="14" /> Testar
        </a>
      </div>
      <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'">
        <component :is="success ? CircleCheck : CircleAlert" :size="16" />
        {{ message }}
      </p>
    </article>

    <article class="c-card c-card--secondary c-bento__cell">
      <div class="c-card__icon"><Users :size="22" /></div>
      <p class="c-card__eyebrow">Alunos</p>
      <h3 class="c-card__title">Comunidade</h3>
      <p class="c-card__body">Em breve: gestão de alunos e papéis.</p>
    </article>

    <article class="c-card c-card--accent c-bento__cell">
      <div class="c-card__icon"><Library :size="22" /></div>
      <p class="c-card__eyebrow">Conteúdo</p>
      <h3 class="c-card__title">Aulas</h3>
      <p class="c-card__body">Em breve: criar e organizar trilhas.</p>
    </article>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Radio, Link as LinkIcon, Save, ExternalLink,
  CircleCheck, CircleAlert, Users, Library,
} from 'lucide-vue-next'
import api from '@/core/api'

const liveLink = ref('')
const message  = ref('')
const success  = ref(false)
const loading  = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/settings/live-link')
    liveLink.value = data.url
  } catch (err) { console.error(err) }
})

async function updateLink() {
  message.value = ''
  loading.value = true
  try {
    const { data } = await api.put('/settings/live-link', { link: liveLink.value })
    if (data.success) {
      success.value = true
      message.value = 'Link atualizado com sucesso!'
    }
  } catch (err) {
    success.value = false
    const msg = err.response?.data?.message
    message.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Falha ao atualizar'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__live {
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0,217,192,0.18), transparent 60%),
    var(--bg-elevated);
}

.p-admin__live-field { margin: $space-4 0; }

.p-admin__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  align-items: center;
  margin-bottom: $space-3;
}
</style>
