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
      <span class="p-admin__building-preview-label">
      Preview ao vivo
      <span v-if="materialLoading" class="p-admin__mat-loading">· aplicando material…</span>
    </span>
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
          <option value="monuments">Monumentos</option>
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
        <div class="p-admin__mat-row">
          <select v-model="form.materialId" class="c-field__input">
            <option value="">— Sem material —</option>
            <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <button
            v-if="form.materialId"
            type="button"
            class="p-admin__edit-mat-btn"
            :class="{ 'is-active': editingMaterial }"
            :title="editingMaterial ? 'Fechar editor' : 'Editar material'"
            @click="editingMaterial ? closeMaterialEditor() : openMaterialEditor()"
          >
            <component :is="editingMaterial ? X : Pencil" :size="15" />
          </button>
        </div>
        <span v-if="!materials.length" class="c-field__hint">
          Nenhum material disponível. Crie um na seção ao lado e clique em
          <button type="button" class="p-admin__refresh-btn" @click="loadMaterials">↺ atualizar</button>.
        </span>
        <button v-else type="button" class="p-admin__refresh-btn" @click="loadMaterials">
          ↺ atualizar lista
        </button>
      </div>

      <!-- Editor inline do material selecionado -->
      <transition name="mat-editor">
        <div v-if="editingMaterial && form.materialId" class="p-admin__mat-editor">
          <p class="p-admin__mat-editor-title">Editar: {{ materials.find(m => m.id === form.materialId)?.name }}</p>

          <!-- Sliders -->
          <div class="p-admin__mat-pbr-row">
            <div class="c-field">
              <label class="c-field__label">Roughness <span class="p-admin__val">{{ matEdit.roughness.toFixed(2) }}</span></label>
              <input v-model.number="matEdit.roughness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
            </div>
            <div class="c-field">
              <label class="c-field__label">Metalness <span class="p-admin__val">{{ matEdit.metalness.toFixed(2) }}</span></label>
              <input v-model.number="matEdit.metalness" class="p-admin__slider" type="range" min="0" max="1" step="0.01" />
            </div>
          </div>

          <!-- Color space -->
          <div class="c-field">
            <label class="c-field__label">Espaço de cor do Albedo</label>
            <div class="p-admin__radio-row">
              <label class="p-admin__radio-chip" :class="{ 'is-active': matEdit.albedoColorSpace === 'srgb' }">
                <input v-model="matEdit.albedoColorSpace" type="radio" value="srgb" hidden />
                sRGB <small>(PolyPerfect, Kenney)</small>
              </label>
              <label class="p-admin__radio-chip" :class="{ 'is-active': matEdit.albedoColorSpace === 'linear' }">
                <input v-model="matEdit.albedoColorSpace" type="radio" value="linear" hidden />
                Linear <small>(Unity HDRP)</small>
              </label>
            </div>
          </div>

          <!-- flipY -->
          <div class="c-field">
            <label class="p-admin__toggle-row">
              <input v-model="matEdit.flipY" type="checkbox" hidden />
              <span class="p-admin__track" :class="{ 'is-on': matEdit.flipY }" />
              <span class="p-admin__toggle-label">
                <strong>Inverter UV vertical (flipY)</strong>
                <small>OFF = GLB/GLTF · ON = OBJ/FBX legado</small>
              </span>
            </label>
          </div>

          <!-- Texturas (substituição opcional) -->
          <p class="p-admin__mat-tex-label">Substituir texturas (opcional)</p>
          <div class="p-admin__mat-slots">
            <div v-for="slot in matTexSlots" :key="slot.key" class="p-admin__mat-slot">
              <div
                class="p-admin__mat-drop"
                :class="{ 'is-filled': matEditTextures[slot.key] }"
                @click="$refs[`eref_${slot.key}`][0].click()"
                @dragover.prevent
                @drop.prevent="e => matEditTextures[slot.key] = e.dataTransfer.files[0] ?? null"
              >
                <span class="p-admin__mat-drop-name">{{ matEditTextures[slot.key] ? matEditTextures[slot.key].name : slot.label }}</span>
              </div>
              <input :ref="`eref_${slot.key}`" type="file" accept="image/*" hidden @change="e => matEditTextures[slot.key] = e.target.files[0] ?? null" />
              <span class="p-admin__mat-desc">{{ slot.description }}</span>
            </div>
          </div>

          <div class="p-admin__mat-editor-actions">
            <button class="c-btn c-btn--sm" :disabled="savingMaterial" @click="saveMaterialEdits">
              {{ savingMaterial ? 'Salvando…' : 'Salvar alterações' }}
            </button>
            <p v-if="materialSaveMsg" :class="materialSaveOk ? 'c-field__success' : 'c-field__error'" class="p-admin__mat-save-msg">
              {{ materialSaveMsg }}
            </p>
          </div>
        </div>
      </transition>

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
  Box, Layers, Upload, Sparkles, Pencil, X,
  CircleCheck, CircleAlert, ZoomIn, ZoomOut, Ruler, AlertTriangle,
} from 'lucide-vue-next'
import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight,
  Color, MeshStandardMaterial, Box3, Vector3, TextureLoader, SRGBColorSpace,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { adminCreateBuilding, adminListMaterials, adminUpdateMaterial } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving          = ref(false)
const message         = ref('')
const success         = ref(false)
const previewReady    = ref(false)
const previewCanvas   = ref(null)
const emojiOpen       = ref(false)
const suggestedSize   = ref(null)
const materials       = ref([])
const materialLoading = ref(false)

// ─── Inline material editor ───────────────────────────────────────────────
const editingMaterial    = ref(false)
const savingMaterial     = ref(false)
const materialSaveMsg    = ref('')
const materialSaveOk     = ref(false)
const matEditTextures    = reactive({ texAlbedo: null, texNormal: null, texRoughnessMetalness: null, texAo: null, texEmissive: null })
const matEdit = reactive({ roughness: 0.7, metalness: 0.0, albedoColorSpace: 'srgb', flipY: false })

const matTexSlots = [
  { key: 'texAlbedo',             label: 'Base Color',         description: 'Substituir albedo' },
  { key: 'texNormal',             label: 'Normal Map',          description: 'Substituir normal' },
  { key: 'texRoughnessMetalness', label: 'Roughness/Metalness', description: 'Substituir RM' },
  { key: 'texAo',                 label: 'Ambient Occlusion',   description: 'Substituir AO' },
  { key: 'texEmissive',           label: 'Emissive',            description: 'Substituir emissive' },
]

function openMaterialEditor() {
  const mat = materials.value.find(m => m.id === form.materialId)
  if (!mat) return
  matEdit.roughness        = mat.roughness ?? 0.7
  matEdit.metalness        = mat.metalness ?? 0.0
  matEdit.albedoColorSpace = mat.albedoColorSpace ?? 'srgb'
  matEdit.flipY            = mat.flipY ?? false
  Object.keys(matEditTextures).forEach(k => (matEditTextures[k] = null))
  materialSaveMsg.value = ''
  editingMaterial.value = true
}

function closeMaterialEditor() {
  editingMaterial.value = false
}

async function saveMaterialEdits() {
  const mat = materials.value.find(m => m.id === form.materialId)
  if (!mat) return
  savingMaterial.value  = true
  materialSaveMsg.value = ''
  try {
    const fd = new FormData()
    for (const [key, file] of Object.entries(matEditTextures)) {
      if (file) fd.append(key, file)
    }
    const updated = await adminUpdateMaterial(mat.id, fd, {
      roughness:        matEdit.roughness,
      metalness:        matEdit.metalness,
      albedoColorSpace: matEdit.albedoColorSpace,
      flipY:            matEdit.flipY,
    })
    // Atualiza lista local
    const idx = materials.value.findIndex(m => m.id === updated.id)
    if (idx !== -1) materials.value[idx] = updated
    materialSaveOk.value  = true
    materialSaveMsg.value = 'Material salvo!'
    // Re-aplica no preview
    applyMaterialToPreview(updated)
  } catch (err) {
    materialSaveOk.value  = false
    materialSaveMsg.value = err.response?.data?.message || 'Erro ao salvar material.'
  } finally {
    savingMaterial.value = false
  }
}

// ─── Emoji picker ──────────────────────────────────────────────────────────

const emojiGroups = [
  { label: 'Residencial', emojis: ['🏠', '🏡', '🏘', '🏗', '🏚', '🛖', '⛺', '🏰', '🏯', '🗼'] },
  { label: 'Comercial',   emojis: ['🏢', '🏬', '🏦', '🏨', '🏪', '🏫', '🏛', '⛪', '🕌', '🕍'] },
  { label: 'Natureza',    emojis: ['🌳', '🌲', '🌴', '🌵', '🌾', '🍀', '🌻', '🌊', '⛰', '🗻'] },
  { label: 'Estrada / Infra', emojis: ['🛣', '🛤', '🌉', '🚉', '🚏', '🛫', '⛽', '🚦', '🚧', '🗺'] },
  { label: 'Decoração',   emojis: ['⛲', '🎪', '🎠', '🎡', '🎢', '🗽', '🗿', '🏟', '💎', '✨'] },
  { label: 'Monumentos',  emojis: ['🗿', '🕯', '🏛', '⛩', '🕌', '⛪', '🏰', '🗼', '🗽', '📿'] },
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

const DEFAULT_MAT = () => new MeshStandardMaterial({ roughness: 0.7, metalness: 0.0, color: 0xc8bfe8 })

const texLoader = new TextureLoader()

function _loadTex(url, flipY = false) {
  if (!url) return null
  const t = texLoader.load(url)
  t.flipY = flipY
  return t
}

function _loadColorTex(url, flipY = false) {
  const t = _loadTex(url, flipY)
  if (t) t.colorSpace = SRGBColorSpace
  return t
}

async function applyMaterialToPreview(mat) {
  if (!currentModel) return
  materialLoading.value = true

  const isLinear = mat?.albedoColorSpace === 'linear'
  const flipY    = mat?.flipY ?? false

  let pbr
  if (!mat) {
    pbr = DEFAULT_MAT()
  } else {
    pbr = new MeshStandardMaterial({
      roughness: mat.roughness ?? 0.7,
      metalness: mat.metalness ?? 0.0,
    })
    if (mat.textureAlbedo)             pbr.map                   = isLinear ? _loadTex(mat.textureAlbedo, flipY) : _loadColorTex(mat.textureAlbedo, flipY)
    if (mat.textureNormal)             pbr.normalMap              = _loadTex(mat.textureNormal, flipY)
    if (mat.textureRoughnessMetalness) pbr.roughnessMetalnessMap  = _loadTex(mat.textureRoughnessMetalness, flipY)
    if (mat.textureAo)                 pbr.aoMap                  = _loadTex(mat.textureAo, flipY)
    if (mat.textureEmissive)           { pbr.emissiveMap = _loadColorTex(mat.textureEmissive, flipY); pbr.emissive.set(0xffffff) }
  }

  currentModel.traverse(n => {
    if (n.isMesh) {
      n.material = pbr
      n.material.needsUpdate = true
    }
  })

  materialLoading.value = false
}

function loadPreviewModel(file) {
  if (!renderer) return
  if (modelUrl) URL.revokeObjectURL(modelUrl)
  if (currentModel) { scene.remove(currentModel); currentModel = null }

  modelUrl = URL.createObjectURL(file)
  new GLTFLoader().load(modelUrl, (gltf) => {
    currentModel = gltf.scene
    currentModel.scale.setScalar(form.scaleFactor)

    const selectedMat = materials.value.find(m => m.id === form.materialId) ?? null
    const baseMat = selectedMat
      ? new MeshStandardMaterial({ roughness: selectedMat.roughness ?? 0.7, metalness: selectedMat.metalness ?? 0.0 })
      : DEFAULT_MAT()

    currentModel.traverse(n => {
      if (n.isMesh) { n.material = baseMat; n.castShadow = true }
    })

    scene.add(currentModel)
    _fitCameraToModel(currentModel)
    previewReady.value = true

    // apply full textures after model is in scene
    applyMaterialToPreview(selectedMat)
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

watch(() => form.materialId, (id) => {
  editingMaterial.value = false
  const mat = materials.value.find(m => m.id === id) ?? null
  applyMaterialToPreview(mat)
})

// live preview enquanto edita o material
watch(
  () => [matEdit.roughness, matEdit.metalness, matEdit.albedoColorSpace, matEdit.flipY],
  () => {
    const mat = materials.value.find(m => m.id === form.materialId)
    if (!mat || !editingMaterial.value) return
    // mescla os valores editados temporariamente para preview
    applyMaterialToPreview({ ...mat, ...matEdit })
  },
)

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

.p-admin__mat-loading {
  color: var(--accent);
  opacity: 0.8;
  animation: mat-blink 1s ease-in-out infinite alternate;
}

@keyframes mat-blink {
  from { opacity: 0.4 }
  to   { opacity: 1 }
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

// ── Material editor inline ────────────────────────────────────────────────────

.p-admin__mat-row {
  display: flex;
  gap: $space-2;
  align-items: center;

  .c-field__input { flex: 1; }
}

.p-admin__edit-mat-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all $dur-fast;

  &:hover  { border-color: var(--color-primary); color: var(--color-primary); }
  &.is-active { border-color: var(--color-accent); color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
}

.p-admin__mat-editor {
  border: 1px solid var(--glass-border);
  border-radius: $radius-md;
  padding: $space-3;
  background: color-mix(in srgb, var(--bg-surface) 60%, transparent);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.p-admin__mat-editor-title {
  font-size: $fs-sm;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.p-admin__mat-pbr-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.p-admin__radio-row {
  display: flex;
  gap: $space-2;
  margin-top: $space-1;
  flex-wrap: wrap;
}

.p-admin__radio-chip {
  padding: $space-1 $space-3;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: $fs-xs;
  cursor: pointer;
  transition: all $dur-fast;
  color: var(--text-muted);

  small { opacity: 0.7; margin-left: 4px; }

  &.is-active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
  }
}

.p-admin__toggle-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  cursor: pointer;
}

.p-admin__track {
  width: 38px;
  height: 20px;
  border-radius: 999px;
  background: var(--border-subtle);
  flex-shrink: 0;
  position: relative;
  transition: background $dur-fast;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    transition: transform $dur-fast;
  }

  &.is-on {
    background: var(--color-primary);
    &::after { transform: translateX(18px); }
  }
}

.p-admin__toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong { font-size: $fs-sm; color: var(--text-primary); }
  small  { font-size: 0.65rem; color: var(--text-subtle); }
}

.p-admin__mat-tex-label {
  font-size: $fs-xs;
  color: var(--text-subtle);
  margin: 0;
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
  padding: $space-2 $space-2;
  border: 1px dashed var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $fs-xs;
  color: var(--text-muted);
  min-height: 36px;
  transition: all $dur-fast;
  background: var(--bg-base);

  &:hover   { border-color: var(--color-primary); color: var(--text-secondary); }
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

.p-admin__mat-editor-actions {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
}

.p-admin__mat-save-msg {
  font-size: $fs-xs;
  margin: 0;
}

.mat-editor-enter-active,
.mat-editor-leave-active { transition: opacity $dur-fast, transform $dur-fast; }
.mat-editor-enter-from,
.mat-editor-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
