<template>
  <article class="c-card p-admin__mat">
    <div class="c-card__icon"><Palette :size="22" /></div>
    <p class="c-card__eyebrow">Asset Pipeline</p>
    <h2 class="c-card__title">Novo Material PBR</h2>
    <p class="c-card__body">
      Crie um material reutilizável. Um mesmo material pode ser atribuído a vários
      edifícios — todos passam a usar o mesmo draw call (batching).
    </p>

    <div class="c-field">
      <label class="c-field__label">Nome do material *</label>
      <input v-model="form.name" class="c-field__input" placeholder="Ex: Tijolo Vermelho" maxlength="120" />
    </div>

    <!-- ── Sliders PBR ──────────────────────────────────────────── -->
    <div class="p-admin__mat-pbr">
      <div class="c-field">
        <label class="c-field__label">
          Roughness <span class="p-admin__val">{{ form.roughness.toFixed(2) }}</span>
        </label>
        <input v-model.number="form.roughness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
      </div>
      <div class="c-field">
        <label class="c-field__label">
          Metalness <span class="p-admin__val">{{ form.metalness.toFixed(2) }}</span>
        </label>
        <input v-model.number="form.metalness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
      </div>
    </div>

    <!-- ── Slots de textura ──────────────────────────────────────── -->
    <div class="p-admin__mat-slots">
      <div v-for="slot in texSlots" :key="slot.key" class="p-admin__mat-slot">
        <div
          class="p-admin__mat-drop"
          :class="{ 'is-filled': textures[slot.key] }"
          @click="$refs[`mref_${slot.key}`][0].click()"
          @dragover.prevent
          @drop.prevent="onDrop($event, slot.key)"
        >
          <component :is="textures[slot.key] ? CheckCircle : ImageIcon" :size="16" />
          <span class="p-admin__mat-drop-name">
            {{ textures[slot.key] ? textures[slot.key].name : slot.label }}
          </span>
        </div>
        <input
          :ref="`mref_${slot.key}`"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          @change="onFileChange($event, slot.key)"
        />
        <span class="p-admin__mat-desc">{{ slot.description }}</span>
      </div>
    </div>

    <button class="c-btn" :disabled="saving || !form.name" @click="save">
      <Sparkles :size="16" />
      <span>{{ saving ? 'Salvando…' : 'Criar Material' }}</span>
    </button>

    <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'" class="p-admin__upload-msg">
      <component :is="success ? CircleCheck : CircleAlert" :size="16" />
      {{ message }}
    </p>
  </article>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  Palette, Sparkles, ImageIcon, CheckCircle, CircleCheck, CircleAlert,
} from 'lucide-vue-next'
import { adminCreateMaterial } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving  = ref(false)
const message = ref('')
const success = ref(false)

const form = reactive({ name: '', roughness: 0.7, metalness: 0.0 })

const textures = reactive({
  texAlbedo:              null,
  texNormal:              null,
  texRoughnessMetalness:  null,
  texAo:                  null,
  texEmissive:            null,
})

const texSlots = [
  { key: 'texAlbedo',             label: 'Base Color',          description: 'Cor principal (albedo)' },
  { key: 'texNormal',             label: 'Normal Map',           description: 'Profundidade e detalhes' },
  { key: 'texRoughnessMetalness', label: 'Roughness/Metalness',  description: 'Canal G=rugosidade, B=metal' },
  { key: 'texAo',                 label: 'Ambient Occlusion',    description: 'Sombras de contato' },
  { key: 'texEmissive',           label: 'Emissive Map',         description: 'Áreas que emitem luz própria' },
]

function onFileChange(event, key) {
  textures[key] = event.target.files[0] ?? null
}

function onDrop(event, key) {
  textures[key] = event.dataTransfer.files[0] ?? null
}

async function save() {
  if (!form.name) return
  saving.value  = true
  message.value = ''

  try {
    const fd = new FormData()
    for (const [key, file] of Object.entries(textures)) {
      if (file) fd.append(key, file)
    }
    const material = await adminCreateMaterial(fd, {
      name:      form.name,
      roughness: form.roughness,
      metalness: form.metalness,
    })
    success.value = true
    message.value = `Material "${material.name}" criado!`
    emit('created', material)

    form.name      = ''
    form.roughness = 0.7
    form.metalness = 0.0
    Object.keys(textures).forEach(k => (textures[k] = null))
  } catch (err) {
    success.value = false
    const msg = err.response?.data?.message
    message.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao criar material.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__mat {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.p-admin__mat-pbr {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.p-admin__slider {
  width: 100%;
  accent-color: var(--color-primary);
  cursor: pointer;
  margin-top: $space-1;
}

.p-admin__val {
  font-size: $fs-xs;
  font-family: monospace;
  color: var(--color-accent);
  margin-left: $space-1;
}

.p-admin__mat-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;
}

.p-admin__mat-slot {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.p-admin__mat-drop {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border: 1px dashed var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $fs-xs;
  color: var(--text-muted);
  min-height: 44px;
  transition: all $dur-fast;
  background: var(--bg-base);

  &:hover { border-color: var(--color-primary); color: var(--text-secondary); }
  &.is-filled { border-color: var(--color-secondary); color: var(--text-primary); background: var(--bg-surface); }
}

.p-admin__mat-drop-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.p-admin__mat-desc {
  font-size: 0.62rem;
  color: var(--text-subtle);
  line-height: 1.3;
}
</style>
