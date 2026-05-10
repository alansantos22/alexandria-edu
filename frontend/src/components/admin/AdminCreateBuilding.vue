<template>
  <article class="c-card c-bento__cell p-admin__building">
    <div class="c-card__icon"><Box :size="22" /></div>
    <p class="c-card__eyebrow">Asset Pipeline</p>
    <h2 class="c-card__title">Edifício 3D</h2>
    <p class="c-card__body">
      Suba o modelo GLB e as texturas PBR separadamente. O sistema associa tudo
      e carrega na cidade do aluno com materiais corretos.
    </p>

    <!-- ── Preview Three.js ──────────────────────────────────────────── -->
    <div class="p-admin__building-preview">
      <canvas ref="previewCanvas" class="p-admin__building-canvas" />
      <div v-if="!previewReady" class="p-admin__building-canvas-hint">
        <Box :size="28" style="opacity:.25" />
        <span>Selecione um GLB para visualizar</span>
      </div>
      <span class="p-admin__building-preview-label">Preview ao vivo</span>
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
        @drop.prevent="onDrop($event, 'model')"
      >
        <Upload :size="20" />
        <span>{{ form.model ? form.model.name : 'Clique ou arraste o arquivo .glb' }}</span>
        <span v-if="form.model" class="p-admin__drop-size">
          {{ formatBytes(form.model.size) }}
        </span>
      </div>
      <input ref="modelInput" type="file" accept=".glb" hidden @change="onFileChange($event, 'model')" />
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

    <div class="p-admin__upload-row">
      <div class="c-field">
        <label class="c-field__label">Preço (moedas)</label>
        <input v-model.number="form.priceCoins" class="c-field__input" type="number" min="0" />
      </div>
      <div class="c-field">
        <label class="c-field__label">Ícone (emoji)</label>
        <input v-model="form.icon" class="c-field__input" placeholder="🏠" maxlength="10" />
      </div>
    </div>

    <!-- ── Material PBR ──────────────────────────────────────────── -->
    <div class="p-admin__building-section">
      <p class="p-admin__building-section-title"><Sparkles :size="14" /> Material PBR</p>

      <div class="p-admin__upload-row">
        <div class="c-field">
          <label class="c-field__label">Roughness <span class="p-admin__val">{{ form.roughness.toFixed(2) }}</span></label>
          <input v-model.number="form.roughness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
        </div>
        <div class="c-field">
          <label class="c-field__label">Metalness <span class="p-admin__val">{{ form.metalness.toFixed(2) }}</span></label>
          <input v-model.number="form.metalness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
        </div>
        <div class="c-field">
          <label class="c-field__label">Scale <span class="p-admin__val">{{ form.scaleFactor.toFixed(2) }}</span></label>
          <input v-model.number="form.scaleFactor" class="p-admin__slider" type="range" min="0.1" max="5" step="0.05" />
        </div>
      </div>
    </div>

    <!-- ── Slots de textura ──────────────────────────────────────── -->
    <div class="p-admin__building-section">
      <p class="p-admin__building-section-title"><ImageIcon :size="14" /> Mapas de Textura (PBR)</p>
      <div class="p-admin__tex-slots">
        <div v-for="slot in texSlots" :key="slot.key" class="p-admin__tex-slot">
          <div
            class="p-admin__tex-drop"
            :class="{ 'is-filled': form.textures[slot.key] }"
            @click="$refs[`tex_${slot.key}`][0].click()"
            @dragover.prevent
            @drop.prevent="onDrop($event, slot.key, true)"
          >
            <component :is="form.textures[slot.key] ? CheckCircle : ImageIcon" :size="18" />
            <span>{{ form.textures[slot.key] ? form.textures[slot.key].name : slot.label }}</span>
          </div>
          <input
            :ref="`tex_${slot.key}`"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            @change="onFileChange($event, slot.key, true)"
          />
          <span class="p-admin__tex-desc">{{ slot.description }}</span>
        </div>
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
  Box, Layers, Upload, Sparkles, ImageIcon, CheckCircle,
  CircleCheck, CircleAlert,
} from 'lucide-vue-next'
import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight,
  Color, MeshStandardMaterial, TextureLoader,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { adminCreateBuilding } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving      = ref(false)
const message     = ref('')
const success     = ref(false)
const previewReady = ref(false)
const previewCanvas = ref(null)

const form = reactive({
  name:        '',
  category:    'residential',
  placement:   'grid',
  sizeX:       1,
  sizeZ:       1,
  ccuCost:     10,
  priceCoins:  0,
  icon:        '🏠',
  roughness:   0.7,
  metalness:   0.0,
  scaleFactor: 1.0,
  model:       null,
  textures: {
    texAlbedo:              null,
    texNormal:              null,
    texRoughnessMetalness:  null,
    texAo:                  null,
  },
})

const texSlots = [
  { key: 'texAlbedo',             label: 'Base Color',         description: 'Cor principal (albedo)' },
  { key: 'texNormal',             label: 'Normal Map',          description: 'Profundidade e detalhes' },
  { key: 'texRoughnessMetalness', label: 'Roughness/Metalness', description: 'Canal G=rugosidade, B=metal' },
  { key: 'texAo',                 label: 'Ambient Occlusion',   description: 'Sombras de contato' },
]

// ─── Preview Three.js ──────────────────────────────────────────────────────

let renderer, scene, previewCamera, animId, currentModel
let modelUrl = null

function initPreview() {
  const canvas = previewCanvas.value
  if (!canvas) return

  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

  scene = new Scene()
  scene.background = new Color(0x0e1124)

  previewCamera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
  previewCamera.position.set(3, 2, 4)
  previewCamera.lookAt(0, 0, 0)

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
  const loader = new GLTFLoader()
  loader.load(modelUrl, (gltf) => {
    currentModel = gltf.scene
    currentModel.scale.setScalar(form.scaleFactor)

    // Center model
    const box = new (class extends Object {})()
    currentModel.traverse(n => {
      if (n.isMesh) {
        n.material = new MeshStandardMaterial({
          roughness: form.roughness,
          metalness: form.metalness,
          color: 0xc8bfe8,
        })
        n.castShadow = true
      }
    })

    scene.add(currentModel)
    previewReady.value = true
  }, undefined, (err) => {
    console.warn('Preview GLB load error:', err)
  })
}

function applyPreviewTexture(slot, file) {
  if (!currentModel) return
  const objUrl  = URL.createObjectURL(file)
  const texture = new TextureLoader().load(objUrl)
  currentModel.traverse(n => {
    if (!n.isMesh) return
    if (slot === 'texAlbedo')             { n.material.map          = texture }
    if (slot === 'texNormal')             { n.material.normalMap    = texture }
    if (slot === 'texRoughnessMetalness') { n.material.roughnessMap = texture; n.material.metalnessMap = texture }
    if (slot === 'texAo')                 { n.material.aoMap        = texture }
    n.material.needsUpdate = true
  })
}

onMounted(initPreview)

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  if (modelUrl) URL.revokeObjectURL(modelUrl)
  renderer?.dispose()
})

watch(() => form.scaleFactor, (v) => {
  if (currentModel) currentModel.scale.setScalar(v)
})

// ─── Handlers de arquivo ──────────────────────────────────────────────────

function onFileChange(event, key, isTexture = false) {
  const file = event.target.files[0]
  if (!file) return
  if (isTexture) {
    form.textures[key] = file
    applyPreviewTexture(key, file)
  } else {
    form.model = file
    loadPreviewModel(file)
  }
}

function onDrop(event, key, isTexture = false) {
  const file = event.dataTransfer.files[0]
  if (!file) return
  if (isTexture) {
    form.textures[key] = file
    applyPreviewTexture(key, file)
  } else {
    form.model = file
    loadPreviewModel(file)
  }
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
    if (form.textures.texAlbedo)             fd.append('texAlbedo',             form.textures.texAlbedo)
    if (form.textures.texNormal)             fd.append('texNormal',             form.textures.texNormal)
    if (form.textures.texRoughnessMetalness) fd.append('texRoughnessMetalness', form.textures.texRoughnessMetalness)
    if (form.textures.texAo)                 fd.append('texAo',                 form.textures.texAo)

    const params = {
      name:        form.name,
      category:    form.category,
      placement:   form.placement,
      sizeX:       form.sizeX,
      sizeZ:       form.sizeZ,
      ccuCost:     form.ccuCost,
      priceCoins:  form.priceCoins,
      icon:        form.icon,
      roughness:   form.roughness,
      metalness:   form.metalness,
      scaleFactor: form.scaleFactor,
    }

    const item = await adminCreateBuilding(fd, params)
    success.value = true
    message.value = `Edifício "${item.name}" publicado!`
    emit('created', item)

    // Reset
    form.name        = ''
    form.sizeX       = 1
    form.sizeZ       = 1
    form.ccuCost     = 10
    form.priceCoins  = 0
    form.roughness   = 0.7
    form.metalness   = 0.0
    form.scaleFactor = 1.0
    form.model       = null
    form.textures.texAlbedo             = null
    form.textures.texNormal             = null
    form.textures.texRoughnessMetalness = null
    form.textures.texAo                 = null
    previewReady.value = false
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
  height: 200px;
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

// ── Drop zones ────────────────────────────────────────────────────────────────

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

// ── Seções ────────────────────────────────────────────────────────────────────

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

// ── Sliders ───────────────────────────────────────────────────────────────────

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

// ── Texture slots ─────────────────────────────────────────────────────────────

.p-admin__tex-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;
}

.p-admin__tex-slot {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.p-admin__tex-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding: $space-3;
  border: 1px dashed var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $fs-xs;
  color: var(--text-muted);
  text-align: center;
  min-height: 72px;
  transition: all $dur-fast;
  background: var(--bg-base);
  word-break: break-all;

  &:hover { border-color: var(--color-primary); color: var(--text-secondary); }
  &.is-filled { border-color: var(--color-secondary); color: var(--text-primary); background: var(--bg-surface); }
}

.p-admin__tex-desc {
  font-size: 0.62rem;
  color: var(--text-subtle);
  text-align: center;
  line-height: 1.3;
}
</style>
