<template>
  <article class="c-card c-bento__cell--hero p-admin__upload">
    <div class="c-card__icon"><ImagePlus :size="22" /></div>
    <p class="c-card__eyebrow">Marketplace</p>
    <h2 class="c-card__title">Upload de Background</h2>
    <p class="c-card__body">
      Faça o upload de uma imagem (JPG, PNG ou WEBP — máx. 5 MB) para adicionar
      ao marketplace como wallpaper de perfil.
    </p>

    <!-- Drag & Drop zone -->
    <div
      class="p-admin__dropzone"
      :class="{ 'is-dragover': dragover, 'has-file': previewUrl }"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <img v-if="previewUrl" :src="previewUrl" class="p-admin__dropzone-preview" alt="Preview" />
      <template v-else>
        <ImagePlus :size="32" class="p-admin__dropzone-icon" />
        <span>Arraste ou clique para selecionar</span>
        <small>JPG · PNG · WEBP · máx. 5 MB</small>
      </template>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="u-visually-hidden"
      @change="onFileSelect"
    />

    <!-- Metadados -->
    <div v-if="file" class="p-admin__upload-fields">
      <div class="c-field">
        <label class="c-field__label">Nome do item *</label>
        <input v-model="form.name" class="c-field__input" placeholder="Ex: Galáxia Roxo" maxlength="120" />
      </div>

      <div class="c-field">
        <label class="c-field__label">Descrição</label>
        <input v-model="form.description" class="c-field__input" placeholder="Opcional" maxlength="300" />
      </div>

      <div class="p-admin__upload-row">
        <div class="c-field">
          <label class="c-field__label">Raridade *</label>
          <select v-model="form.rarity" class="c-field__input">
            <option value="common">Comum</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Lendário</option>
          </select>
        </div>

        <div class="c-field">
          <label class="c-field__label">Preço (moedas) *</label>
          <input v-model.number="form.priceCoins" class="c-field__input" type="number" min="0" />
        </div>
      </div>

      <div class="p-admin__upload-row">
        <div class="c-field">
          <label class="c-field__label">Quantidade disponível</label>
          <select v-model="stockType" class="c-field__input">
            <option value="unlimited">Ilimitado</option>
            <option value="limited">Quantidade limitada</option>
          </select>
        </div>
        <div v-if="stockType === 'limited'" class="c-field">
          <label class="c-field__label">Unidades</label>
          <input v-model.number="form.stock" class="c-field__input" type="number" min="1" />
        </div>
      </div>

      <button
        class="c-btn"
        :disabled="uploading || !form.name"
        @click="upload"
      >
        <Upload :size="16" />
        <span>{{ uploading ? 'Enviando…' : 'Adicionar ao Marketplace' }}</span>
      </button>
    </div>

    <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'" class="p-admin__upload-msg">
      <component :is="success ? CircleCheck : CircleAlert" :size="16" />
      {{ message }}
    </p>
  </article>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ImagePlus, Upload, CircleCheck, CircleAlert } from 'lucide-vue-next'
import { adminUploadBackground } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const fileInput  = ref(null)
const file       = ref(null)
const previewUrl = ref(null)
const dragover   = ref(false)
const uploading  = ref(false)
const message    = ref('')
const success    = ref(false)
const stockType  = ref('unlimited')

const form = reactive({
  name:        '',
  description: '',
  rarity:      'common',
  priceCoins:  0,
  stock:       null,
})

function setFile(f) {
  if (!f) return
  if (f.size > 5 * 1024 * 1024) {
    message.value = 'Arquivo muito grande (máx. 5 MB).'
    success.value = false
    return
  }
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

function onDrop(e) {
  dragover.value = false
  setFile(e.dataTransfer.files[0])
}

function onFileSelect(e) {
  setFile(e.target.files[0])
}

async function upload() {
  if (!file.value || !form.name) return
  uploading.value = true
  message.value   = ''

  const fd = new FormData()
  fd.append('file', file.value)

  const params = new URLSearchParams({
    name:        form.name,
    description: form.description || '',
    rarity:      form.rarity,
    priceCoins:  String(form.priceCoins),
  })
  if (stockType.value === 'limited' && form.stock) {
    params.set('stock', String(form.stock))
  }

  try {
    const item = await adminUploadBackground(fd, params.toString())
    success.value = true
    message.value = `✅ "${item.name}" adicionado ao marketplace!`
    emit('created', item)
    // Reset
    file.value       = null
    previewUrl.value = null
    form.name        = ''
    form.description = ''
    form.rarity      = 'common'
    form.priceCoins  = 0
    stockType.value  = 'unlimited'
  } catch (err) {
    success.value = false
    message.value = err.response?.data?.message || 'Erro ao fazer upload.'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__upload {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.p-admin__dropzone {
  border: 2px dashed var(--glass-border);
  border-radius: $radius-lg;
  padding: $space-8;
  text-align: center;
  cursor: pointer;
  transition: border-color $dur-fast $ease-out, background $dur-fast $ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  color: var(--text-subtle);
  font-size: $fs-sm;
  min-height: 140px;
  justify-content: center;

  &:hover, &.is-dragover {
    border-color: var(--accent);
    background: rgba(108, 92, 231, 0.06);
  }

  &.has-file {
    padding: 0;
    border-style: solid;
    border-color: var(--accent);
  }
}

.p-admin__dropzone-icon { color: var(--text-subtle); }

.p-admin__dropzone-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: $radius-lg;
}

.p-admin__upload-fields {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.p-admin__upload-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.p-admin__upload-msg {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
}

.u-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
