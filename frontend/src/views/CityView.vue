<template>
  <div class="v-city" :class="{ 'v-city--build': build.isActive.value }">

    <!-- Canvas WebGL -->
    <canvas ref="canvasRef" class="v-city__canvas" />

    <!-- Loading overlay -->
    <Transition name="t-fade">
      <div v-if="state === 'loading'" class="v-city__overlay v-city__overlay--loading">
        <div class="v-city__spinner" />
        <span>Carregando cidade...</span>
      </div>
    </Transition>

    <!-- Error overlay -->
    <Transition name="t-fade">
      <div v-if="state === 'error'" class="v-city__overlay v-city__overlay--error">
        <span class="v-city__error-icon">⚠</span>
        <span>{{ errorMsg }}</span>
        <button class="v-city__retry-btn" @click="loadCity">Tentar novamente</button>
      </div>
    </Transition>

    <!-- Empty city hint (explore mode only) -->
    <Transition name="t-fade">
      <div v-if="state === 'empty' && !build.isActive.value" class="v-city__overlay v-city__overlay--empty">
        <p class="v-city__empty-title">Sua cidade está vazia</p>
        <p class="v-city__empty-sub">Use o Modo Construção para começar a construir.</p>
      </div>
    </Transition>

    <!-- ── HUD (explore mode) ────────────────────────────────────────── -->

    <!-- City info (top-left) -->
    <Transition name="t-slide-up">
      <div v-if="showExploreHUD" class="v-city__hud-info">
        <div class="v-city__hud-title">
          <span class="v-city__hud-icon">🏙</span>
          <span>{{ displayName }}</span>
        </div>
        <div class="v-city__hud-row">
          <span class="v-city__hud-label">Nível</span>
          <span class="v-city__hud-value">{{ meta?.cityLevel ?? 1 }}</span>
        </div>
        <div class="v-city__hud-row">
          <span class="v-city__hud-label">Construções</span>
          <span class="v-city__hud-value">{{ meta?.totalBuildings ?? 0 }}</span>
        </div>
        <div class="v-city__hud-row v-city__hud-row--seed">
          <span class="v-city__hud-label">Seed</span>
          <span class="v-city__hud-value v-city__hud-value--seed">{{ shortSeed }}</span>
        </div>
      </div>
    </Transition>

    <!-- Active vehicle (bottom-center, explore mode only) -->
    <Transition name="t-slide-up">
      <div v-if="activeVehicle && showExploreHUD" class="v-city__hud-vehicle">
        <span class="v-city__hud-vehicle-icon">{{ vehicleIcon }}</span>
        <span class="v-city__hud-vehicle-name">{{ activeVehicle.vehicleType.replace('_', ' ') }}</span>
      </div>
    </Transition>

    <!-- Controls hint (bottom-right, explore mode only) -->
    <div v-if="showExploreHUD" class="v-city__hud-controls">
      <span>Arrastar · Pan</span>
      <span>Botão direito · Girar</span>
      <span>Scroll · Zoom</span>
    </div>

    <!-- Build mode toggle (top-right, only for own city) -->
    <Transition name="t-slide-up">
      <button
        v-if="canBuild && (state === 'ready' || state === 'empty')"
        class="v-city__build-toggle"
        :class="{ 'v-city__build-toggle--active': build.isActive.value }"
        :title="build.isActive.value ? 'Sair do Modo Construção' : 'Modo Construção'"
        @click="toggleBuildMode"
      >
        <span class="v-city__build-toggle-icon">🏗️</span>
        <span>{{ build.isActive.value ? 'Sair' : 'Construir' }}</span>
      </button>
    </Transition>

    <!-- ── HUD (build mode) ──────────────────────────────────────────── -->

    <Transition name="t-slide-up">
      <div v-if="build.isActive.value" class="v-city__hud-build">

        <!-- CCU Bar -->
        <CCUBar
          :ccu-used="build.ccuUsed.value"
          :ccu-limit="build.ccuLimit.value"
          :percent="build.ccuPercent.value"
        />

        <!-- Selected item hint -->
        <div v-if="build.selectedItem.value" class="v-city__hud-placing">
          <span>{{ build.selectedItem.value.icon }}</span>
          <span>{{ build.selectedItem.value.name }}</span>
          <button class="v-city__hud-placing-cancel" @click="build.clearSelection()">✕</button>
        </div>
        <p v-else class="v-city__hud-hint">Selecione um item abaixo para construir</p>

      </div>
    </Transition>

    <!-- Build hints (bottom-right, build mode) -->
    <div v-if="build.isActive.value" class="v-city__hud-controls v-city__hud-controls--build">
      <span>Click · Posicionar</span>
      <span>Arrastar · Pan</span>
      <span>Scroll · Zoom</span>
    </div>

    <!-- ── Build Dock ─────────────────────────────────────────────────── -->
    <Transition name="t-build-dock">
      <BuildDock
        v-if="build.isActive.value"
        v-model="build.activeCategory.value"
        :items="build.categoryItems.value"
        :selected-item="build.selectedItem.value"
        @select="build.selectItem"
      />
    </Transition>

    <!-- Build loading overlay (while fetching palette) -->
    <Transition name="t-fade">
      <div v-if="build.loading.value" class="v-city__overlay v-city__overlay--loading">
        <div class="v-city__spinner" />
        <span>Carregando paleta...</span>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useCityRenderer } from '@/composables/useCityRenderer.js'
import { useBuildMode } from '@/composables/useBuildMode.js'
import { cityService } from '@/core/services/city.service.js'
import CCUBar    from '@/components/city/CCUBar.vue'
import BuildDock from '@/components/city/BuildDock.vue'

// ── State ────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const state     = ref('loading')   // loading | ready | empty | error
const errorMsg  = ref('')
const meta      = ref(null)
const vehicles  = ref([])

const route      = useRoute()
const isVisiting = computed(() => !!route.params.userId)
const user       = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))
const canBuild   = computed(() => !isVisiting.value)

const displayName = computed(() =>
  isVisiting.value ? (meta.value?.username ?? route.params.userId) : (user.value?.username ?? '—'),
)

const activeVehicle = computed(() => vehicles.value.find(v => v.isActive) ?? vehicles.value[0] ?? null)

const vehicleIcon = computed(() => {
  const map = { skateboard: '🛹', bicycle: '🚲', car_basic: '🚗', car_sport: '🏎', car_luxury: '🚀' }
  return map[activeVehicle.value?.vehicleType] ?? '🛹'
})

const shortSeed = computed(() =>
  meta.value?.citySeed ? meta.value.citySeed.slice(0, 8) + '...' : '—',
)

const showExploreHUD = computed(() =>
  !build.isActive.value && (state.value === 'ready' || state.value === 'empty'),
)

// ── Renderer + Build Mode ─────────────────────────────────────────────
const renderer = useCityRenderer(canvasRef)
const build    = useBuildMode(renderer)

const { init, loadCity: renderChunks, resize, dispose } = renderer

// ── Build mode toggle ─────────────────────────────────────────────────
async function toggleBuildMode() {
  if (build.isActive.value) {
    build.deactivate()
  } else {
    await build.activate(meta.value)
  }
}

// ── Data loading ──────────────────────────────────────────────────────
async function loadCity() {
  state.value = 'loading'
  try {
    const cityData = isVisiting.value
      ? await cityService.getCity(route.params.userId)
      : await cityService.getMyCity()

    const vehicleData = isVisiting.value ? [] : await cityService.getVehicles()

    meta.value     = cityData.meta
    vehicles.value = vehicleData

    renderChunks(cityData.chunks)

    state.value = cityData.chunks.length === 0 ? 'empty' : 'ready'
  } catch (e) {
    errorMsg.value = e?.response?.data?.message ?? 'Não foi possível carregar a cidade.'
    state.value    = 'error'
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────
const ro = new ResizeObserver(() => resize())

onMounted(async () => {
  init()
  ro.observe(canvasRef.value.parentElement)
  await loadCity()
})

onBeforeUnmount(() => {
  ro.disconnect()
  if (build.isActive.value) build.deactivate()
  dispose()
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.v-city {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: $neutral-950;

  // ── Canvas ──────────────────────────────────────────────────────
  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;

    &:active { cursor: grabbing; }
  }

  &--build &__canvas { cursor: crosshair; }

  // ── Overlays ─────────────────────────────────────────────────────
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-3;
    font-family: var(--font-display);
    pointer-events: none;
    z-index: $z-content;

    &--loading { color: $neutral-400; font-size: 0.9rem; pointer-events: none; }
    &--error   { color: $state-error; font-size: 0.9rem; pointer-events: auto; }
    &--empty   { pointer-events: none; }
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba($brand-primary, 0.2);
    border-top-color: $brand-primary;
    border-radius: $radius-pill;
    animation: spin 0.8s linear infinite;
  }

  &__error-icon { font-size: 2rem; }

  &__retry-btn {
    margin-top: $space-2;
    padding: $space-2 $space-5;
    background: rgba($state-error, 0.15);
    border: 1px solid rgba($state-error, 0.4);
    border-radius: $radius-pill;
    color: $state-error;
    font-size: 0.85rem;
    font-family: var(--font-display);
    cursor: pointer;
    pointer-events: auto;
    transition: background $dur-fast $ease-out;
    &:hover { background: rgba($state-error, 0.28); }
  }

  &__empty-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: $neutral-300;
    font-family: var(--font-display);
    margin: 0;
  }

  &__empty-sub {
    font-size: 0.85rem;
    color: $neutral-500;
    margin: 0;
    text-align: center;
    max-width: 280px;
    line-height: 1.6;
  }

  // ── HUD Info (top-left) ──────────────────────────────────────────
  &__hud-info {
    position: absolute;
    top: $space-5;
    left: $space-5;
    z-index: $z-content;
    padding: $space-4 $space-5;
    background: rgba($neutral-900, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba($neutral-600, 0.25);
    border-radius: $radius-lg;
    min-width: 180px;
  }

  &__hud-title {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: $neutral-0;
    margin-bottom: $space-3;
    padding-bottom: $space-3;
    border-bottom: 1px solid rgba($neutral-600, 0.2);
  }

  &__hud-icon { font-size: 1.1rem; }

  &__hud-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
    padding: $space-1 0;
    &--seed { margin-top: $space-1; }
  }

  &__hud-label {
    font-size: 0.75rem;
    color: $neutral-400;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__hud-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: $brand-primary-soft;
    font-family: var(--font-display);
    &--seed {
      font-size: 0.7rem;
      color: $neutral-500;
      font-family: monospace;
      letter-spacing: 0.04em;
    }
  }

  // ── HUD Vehicle (bottom-center) ──────────────────────────────────
  &__hud-vehicle {
    position: absolute;
    bottom: $space-6;
    left: 50%;
    transform: translateX(-50%);
    z-index: $z-content;
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-5;
    background: rgba($neutral-900, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba($brand-secondary, 0.3);
    border-radius: $radius-pill;
    box-shadow: 0 0 18px rgba($brand-secondary, 0.15);
    &-icon { font-size: 1.1rem; }
    &-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: $brand-secondary-soft;
      font-family: var(--font-display);
      text-transform: capitalize;
    }
  }

  // ── Controls hint (bottom-right) ────────────────────────────────
  &__hud-controls {
    position: absolute;
    bottom: $space-5;
    right: $space-5;
    z-index: $z-content;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-1;

    span {
      font-size: 0.7rem;
      color: $neutral-600;
      font-family: var(--font-display);
    }

    &--build { bottom: 190px; }
  }

  // ── Build toggle button (top-right) ──────────────────────────────
  &__build-toggle {
    position: absolute;
    top: $space-5;
    right: $space-5;
    z-index: $z-content;
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    background: rgba($neutral-900, 0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba($neutral-600, 0.3);
    border-radius: $radius-pill;
    color: $neutral-200;
    font-size: 0.82rem;
    font-family: var(--font-display);
    font-weight: 600;
    cursor: pointer;
    transition: background $dur-fast $ease-out, border-color $dur-fast $ease-out,
                box-shadow $dur-fast $ease-out;

    &:hover {
      background: rgba($brand-primary, 0.2);
      border-color: rgba($brand-primary, 0.5);
    }

    &--active {
      background: rgba($state-error, 0.15);
      border-color: rgba($state-error, 0.4);
      color: $state-error;
      box-shadow: 0 0 12px rgba($state-error, 0.15);
    }

    &-icon { font-size: 1rem; }
  }

  // ── Build mode HUD (top-left area when build mode active) ──────
  &__hud-build {
    position: absolute;
    top: $space-5;
    left: $space-5;
    z-index: $z-content;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-4 $space-5;
    background: rgba($neutral-900, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba($brand-primary, 0.25);
    border-radius: $radius-lg;
    min-width: 240px;
    box-shadow: 0 0 20px rgba($brand-primary, 0.1);
  }

  &__hud-placing {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: 0.82rem;
    font-weight: 600;
    color: $brand-secondary-soft;
    font-family: var(--font-display);

    &-cancel {
      margin-left: auto;
      background: none;
      border: none;
      color: $neutral-500;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px $space-1;
      border-radius: $radius-sm;
      transition: color $dur-fast $ease-out;
      &:hover { color: $state-error; }
    }
  }

  &__hud-hint {
    font-size: 0.72rem;
    color: $neutral-500;
    font-family: var(--font-display);
    margin: 0;
  }
}

// ── Transitions ──────────────────────────────────────────────────────
.t-fade-enter-active,
.t-fade-leave-active { transition: opacity $dur-base $ease-out; }
.t-fade-enter-from,
.t-fade-leave-to     { opacity: 0; }

.t-slide-up-enter-active,
.t-slide-up-leave-active { transition: opacity $dur-slow $ease-out, transform $dur-slow $ease-out; }
.t-slide-up-enter-from,
.t-slide-up-leave-to     { opacity: 0; transform: translateY(12px); }

.t-build-dock-enter-active,
.t-build-dock-leave-active { transition: opacity $dur-slow $ease-out, transform $dur-slow $ease-out; }
.t-build-dock-enter-from,
.t-build-dock-leave-to     { opacity: 0; transform: translateX(-50%) translateY(100%); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
