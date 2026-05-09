<template>
  <article class="c-card c-bento__cell p-admin__palette">
    <div class="c-card__icon"><Palette :size="22" /></div>
    <p class="c-card__eyebrow">Marketplace</p>
    <h2 class="c-card__title">Paleta de Cores</h2>
    <p class="c-card__body">
      Crie um wallpaper de cor sólida ou gradiente. Ele será vendido no marketplace.
    </p>

    <!-- Preview ao vivo -->
    <div class="p-admin__palette-preview" :style="previewStyle">
      <span v-if="!hasColors" class="p-admin__palette-placeholder">Preview</span>
    </div>

    <!-- Cores -->
    <div class="p-admin__palette-colors">
      <div v-for="(color, i) in form.colors" :key="i" class="p-admin__palette-color-row">
        <div class="p-admin__palette-swatch" :style="{ background: color }" />
        <input
          v-model="form.colors[i]"
          type="color"
          class="p-admin__palette-color-input"
          :title="`Cor ${i + 1}`"
        />
        <input
          v-model="form.colors[i]"
          class="c-field__input p-admin__palette-hex"
          placeholder="#6C5CE7"
          maxlength="7"
          @input="normalizeHex(i)"
        />
        <button
          v-if="form.colors.length > 1"
          class="c-btn c-btn--ghost c-btn--icon c-btn--sm"
          @click="removeColor(i)"
          title="Remover cor"
        >✕</button>
      </div>

      <button
        v-if="form.colors.length < 4"
        class="c-btn c-btn--ghost c-btn--sm"
        @click="addColor"
      >
        + Adicionar cor
      </button>
    </div>

    <!-- Tipo e direção -->
    <div class="p-admin__upload-row">
      <div class="c-field">
        <label class="c-field__label">Tipo</label>
        <select v-model="form.direction" class="c-field__input" :disabled="form.colors.length === 1">
          <option v-if="form.colors.length === 1" value="solid">Cor sólida</option>
          <option value="to right">→ Horizontal</option>
          <option value="to bottom">↓ Vertical</option>
          <option value="135deg">↘ Diagonal 135°</option>
          <option value="45deg">↗ Diagonal 45°</option>
          <option value="radial">◉ Radial</option>
        </select>
      </div>
    </div>

    <!-- Metadados -->
    <div class="c-field">
      <label class="c-field__label">Nome do item *</label>
      <input v-model="form.name" class="c-field__input" placeholder="Ex: Pôr do Sol Épico" maxlength="120" />
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

    <button
      class="c-btn"
      :disabled="saving || !form.name || !hasColors"
      @click="save"
    >
      <Sparkles :size="16" />
      <span>{{ saving ? 'Salvando…' : 'Adicionar ao Marketplace' }}</span>
    </button>

    <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'" class="p-admin__upload-msg">
      <component :is="success ? CircleCheck : CircleAlert" :size="16" />
      {{ message }}
    </p>
  </article>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Palette, Sparkles, CircleCheck, CircleAlert } from 'lucide-vue-next'
import { adminCreatePalette } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving  = ref(false)
const message = ref('')
const success = ref(false)

const form = reactive({
  name:       '',
  description:'',
  rarity:     'common',
  priceCoins: 0,
  colors:     ['#6C5CE7', '#00D9C0'],
  direction:  '135deg',
})

const hasColors = computed(() => form.colors.some(c => /^#[0-9A-Fa-f]{6}$/.test(c)))

const previewStyle = computed(() => {
  const valid = form.colors.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c))
  if (!valid.length) return {}
  if (valid.length === 1) return { background: valid[0] }
  if (form.direction === 'radial') return { background: `radial-gradient(circle, ${valid.join(', ')})` }
  return { background: `linear-gradient(${form.direction}, ${valid.join(', ')})` }
})

function addColor() {
  if (form.colors.length < 4) form.colors.push('#FF6B9D')
}

function removeColor(i) {
  form.colors.splice(i, 1)
}

function normalizeHex(i) {
  const v = form.colors[i]
  if (v && !v.startsWith('#')) form.colors[i] = '#' + v
}

async function save() {
  if (!form.name || !hasColors.value) return
  saving.value  = true
  message.value = ''

  try {
    const item = await adminCreatePalette({
      name:        form.name,
      description: form.description || undefined,
      rarity:      form.rarity,
      priceCoins:  form.priceCoins,
      colors:      form.colors.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c)),
      direction:   form.colors.length === 1 ? undefined : form.direction,
    })
    success.value = true
    message.value = `✅ "${item.name}" adicionado ao marketplace!`
    emit('created', item)
    form.name        = ''
    form.description = ''
    form.rarity      = 'common'
    form.priceCoins  = 0
    form.colors      = ['#6C5CE7', '#00D9C0']
    form.direction   = '135deg'
  } catch (err) {
    success.value = false
    message.value = err.response?.data?.message || 'Erro ao criar paleta.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__palette {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.p-admin__palette-preview {
  height: 100px;
  border-radius: $radius-lg;
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background $dur-base $ease-out;
}

.p-admin__palette-placeholder {
  color: var(--text-subtle);
  font-size: $fs-sm;
}

.p-admin__palette-colors {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.p-admin__palette-color-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.p-admin__palette-swatch {
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  border: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.p-admin__palette-color-input {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--glass-border);
  border-radius: $radius-sm;
  cursor: pointer;
  background: none;
}

.p-admin__palette-hex {
  flex: 1;
  min-width: 0;
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
</style>
