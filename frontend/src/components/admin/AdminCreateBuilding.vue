<template>
  <article class="c-card c-bento__cell p-admin__building">
    <div class="c-card__icon"><Box :size="22" /></div>
    <p class="c-card__eyebrow">Asset Pipeline</p>
    <h2 class="c-card__title">Edifício 3D</h2>
    <p class="c-card__body">
      Suba o modelo GLB. Associe um material reutilizável criado na seção acima
      para aplicar texturas PBR na cidade do aluno.
    </p>

    <!-- ── Preview Three.js ──────────────────────────────────────────── -->
    <div class="p-admin__building-preview">
      <canvas ref="previewCanvas" class="p-admin__building-canvas" />
      <div v-if="!previewReady" class="p-admin__building-canvas-hint">
        <Box :size="28" style="opacity:.25" />
        <span>Selecione um GLB para visualizar</span>
      </div>
      <span class="p-admin__building-preview-label">Preview ao vivo</span>
      <div v-if="previewReady" class="p-admin__zoom-controls">
        <button type="button" class="p-admin__zoom-btn" title="Zoom in" @click="zoomIn">
          <ZoomIn :size="16" />
        </button>
        <button type="button" class="p-admin__zoom-btn" title="Zoom out" @click="zoomOut">
          <ZoomOut :size="16" />
        </button>
      </div>
    </div>

    <!-- ── Modelo GLB ─────────────────────────────────────────────── -->
    <div class="c-field">
      <label class="c-field__label">
        <Layers :size="14" /> Modelo GLB <span class="u-text--accent">*</span>
      </label>
      <div
        class="p-admin__drop-zone"
        :class="{ 'is-filled': form.model }"
        @click="$refs.modelInput.click()"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <Upload :size="20" />
        <span>{{ form.model ? form.model.name : 'Clique ou arraste o arquivo .glb' }}</span>
        <span v-if="form.model" class="p-admin__drop-size">
          {{ formatBytes(form.model.size) }}
        </span>
      </div>
      <input ref="modelInput" type="file" accept=".glb" hidden @change="onFileChange" />
    </div>

    <!-- ── Metadados básicos ──────────────────────────────────────── -->
    <div class="c-field">
      <label class="c-field__label">Nome *</label>
      <input v-model="form.name" class="c-field__input" placeholder="Ex: Casa Colonial" maxlength="120" />
    </div>

    <div class="p-admin__upload-row">
      <div class="c-field">
        <label class="c-field__label">Categoria *</label>
        <select v-model="form.category" class="c-field__input">
          <option value="residential">Residencial</option>
          <option value="commercial">Comercial</option>
          <option value="nature">Natureza</option>
          <option value="road">Estrada</option>
          <option value="decoration">Decoração</option>
        </select>
      </div>
      <div class="c-field">
        <label class="c-field__label">Posicionamento *</label>
        <select v-model="form.placement" class="c-field__input">
          <option value="grid">Grid</option>
          <option value="free">Livre</option>
        </select>
      </div>
    </div>

    <div class="p-admin__upload-row">
      <div class="c-field">
        <label class="c-field__label">Tamanho X (tiles)</label>
        <input v-model.number="form.sizeX" class="c-field__input" type="number" min="1" max="10" />
      </div>
      <div class="c-field">
        <label class="c-field__label">Tamanho Z (tiles)</label>
        <input v-model.number="form.sizeZ" class="c-field__input" type="number" min="1" max="10" />
      </div>
      <div class="c-field">
        <label class="c-field__label">Custo CCU</label>
        <input v-model.number="form.ccuCost" class="c-field__input" type="number" min="1" />
      </div>
    </div>

    <div v-if="suggestedSize" class="p-admin__size-hint">
      <div class="p-admin__size-hint-info">
        <Ruler :size="14" />
        <span>
          Modelo: <strong>{{ suggestedSize.dimX }}×{{ suggestedSize.dimZ }} u</strong>
          → sugestão: <strong>{{ suggestedSize.sizeX }}×{{ suggestedSize.sizeZ }} tiles</strong>
        </span>
        <span
          v-if="form.sizeX !== suggestedSize.sizeX || form.sizeZ !== suggestedSize.sizeZ"
          class="p-admin__size-mismatch"
        >
          <AlertTriangle :size="12" /> tiles atuais diferem da sugestão
        </span>
      </div>
      <button type="button" class="c-btn c-btn--ghost c-btn--sm" @click="applySuggestion">
        Aplicar sugestão
      </button>
    </div>

    <div class="p-admin__upload-row">
      <div class="c-field">
        <label class="c-field__label">Preço (moedas)</label>
        <input v-model.number="form.priceCoins" class="c-field__input" type="number" min="0" />
      </div>
      <div class="c-field p-admin__emoji-field" v-click-outside="() => emojiOpen = false">
        <label class="c-field__label">Ícone (emoji)</label>
        <button type="button" class="p-admin__emoji-trigger" @click="emojiOpen = !emojiOpen">
          <span class="p-admin__emoji-current">{{ form.icon }}</span>
          <span class="p-admin__emoji-hint">Selecionar</span>
        </button>
        <div v-if="emojiOpen" class="p-admin__emoji-popover">
          <div
            v-for="group in emojiGroups"
            :key="group.label"
            class="p-admin__emoji-group"
          >
            <span class="p-admin__emoji-group-label">{{ group.label }}</span>
            <div class="p-admin__emoji-grid">
              <button
                v-for="e in group.emojis"
                :key="e"
                type="button"
                :class="['p-admin__emoji-btn', { 'is-active': form.icon === e }]"
                @click="form.icon = e; emojiOpen = false"
              >{{ e }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Material PBR ──────────────────────────────────────────────── -->
    <div class="p-admin__building-section">
      <p class="p-admin__building-section-title"><Sparkles :size="14" /> Material PBR</p>

      <div class="c-field">
        <label class="c-field__label">Material</label>
        <select v-model="form.materialId" class="c-field__input">
          <option value="">— Sem material —</option>
          <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <span v-if="!materials.length" class="c-field__hint">
          Nenhum material disponível. Crie um na seção ao lado e clique em
          <button type="button" class="p-admin__refresh-btn" @click="loadMaterials">↺ atualizar</button>.
        </span>
        <button v-else type="button" class="p-admin__refresh-btn" @click="loadMaterials">
          ↺ atualizar lista
        </button>
      </div>

      <div class="c-field">
        <label class="c-field__label">
          Scale <span class="p-admin__val">{{ form.scaleFactor.toFixed(2) }}</span>
        </label>
        <input v-model.number="form.scaleFactor" class="p-admin__slider" type="range" min="0.1" max="5" step="0.05" />
      </div>
    </div>

    <!-- ── Ação ──────────────────────────────────────────────────── -->
    <button
      class="c-btn"
      :disabled="saving || !form.name || !form.model"
      @click="save"
    >
      <Upload :size="16" />
      <span>{{ saving ? 'Enviando…' : 'Publicar Edifício' }}</span>
    </button>

    <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'" class="p-admin__upload-msg">
      <component :is="success ? CircleCheck : CircleAlert" :size="16" />
      {{ message }}
    </p>
  </article>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Box, Layers, Upload, Sparkles,
  CircleCheck, CircleAlert, ZoomIn, ZoomOut, Ruler, AlertTriangle,
} from 'lucide-vue-next'
import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight,
  Color, MeshStandardMaterial, Box3, Vector3,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { adminCreateBuilding, adminListMaterials } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving       = ref(false)
const message      = ref('')
const success      = ref(false)
const previewReady = ref(false)
const previewCanvas = ref(null)
const emojiOpen     = ref(false)
const suggestedSize = ref(null)
const materials     = ref([])

// ─── Emoji picker ──────────────────────────────────────────────────────────

const emojiGroups = [
  { label: 'Residencial', emojis: ['🏠', '🏡', '🏘', '🏗', '🏚', '🛖', '⛺', '🏰', '🏯', '🗼'] },
  { label: 'Comercial',   emojis: ['🏢', '🏬', '🏦', '🏨', '🏪', '🏫', '🏛', '⛪', '🕌', '🕍'] },
  { label: 'Natureza',    emojis: ['🌳', '🌲', '🌴', '🌵', '🌾', '🍀', '🌻', '🌊', '⛰', '🗻'] },
  { label: 'Estrada / Infra', emojis: ['🛣', '🛤', '🌉', '🚉', '🚏', '🛫', '⛽', '🚦', '🚧', '🗺'] },
  { label: 'Decoração',   emojis: ['⛲', '🎪', '🎠', '🎡', '🎢', '🗽', '🗿', '🏟', '💎', '✨'] },
]

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutsideHandler = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutsideHandler)
  },
}

const form = reactive({
  name:        '',
  category:    'residential',
  placement:   'grid',
  sizeX:       1,
  sizeZ:       1,
  ccuCost:     10,
  priceCoins:  0,
  icon:        '🏠',
  materialId:  '',
  scaleFactor: 1.0,
  model:       null,
})

async function loadMaterials() {
  try {
    materials.value = await adminListMaterials()
  } catch (err) {
    console.warn('Erro ao carregar materiais:', err)
  }
}

defineExpose({ loadMaterials })

// ─── Preview Three.js ──────────────────────────────────────────────────────

const CELL = 1.4

let renderer, scene, previewCamera, animId, currentModel
let modelUrl    = null
let _camDist    = 5
let _zoomFactor = 1

function _updateCamPosition() {
  const d = _camDist * _zoomFactor
  previewCamera.position.set(d * 0.6, d * 0.45, d * 0.9)
  previewCamera.lookAt(0, 0, 0)
}

function zoomIn()  { _zoomFactor = Math.max(0.25, _zoomFactor - 0.15); _updateCamPosition() }
function zoomOut() { _zoomFactor = Math.min(4,    _zoomFactor + 0.15); _updateCamPosition() }

function _fitCameraToModel(model) {
  model.updateMatrixWorld(true)

  const box    = new Box3().setFromObject(model)
  const center = box.getCenter(new Vector3())
  const size   = box.getSize(new Vector3())

  model.position.x -= center.x
  model.position.y -= center.y
  model.position.z -= center.z

  const maxDim = Math.max(size.x, size.y, size.z) || 1
  _camDist    = maxDim * 1.6
  _zoomFactor = 1

  previewCamera.far = _camDist * 20
  previewCamera.updateProjectionMatrix()
  _updateCamPosition()

  suggestedSize.value = {
    sizeX: Math.max(1, Math.ceil(size.x / CELL)),
    sizeZ: Math.max(1, Math.ceil(size.z / CELL)),
    dimX:  size.x.toFixed(2),
    dimZ:  size.z.toFixed(2),
  }
}

function applySuggestion() {
  if (!suggestedSize.value) return
  form.sizeX = suggestedSize.value.sizeX
  form.sizeZ = suggestedSize.value.sizeZ
}

function initPreview() {
  const canvas = previewCanvas.value
  if (!canvas) return

  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

  scene = new Scene()
  scene.background = new Color(0x0e1124)

  previewCamera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 500)
  _updateCamPosition()

  scene.add(new AmbientLight(0xffffff, 0.6))
  const sun = new DirectionalLight(0xffffff, 1.2)
  sun.position.set(5, 8, 5)
  scene.add(sun)

  animId = requestAnimationFrame(function tick() {
    animId = requestAnimationFrame(tick)
    if (currentModel) currentModel.rotation.y += 0.005
    renderer.render(scene, previewCamera)
  })
}

function loadPreviewModel(file) {
  if (!renderer) return
  if (modelUrl) URL.revokeObjectURL(modelUrl)
  if (currentModel) { scene.remove(currentModel); currentModel = null }

  modelUrl = URL.createObjectURL(file)
  new GLTFLoader().load(modelUrl, (gltf) => {
    currentModel = gltf.scene
    currentModel.scale.setScalar(form.scaleFactor)
    currentModel.traverse(n => {
      if (n.isMesh) {
        n.material = new MeshStandardMaterial({ roughness: 0.7, metalness: 0.0, color: 0xc8bfe8 })
        n.castShadow = true
      }
    })
    scene.add(currentModel)
    _fitCameraToModel(currentModel)
    previewReady.value = true
  }, undefined, (err) => console.warn('Preview GLB load error:', err))
}

onMounted(() => { initPreview(); loadMaterials() })

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  if (modelUrl) URL.revokeObjectURL(modelUrl)
  renderer?.dispose()
})

watch(() => form.scaleFactor, (v) => {
  if (currentModel) currentModel.scale.setScalar(v)
})

// ─── Handlers de arquivo ──────────────────────────────────────────────────

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  form.model = file
  loadPreviewModel(file)
}

function onDrop(event) {
  const file = event.dataTransfer.files[0]
  if (!file) return
  form.model = file
  loadPreviewModel(file)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Envio ────────────────────────────────────────────────────────────────

async function save() {
  if (!form.name || !form.model) return
  saving.value  = true
  message.value = ''

  try {
    const fd = new FormData()
    fd.append('model', form.model)

    const item = await adminCreateBuilding(fd, {
      name:        form.name,
      category:    form.category,
      placement:   form.placement,
      sizeX:       form.sizeX,
      sizeZ:       form.sizeZ,
      ccuCost:     form.ccuCost,
      priceCoins:  form.priceCoins,
      icon:        form.icon,
      materialId:  form.materialId || undefined,
      scaleFactor: form.scaleFactor,
    })

    success.value = true
    message.value = `Edifício "${item.name}" publicado!`
    emit('created', item)

    form.name        = ''
    form.sizeX       = 1
    form.sizeZ       = 1
    form.ccuCost     = 10
    form.priceCoins  = 0
    form.materialId  = ''
    form.scaleFactor = 1.0
    form.model       = null
    previewReady.value  = false
    suggestedSize.value = null
  } catch (err) {
    success.value = false
    const msg = err.response?.data?.message
    message.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao publicar edifício.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__building {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// ── Preview ───────────────────────────────────────────────────────────────────

.p-admin__building-preview {
  position: relative;
  height: 340px;
  border-radius: $radius-lg;
  border: 1px solid var(--glass-border);
  overflow: hidden;
  background: var(--bg-base);
}

.p-admin__building-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.p-admin__building-canvas-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  font-size: $fs-sm;
  color: var(--text-subtle);
  pointer-events: none;
}

.p-admin__building-preview-label {
  position: absolute;
  top: $space-2;
  right: $space-3;
  font-size: 0.65rem;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.p-admin__zoom-controls {
  position: absolute;
  bottom: $space-3;
  right: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.p-admin__zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-md;
  border: 1px solid var(--glass-border);
  background: rgba(14, 17, 36, 0.75);
  backdrop-filter: blur(6px);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all $dur-fast;

  &:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
}

// ── Size hint ─────────────────────────────────────────────────────────────────

.p-admin__size-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  background: rgba(0, 217, 192, 0.07);
  border: 1px solid rgba(0, 217, 192, 0.25);
  font-size: $fs-sm;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.p-admin__size-hint-info {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;

  strong { color: var(--color-secondary); }
}

.p-admin__size-mismatch {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: #ffb347;
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

.p-admin__drop-zone {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  border: 1px dashed var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $fs-sm;
  color: var(--text-muted);
  transition: all $dur-fast;
  background: var(--bg-surface);

  &:hover { border-color: var(--color-primary); color: var(--text-secondary); }
  &.is-filled { border-color: var(--color-secondary); color: var(--text-primary); }
}

.p-admin__drop-size {
  margin-left: auto;
  font-size: $fs-xs;
  color: var(--text-subtle);
}

// ── Section ───────────────────────────────────────────────────────────────────

.p-admin__building-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  background: var(--bg-surface);
}

.p-admin__building-section-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

// ── Slider ────────────────────────────────────────────────────────────────────

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

// ── Refresh btn ───────────────────────────────────────────────────────────────

.p-admin__refresh-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: $fs-xs;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;

  &:hover { color: var(--color-secondary); }
}
</style>
