<template>
  <article class="c-card c-bento__cell p-vehicle">
    <!-- ── Header ─────────────────────────────────────────────────── -->
    <header class="p-vehicle__head">
      <div class="p-vehicle__head-icon"><Car :size="20" /></div>
      <div>
        <p class="c-card__eyebrow">Asset Pipeline</p>
        <h2 class="p-vehicle__title">Veículo 3D</h2>
      </div>
    </header>

    <!-- ── Layout principal: preview + formulário ─────────────────── -->
    <div class="p-vehicle__body">

      <!-- Coluna esquerda: preview + upload GLB -->
      <div class="p-vehicle__left">
        <div class="p-vehicle__preview">
          <canvas ref="previewCanvas" class="p-vehicle__canvas" />
          <div v-if="!previewReady" class="p-vehicle__canvas-empty">
            <Car :size="32" style="opacity:.18" />
            <span>Selecione um GLB para visualizar</span>
          </div>
          <span class="p-vehicle__preview-label">Preview ao vivo</span>
          <div v-if="previewReady" class="p-vehicle__zoom">
            <button type="button" class="p-vehicle__zoom-btn" title="Zoom +" @click="zoomIn"><ZoomIn :size="14" /></button>
            <button type="button" class="p-vehicle__zoom-btn" title="Zoom −" @click="zoomOut"><ZoomOut :size="14" /></button>
          </div>
        </div>

        <!-- Drop zone GLB -->
        <div class="c-field">
          <label class="c-field__label"><Layers :size="13" /> Modelo GLB <span class="u-text--accent">*</span></label>
          <div
            class="p-vehicle__drop"
            :class="{ 'is-filled': form.model }"
            @click="$refs.modelInput.click()"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <Upload :size="18" />
            <span class="p-vehicle__drop-name">{{ form.model ? form.model.name : 'Clique ou arraste o .glb' }}</span>
            <span v-if="form.model" class="p-vehicle__drop-size">{{ formatBytes(form.model.size) }}</span>
          </div>
          <input ref="modelInput" type="file" accept=".glb" hidden @change="onFileChange" />
        </div>
      </div>

      <!-- Coluna direita: metadados -->
      <div class="p-vehicle__right">

        <!-- Nome -->
        <div class="c-field">
          <label class="c-field__label">Nome do veículo <span class="u-text--accent">*</span></label>
          <input v-model="form.name" class="c-field__input" placeholder="Ex: Pickup Esportiva" maxlength="120" />
        </div>

        <!-- Preço + Ícone (lado a lado) -->
        <div class="p-vehicle__row2">
          <div class="c-field">
            <label class="c-field__label">Preço (moedas)</label>
            <input v-model.number="form.priceCoins" class="c-field__input" type="number" min="0" />
          </div>
          <div class="c-field p-vehicle__emoji-field" v-click-outside="() => emojiOpen = false">
            <label class="c-field__label">Ícone</label>
            <button type="button" class="p-vehicle__emoji-trigger" @click="emojiOpen = !emojiOpen">
              <span class="p-vehicle__emoji-cur">{{ form.icon }}</span>
              <span class="p-vehicle__emoji-hint">Trocar</span>
            </button>
            <div v-if="emojiOpen" class="p-vehicle__emoji-popover">
              <div class="p-vehicle__emoji-grid">
                <button
                  v-for="e in vehicleEmojis" :key="e" type="button"
                  :class="['p-vehicle__emoji-btn', { 'is-active': form.icon === e }]"
                  @click="form.icon = e; emojiOpen = false"
                >{{ e }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Velocidade -->
        <div class="c-field">
          <label class="c-field__label">
            Velocidade
            <span class="p-vehicle__badge">{{ form.speed.toFixed(1) }}</span>
          </label>
          <input v-model.number="form.speed" class="p-admin__slider" type="range" min="1" max="20" step="0.5" />
          <div class="p-vehicle__range-limits"><span>1</span><span>20</span></div>
        </div>

        <!-- Separador Material PBR -->
        <div class="p-vehicle__section-head">
          <Sparkles :size="13" />
          <span>Material PBR</span>
        </div>

        <!-- Material -->
        <div class="c-field">
          <label class="c-field__label">Material</label>
          <select v-model="form.materialId" class="c-field__input">
            <option value="">— Sem material —</option>
            <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <span v-if="!materials.length" class="c-field__hint">Nenhum material cadastrado ainda.</span>
          <button v-else type="button" class="p-admin__refresh-btn" @click="loadMaterials">↺ atualizar lista</button>
        </div>

        <!-- Scale -->
        <div class="c-field">
          <label class="c-field__label">
            Escala
            <span class="p-vehicle__badge">{{ form.scaleFactor.toFixed(2) }}×</span>
          </label>
          <input v-model.number="form.scaleFactor" class="p-admin__slider" type="range" min="0.1" max="5" step="0.05" />
          <div class="p-vehicle__range-limits"><span>0.1×</span><span>5×</span></div>
        </div>

        <!-- Ação -->
        <button
          class="c-btn p-vehicle__submit"
          :disabled="saving || !form.name || !form.model"
          @click="save"
        >
          <Upload :size="15" />
          {{ saving ? 'Enviando…' : 'Publicar Veículo' }}
        </button>

        <p v-if="message" :class="success ? 'c-field__success' : 'c-field__error'" class="p-admin__upload-msg">
          <component :is="success ? CircleCheck : CircleAlert" :size="14" />
          {{ message }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Car, Layers, Upload, Sparkles,
  CircleCheck, CircleAlert, ZoomIn, ZoomOut,
} from 'lucide-vue-next'
import {
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight,
  Color, MeshStandardMaterial, Box3, Vector3, TextureLoader, SRGBColorSpace,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { adminCreateVehicle, adminListMaterials } from '@/core/services/admin.service.js'

const emit = defineEmits(['created'])

const saving        = ref(false)
const message       = ref('')
const success       = ref(false)
const previewReady  = ref(false)
const previewCanvas = ref(null)
const emojiOpen     = ref(false)
const materials     = ref([])

const vehicleEmojis = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
                       '🛻', '🚚', '🚛', '🚜', '🏍', '🛵', '🚲', '🛺', '🚠', '🚡']

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
  speed:       5.0,
  priceCoins:  0,
  icon:        '🚗',
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

let renderer, scene, previewCamera, animId, currentModel
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
  const maxDim = Math.max(size.x, size.y, size.z)

  model.position.sub(center)
  model.position.y -= box.min.y - center.y

  _camDist    = maxDim * 1.8
  _zoomFactor = 1
  _updateCamPosition()
}

function _applyMaterial(model, mat) {
  if (!mat) return
  const texLoader = new TextureLoader()
  const isLinear  = mat.albedoColorSpace === 'linear'
  model.traverse(node => {
    if (!node.isMesh) return
    const m = new MeshStandardMaterial({ roughness: mat.roughness ?? 0.7, metalness: mat.metalness ?? 0.0 })
    if (mat.textureAlbedo) {
      const t = texLoader.load(mat.textureAlbedo); t.flipY = mat.flipY ?? false
      if (!isLinear) t.colorSpace = SRGBColorSpace; m.map = t
    }
    if (mat.textureNormal)             { const t = texLoader.load(mat.textureNormal); t.flipY = mat.flipY ?? false; m.normalMap = t }
    if (mat.textureRoughnessMetalness) { const t = texLoader.load(mat.textureRoughnessMetalness); t.flipY = mat.flipY ?? false; m.roughnessMap = m.metalnessMap = t }
    if (mat.textureAo)                 { const t = texLoader.load(mat.textureAo); t.flipY = mat.flipY ?? false; m.aoMap = t }
    if (mat.textureEmissive)           { const t = texLoader.load(mat.textureEmissive); t.flipY = mat.flipY ?? false; t.colorSpace = SRGBColorSpace; m.emissiveMap = t; m.emissive.set(0xffffff) }
    node.material = m
  })
}

function _initPreview() {
  const canvas = previewCanvas.value
  const W = canvas.clientWidth || 320
  const H = canvas.clientHeight || 220

  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H, false)
  renderer.setClearColor(0x000000, 0)

  scene = new Scene()
  scene.background = new Color(0x12111a)

  previewCamera = new PerspectiveCamera(45, W / H, 0.01, 500)
  _updateCamPosition()

  scene.add(new AmbientLight(0xffffff, 0.8))
  const sun = new DirectionalLight(0xffeedd, 1.2)
  sun.position.set(5, 8, 5)
  scene.add(sun)

  ;(function tick() {
    animId = requestAnimationFrame(tick)
    if (currentModel) currentModel.rotation.y += 0.004
    renderer.render(scene, previewCamera)
  })()
}

function _loadGLB(file) {
  const url = URL.createObjectURL(file)
  const loader = new GLTFLoader()
  loader.load(url, (gltf) => {
    if (currentModel) { scene.remove(currentModel); currentModel = null }
    const root = gltf.scene
    root.scale.setScalar(form.scaleFactor)
    _fitCameraToModel(root)
    const mat = materials.value.find(m => m.id === form.materialId)
    _applyMaterial(root, mat)
    scene.add(root)
    currentModel  = root
    previewReady.value = true
  })
}

watch(() => form.scaleFactor, (v) => {
  if (currentModel) { currentModel.scale.setScalar(v); _fitCameraToModel(currentModel) }
})

watch(() => form.materialId, (id) => {
  if (!currentModel) return
  const mat = materials.value.find(m => m.id === id)
  _applyMaterial(currentModel, mat)
})

onMounted(async () => {
  await loadMaterials()
  _initPreview()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
})

// ─── File handling ────────────────────────────────────────────────────────

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  form.model = file
  _loadGLB(file)
}

function onDrop(e) {
  const file = e.dataTransfer.files[0]
  if (!file || !file.name.endsWith('.glb')) return
  form.model = file
  _loadGLB(file)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Save ─────────────────────────────────────────────────────────────────

async function save() {
  if (!form.name || !form.model) return
  saving.value  = true
  message.value = ''

  try {
    const fd = new FormData()
    fd.append('model', form.model)

    await adminCreateVehicle(fd, {
      name:        form.name,
      priceCoins:  form.priceCoins,
      speed:       form.speed,
      icon:        form.icon,
      materialId:  form.materialId  || undefined,
      scaleFactor: form.scaleFactor,
    })

    success.value = true
    message.value = `Veículo "${form.name}" publicado com sucesso!`

    // Reset
    Object.assign(form, { name: '', speed: 5.0, priceCoins: 0, icon: '🚗', materialId: '', scaleFactor: 1.0, model: null })
    if (currentModel) { scene.remove(currentModel); currentModel = null }
    previewReady.value = false

    emit('created')
  } catch (err) {
    success.value = false
    message.value = err.response?.data?.message || 'Erro ao publicar veículo.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/colors' as *;

// ── Card ────────────────────────────────────────────────────────────────────
.p-vehicle {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding: $space-6;
  border-radius: $radius-xl;

  // ── Header ───────────────────────────────────────────────────────────────
  &__head {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__head-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    background: rgba($brand-primary, 0.14);
    color: $brand-primary-soft;
    flex-shrink: 0;
  }

  &__title {
    font-size: $fs-lg;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  // ── Layout duas colunas ──────────────────────────────────────────────────
  &__body {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: $space-6;
    align-items: start;

    @media (max-width: 800px) {
      grid-template-columns: 1fr;
    }
  }

  // ── Coluna esquerda ──────────────────────────────────────────────────────
  &__left {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__preview {
    position: relative;
    border-radius: $radius-lg;
    overflow: hidden;
    background: #0d0c14;
    border: 1px solid rgba($neutral-600, 0.2);
    aspect-ratio: 4 / 3;
    min-height: 200px;
  }

  &__canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__canvas-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    color: $neutral-500;
    font-size: $fs-xs;
    pointer-events: none;
  }

  &__preview-label {
    position: absolute;
    bottom: $space-2;
    right: $space-3;
    font-size: 0.68rem;
    color: $neutral-500;
    letter-spacing: 0.04em;
    pointer-events: none;
  }

  &__zoom {
    position: absolute;
    top: $space-2;
    right: $space-2;
    display: flex;
    gap: 4px;
  }

  &__zoom-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: $radius-md;
    border: 1px solid rgba($neutral-600, 0.35);
    background: rgba(0,0,0,0.5);
    color: $neutral-300;
    cursor: pointer;
    transition: background $dur-fast;
    &:hover { background: rgba($brand-primary, 0.25); color: $brand-primary-soft; }
  }

  // ── Drop Zone ────────────────────────────────────────────────────────────
  &__drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
    padding: $space-3 $space-4;
    border-radius: $radius-lg;
    border: 1.5px dashed rgba($neutral-600, 0.45);
    background: rgba($neutral-800, 0.3);
    color: $neutral-400;
    font-size: $fs-xs;
    cursor: pointer;
    transition: border-color $dur-fast, background $dur-fast;
    text-align: center;

    &:hover, &.is-filled {
      border-color: $brand-primary-soft;
      background: rgba($brand-primary, 0.06);
      color: $neutral-200;
    }
  }

  &__drop-name {
    font-size: $fs-xs;
    word-break: break-all;
    line-height: 1.3;
  }

  &__drop-size {
    font-size: 0.7rem;
    color: $neutral-500;
  }

  // ── Coluna direita ───────────────────────────────────────────────────────
  &__right {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  // Preço + Ícone lado a lado
  &__row2 {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: $space-3;
    align-items: end;
  }

  // Badge valor do slider
  &__badge {
    display: inline-block;
    margin-left: $space-2;
    padding: 1px 7px;
    border-radius: 99px;
    background: rgba($brand-primary, 0.14);
    color: $brand-primary-soft;
    font-size: 0.72rem;
    font-weight: 600;
    font-family: var(--font-mono, monospace);
    vertical-align: middle;
  }

  // Limites range
  &__range-limits {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: $neutral-600;
    margin-top: 2px;
    padding: 0 2px;
  }

  // Separador de seção
  &__section-head {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    font-weight: 600;
    color: $neutral-400;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding-bottom: $space-2;
    border-bottom: 1px solid rgba($neutral-600, 0.2);
  }

  // Ícone emoji
  &__emoji-field {
    position: relative;
    min-width: 120px;
  }

  &__emoji-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    cursor: pointer;
    color: var(--text-primary);
    font-size: $fs-sm;
    transition: border-color $dur-fast;
    &:hover { border-color: $brand-primary-soft; }
  }

  &__emoji-cur { font-size: 1.3rem; line-height: 1; }
  &__emoji-hint { font-size: $fs-xs; color: $neutral-500; }

  &__emoji-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 50;
    background: var(--bg-elevated, #1a1928);
    border: 1px solid rgba($neutral-600, 0.3);
    border-radius: $radius-lg;
    padding: $space-3;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    min-width: 220px;
  }

  &__emoji-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }

  &__emoji-btn {
    font-size: 1.35rem;
    padding: 5px;
    border-radius: $radius-md;
    border: 1.5px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: background $dur-fast, border-color $dur-fast;
    line-height: 1;
    text-align: center;
    &:hover { background: rgba($neutral-600, 0.2); }
    &.is-active {
      background: rgba($brand-primary, 0.2);
      border-color: $brand-primary-soft;
    }
  }

  // Botão submit
  &__submit {
    width: 100%;
    margin-top: $space-2;
    justify-content: center;
    gap: $space-2;
  }
}
</style>
