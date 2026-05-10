<template>
  <article class="c-card c-bento__cell p-admin__palette">
    <div class="c-card__icon"><Palette :size="22" /></div>
    <p class="c-card__eyebrow">Marketplace</p>
    <h2 class="c-card__title">Paleta de Cores</h2>
    <p class="c-card__body">
      Defina as 5 cores do design system do perfil. Cada cor tem um papel específico — botões,
      bordas, acentos. O usuário compra a paleta e o perfil inteiro muda automaticamente.
    </p>

    <!-- ── Preview mini-perfil ─────────────────────────────────────────── -->
    <div class="p-admin__palette-preview" :style="previewCssVars">
      <div class="p-admin__mock">
        <!-- Header simulado -->
        <div class="p-admin__mock-header">
          <div class="p-admin__mock-avatar" />
          <div class="p-admin__mock-info">
            <div class="p-admin__mock-name">
              <span class="p-admin__mock-username">@usuário</span>
              <span class="p-admin__mock-badge">Nível 12</span>
            </div>
            <div class="p-admin__mock-xp-bar">
              <div class="p-admin__mock-xp-fill" />
            </div>
          </div>
        </div>
        <!-- Card simulado -->
        <div class="p-admin__mock-card">
          <div class="p-admin__mock-card-title">Card de conteúdo</div>
          <div class="p-admin__mock-card-row">
            <span class="p-admin__mock-icon">✦</span>
            <span class="p-admin__mock-text">Item com ícone terciário</span>
          </div>
          <div class="p-admin__mock-buttons">
            <div class="p-admin__mock-btn-primary">Salvar</div>
            <div class="p-admin__mock-btn-ghost">Cancelar</div>
          </div>
        </div>
      </div>
      <span class="p-admin__palette-preview-label">Preview ao vivo</span>
    </div>

    <!-- ── Slots de cor ───────────────────────────────────────────────── -->
    <div class="p-admin__palette-slots">
      <div v-for="slot in colorSlots" :key="slot.key" class="p-admin__palette-slot">

        <!-- Cabeçalho do slot -->
        <div class="p-admin__slot-header">
          <div class="p-admin__slot-info">
            <span class="p-admin__slot-dot" :style="{ background: getCssValue(slot.key) }" />
            <div>
              <span class="p-admin__slot-label">{{ slot.label }}</span>
              <span class="p-admin__slot-desc">{{ slot.description }}</span>
            </div>
          </div>
          <!-- Toggle sólida / gradiente -->
          <div v-if="slot.supportsGradient" class="p-admin__slot-toggle">
            <button
              :class="['p-admin__toggle-btn', { 'is-active': !form[slot.key].isGradient }]"
              @click="setMode(slot.key, false)"
            >Sólida</button>
            <button
              :class="['p-admin__toggle-btn', { 'is-active': form[slot.key].isGradient }]"
              @click="setMode(slot.key, true)"
            >Gradiente</button>
          </div>
        </div>

        <!-- Modo sólido -->
        <div v-if="!form[slot.key].isGradient" class="p-admin__slot-solid">
          <div class="p-admin__palette-swatch" :style="{ background: form[slot.key].solid }" />
          <input
            v-model="form[slot.key].solid"
            type="color"
            class="p-admin__palette-color-input"
            :title="slot.label"
          />
          <input
            v-model="form[slot.key].solid"
            class="c-field__input p-admin__palette-hex"
            placeholder="#6C5CE7"
            maxlength="7"
            @input="normalizeHex(slot.key)"
          />
        </div>

        <!-- Modo gradiente -->
        <div v-else class="p-admin__slot-gradient">
          <!-- Preview da faixa de gradiente -->
          <div class="p-admin__gradient-bar" :style="{ background: computeGradient(slot.key) }" />

          <!-- Stops -->
          <div class="p-admin__gradient-stops">
            <div v-for="(stop, i) in form[slot.key].stops" :key="i" class="p-admin__stop-row">
              <div class="p-admin__palette-swatch" :style="{ background: stop }" />
              <input
                v-model="form[slot.key].stops[i]"
                type="color"
                class="p-admin__palette-color-input"
              />
              <input
                v-model="form[slot.key].stops[i]"
                class="c-field__input p-admin__palette-hex"
                placeholder="#6C5CE7"
                maxlength="7"
                @input="normalizeHexStop(slot.key, i)"
              />
              <button
                v-if="form[slot.key].stops.length > 2"
                class="c-btn c-btn--ghost c-btn--icon c-btn--sm"
                @click="removeStop(slot.key, i)"
              >✕</button>
            </div>
          </div>

          <!-- Controles do gradiente -->
          <div class="p-admin__gradient-controls">
            <button
              v-if="form[slot.key].stops.length < 4"
              class="c-btn c-btn--ghost c-btn--sm"
              @click="addStop(slot.key)"
            >+ Cor</button>
            <select v-model="form[slot.key].direction" class="c-field__input p-admin__dir-select">
              <option value="to right">→ Horizontal</option>
              <option value="to bottom">↓ Vertical</option>
              <option value="135deg">↘ Diagonal 135°</option>
              <option value="45deg">↗ Diagonal 45°</option>
              <option value="radial">◉ Radial</option>
            </select>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Metadados ──────────────────────────────────────────────────── -->
    <div class="c-field">
      <label class="c-field__label">Nome da paleta *</label>
      <input
        v-model="form.name"
        class="c-field__input"
        placeholder="Ex: Aurora Boreal"
        maxlength="120"
      />
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
      :disabled="saving || !form.name"
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

// ─── Estado do formulário ──────────────────────────────────────────────────────

function makeSlot(solid, stop2) {
  return {
    isGradient: false,
    solid,
    stops:     [solid, stop2 ?? solid],
    direction: '135deg',
  }
}

const form = reactive({
  name:         '',
  description:  '',
  rarity:       'common',
  priceCoins:   0,
  primary:       makeSlot('#6C5CE7', '#00D9C0'),
  primaryDark:   makeSlot('#4B3FBA'),
  secondary:     makeSlot('#00D9C0'),
  secondaryDark: makeSlot('#00A68F'),
  tertiary:      makeSlot('#FF6B9D', '#FFD166'),
})

// ─── Config dos slots ──────────────────────────────────────────────────────────

const colorSlots = [
  {
    key:              'primary',
    label:            'Cor Primária',
    description:      'Botões, barra de XP, badge de nível',
    supportsGradient: true,
  },
  {
    key:              'primaryDark',
    label:            'Cor Primária Escura',
    description:      'Hover de botões, fundos elevados',
    supportsGradient: false,
  },
  {
    key:              'secondary',
    label:            'Cor Secundária',
    description:      'Bordas dos cards e painéis',
    supportsGradient: false,
  },
  {
    key:              'secondaryDark',
    label:            'Cor Secundária Escura',
    description:      'Hover das bordas, acentos sutis',
    supportsGradient: false,
  },
  {
    key:              'tertiary',
    label:            'Cor Terciária',
    description:      'Ícones, links, chips de raridade',
    supportsGradient: true,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeGradient(key) {
  const slot  = form[key]
  const stops = slot.stops.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c))
  if (!stops.length) return slot.solid || '#6C5CE7'
  if (stops.length === 1) return stops[0]
  if (slot.direction === 'radial') return `radial-gradient(circle, ${stops.join(', ')})`
  return `linear-gradient(${slot.direction}, ${stops.join(', ')})`
}

function getCssValue(key) {
  const slot = form[key]
  if (!slot.isGradient) return slot.solid || '#6C5CE7'
  return computeGradient(key)
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(0,217,192,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── CSS vars para o preview ───────────────────────────────────────────────────

const previewCssVars = computed(() => ({
  '--mock-primary':        getCssValue('primary'),
  '--mock-primary-dark':   form.primaryDark.solid   || '#4B3FBA',
  '--mock-secondary':      form.secondary.solid      || '#00D9C0',
  '--mock-secondary-dark': form.secondaryDark.solid  || '#00A68F',
  '--mock-tertiary':       getCssValue('tertiary'),
  '--mock-border':         hexToRgba(form.secondary.solid, 0.35),
}))

// ─── Ações do formulário ──────────────────────────────────────────────────────

function setMode(key, isGradient) {
  form[key].isGradient = isGradient
}

function addStop(key) {
  if (form[key].stops.length < 4) form[key].stops.push('#FF6B9D')
}

function removeStop(key, i) {
  form[key].stops.splice(i, 1)
}

function normalizeHex(key) {
  const v = form[key].solid
  if (v && !v.startsWith('#')) form[key].solid = '#' + v
}

function normalizeHexStop(key, i) {
  const v = form[key].stops[i]
  if (v && !v.startsWith('#')) form[key].stops[i] = '#' + v
}

async function save() {
  if (!form.name) return
  saving.value  = true
  message.value = ''

  try {
    const payload = {
      name:          form.name,
      description:   form.description || undefined,
      rarity:        form.rarity,
      priceCoins:    form.priceCoins,
      primary:       getCssValue('primary'),
      primaryDark:   form.primaryDark.solid,
      secondary:     form.secondary.solid,
      secondaryDark: form.secondaryDark.solid,
      tertiary:      getCssValue('tertiary'),
    }

    const item = await adminCreatePalette(payload)
    success.value = true
    message.value = `✅ Paleta "${item.name}" adicionada ao marketplace!`
    emit('created', item)

    // Reset
    form.name        = ''
    form.description = ''
    form.rarity      = 'common'
    form.priceCoins  = 0
    form.primary       = makeSlot('#6C5CE7', '#00D9C0')
    form.primaryDark   = makeSlot('#4B3FBA')
    form.secondary     = makeSlot('#00D9C0')
    form.secondaryDark = makeSlot('#00A68F')
    form.tertiary      = makeSlot('#FF6B9D', '#FFD166')
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

// ── Preview mini-perfil ────────────────────────────────────────────────────────

.p-admin__palette-preview {
  position: relative;
  border-radius: $radius-lg;
  border: 1px solid var(--glass-border);
  padding: $space-4;
  background: var(--bg-surface);
  overflow: hidden;
}

.p-admin__palette-preview-label {
  position: absolute;
  top: $space-2;
  right: $space-3;
  font-size: 0.65rem;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.p-admin__mock {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.p-admin__mock-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-elevated);
  border-radius: $radius-md;
  border: 1px solid var(--mock-border, var(--glass-border));
}

.p-admin__mock-avatar {
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  background: var(--mock-primary, var(--color-primary));
  flex-shrink: 0;
  opacity: 0.7;
}

.p-admin__mock-info { flex: 1; display: flex; flex-direction: column; gap: $space-1; }

.p-admin__mock-name {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.p-admin__mock-username {
  font-size: $fs-sm;
  font-weight: 600;
  color: var(--text-primary);
}

.p-admin__mock-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: $radius-pill;
  background: var(--mock-primary, var(--color-primary));
  color: #fff;
}

.p-admin__mock-xp-bar {
  height: 5px;
  border-radius: $radius-pill;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}

.p-admin__mock-xp-fill {
  height: 100%;
  width: 62%;
  border-radius: $radius-pill;
  background: var(--mock-primary, var(--color-primary));
  transition: background 0.3s;
}

.p-admin__mock-card {
  background: var(--bg-elevated);
  border: 1px solid var(--mock-border, var(--glass-border));
  border-radius: $radius-md;
  padding: $space-3 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  transition: border-color 0.3s;
}

.p-admin__mock-card-title {
  font-size: $fs-xs;
  font-weight: 600;
  color: var(--text-secondary);
}

.p-admin__mock-card-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-xs;
  color: var(--text-muted);
}

.p-admin__mock-icon {
  color: var(--mock-tertiary, var(--color-accent));
  font-size: 0.8rem;
  transition: color 0.3s;
}

.p-admin__mock-text { color: var(--text-secondary); }

.p-admin__mock-buttons {
  display: flex;
  gap: $space-2;
  margin-top: $space-1;
}

.p-admin__mock-btn-primary {
  font-size: $fs-xs;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: $radius-md;
  background: var(--mock-primary, var(--color-primary));
  color: #fff;
  transition: background 0.3s;
}

.p-admin__mock-btn-ghost {
  font-size: $fs-xs;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: $radius-md;
  border: 1px solid var(--mock-secondary, var(--color-secondary));
  color: var(--mock-secondary, var(--color-secondary));
  transition: border-color 0.3s, color 0.3s;
}

// ── Slots ─────────────────────────────────────────────────────────────────────

.p-admin__palette-slots {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.p-admin__palette-slot {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  background: var(--bg-surface);
}

.p-admin__slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.p-admin__slot-info {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex: 1;
  min-width: 0;
}

.p-admin__slot-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15);
  transition: background 0.3s;
}

.p-admin__slot-label {
  font-size: $fs-sm;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.p-admin__slot-desc {
  font-size: $fs-xs;
  color: var(--text-muted);
  display: block;
}

.p-admin__slot-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-base);
  border-radius: $radius-md;
  padding: 2px;
  flex-shrink: 0;
}

.p-admin__toggle-btn {
  font-size: $fs-xs;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: calc(#{$radius-md} - 2px);
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  background: transparent;
  transition: all $dur-fast;

  &.is-active {
    background: var(--color-primary);
    color: #fff;
  }
}

// ── Controles de cor ──────────────────────────────────────────────────────────

.p-admin__slot-solid,
.p-admin__stop-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.p-admin__palette-swatch {
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  border: 1px solid rgba(255,255,255,0.12);
  flex-shrink: 0;
  transition: background 0.2s;
}

.p-admin__palette-color-input {
  width: 36px;
  height: 28px;
  border-radius: $radius-sm;
  border: 1px solid var(--border-subtle);
  padding: 2px;
  background: var(--bg-base);
  cursor: pointer;
  flex-shrink: 0;
}

.p-admin__palette-hex {
  flex: 1;
  min-width: 0;
  font-family: monospace;
  font-size: $fs-sm;
}

// ── Gradiente ─────────────────────────────────────────────────────────────────

.p-admin__slot-gradient {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.p-admin__gradient-bar {
  height: 12px;
  border-radius: $radius-pill;
  transition: background 0.3s;
}

.p-admin__gradient-stops {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.p-admin__gradient-controls {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.p-admin__dir-select {
  flex: 1;
  font-size: $fs-sm;
}
</style>
