<template>
  <div class="v-world">
    <canvas ref="canvasRef" class="v-world__canvas" />

    <!-- Loading -->
    <Transition name="t-fade">
      <div v-if="state === 'loading'" class="v-world__overlay">
        <div class="v-world__spinner" />
        <span>Gerando mundo...</span>
      </div>
    </Transition>

    <!-- Error -->
    <Transition name="t-fade">
      <div v-if="state === 'error'" class="v-world__overlay v-world__overlay--error">
        <span>⚠ Não foi possível carregar o mapa.</span>
        <button class="v-world__retry" @click="load">Tentar novamente</button>
      </div>
    </Transition>

    <!-- HUD — coordenadas (bottom-left) -->
    <div v-if="state === 'ready'" class="v-world__hud-coords">
      <span class="v-world__hud-label">COORDS</span>
      <span class="v-world__hud-val">{{ playerPos.x }}, {{ playerPos.z }}</span>
      <span class="v-world__hud-sep">·</span>
      <span class="v-world__hud-time">{{ timeOfDay }}</span>
    </div>

    <!-- HUD — dentro de uma cidade (banner central) -->
    <Transition name="t-slide-up">
      <div v-if="enterCityZone" class="v-world__hud-city v-world__hud-city--inside">
        <span class="v-world__hud-city-name">🏙 {{ enterCityZone.username }}</span>
        <div class="v-world__hud-city-meta">
          <span>Nível {{ enterCityZone.cityLevel }}</span>
          <span class="v-world__hud-city-dot">·</span>
          <span>{{ enterCityZone.totalBuildings }} construções</span>
        </div>
      </div>
    </Transition>

    <!-- HUD — cidade próxima (centro inferior) -->
    <Transition name="t-slide-up">
      <div v-if="nearbyCity && !enterCityZone" class="v-world__hud-city">
        <span class="v-world__hud-city-name">🏙 {{ nearbyCity.username }}</span>
        <div class="v-world__hud-city-meta">
          <span>Nível {{ nearbyCity.cityLevel }}</span>
          <span class="v-world__hud-city-dot">·</span>
          <span>{{ nearbyCity.totalBuildings }} construções</span>
        </div>
      </div>
    </Transition>

    <!-- HUD — dicas de controle (bottom-right) -->
    <div v-if="state === 'ready'" class="v-world__hud-controls">
      <span>W A S D · {{ playerMode === 'driving' ? 'Dirigir' : 'Andar' }}</span>
      <span>E · {{ playerMode === 'driving' ? 'Sair do veículo' : 'Entrar no veículo' }}</span>
      <span>C · Câmera: {{ ['Iso', '3ª Pessoa', '1ª Pessoa'][cameraModeRef] }}</span>
      <span v-if="cameraModeRef === 0">Scroll · Zoom</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useWorldRenderer } from '@/composables/useWorldRenderer.js'
import { cityService }      from '@/core/services/city.service.js'
import api                  from '@/core/api.js'

const canvasRef = ref(null)
const state     = ref('loading')

let cities = []

const {
  init, loadWorld, checkNearbyCities, resize, dispose,
  nearbyCity, enterCityZone, playerPos, playerMode, cameraModeRef, timeOfDay,
} = useWorldRenderer(canvasRef)

async function load() {
  state.value = 'loading'
  try {
    const [citiesData, vehiclesData, catalogData, adjData] = await Promise.allSettled([
      cityService.getWorldMap(),
      api.get('/city/vehicles'),
      api.get('/city/vehicles/catalog'),
      cityService.getWorldAdjacencies(),
    ])

    cities = citiesData.status === 'fulfilled' ? citiesData.value : []
    const adjacencies = adjData.status === 'fulfilled' ? adjData.value : []

    let activeVehicle  = null
    let vehicleCatalog = []
    if (vehiclesData.status === 'fulfilled') {
      // endpoint retorna UserVehicle[] direto (não { vehicles: [] })
      const userVehicles = vehiclesData.value.data ?? []
      activeVehicle  = userVehicles.find(v => v.isActive) ?? null
    }
    if (catalogData.status === 'fulfilled') {
      // catálogo global de veículos ativos — usado para popular as ruas
      vehicleCatalog = catalogData.value.data?.catalog ?? []
    }

    await loadWorld(cities, { activeVehicle, vehicleCatalog, adjacencies })
    state.value = 'ready'

    ;(function poll() {
      if (state.value !== 'ready') return
      checkNearbyCities(cities)
      requestAnimationFrame(poll)
    })()
  } catch {
    state.value = 'error'
  }
}

const ro = new ResizeObserver(() => resize())

onMounted(async () => {
  init()
  ro.observe(canvasRef.value.parentElement)
  canvasRef.value.focus()
  await load()
})

onBeforeUnmount(() => {
  ro.disconnect()
  dispose()
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

.v-world {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: $neutral-950;
  outline: none;

  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  // ── Overlays ──────────────────────────────────────────────────────
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-3;
    color: $neutral-400;
    font-size: 0.9rem;
    font-family: var(--font-display);
    pointer-events: none;
    z-index: $z-content;

    &--error { color: $state-error; pointer-events: auto; }
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba($brand-primary, 0.2);
    border-top-color: $brand-primary;
    border-radius: $radius-pill;
    animation: spin 0.8s linear infinite;
  }

  &__retry {
    margin-top: $space-2;
    padding: $space-2 $space-5;
    background: rgba($state-error, 0.15);
    border: 1px solid rgba($state-error, 0.4);
    border-radius: $radius-pill;
    color: $state-error;
    font-size: 0.85rem;
    font-family: var(--font-display);
    cursor: pointer;
    &:hover { background: rgba($state-error, 0.28); }
  }

  // ── HUD Coords ────────────────────────────────────────────────────
  &__hud-coords {
    position: absolute;
    bottom: $space-5;
    left: $space-5;
    z-index: $z-content;
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    background: rgba($neutral-900, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba($neutral-600, 0.2);
    border-radius: $radius-pill;
  }

  &__hud-sep {
    font-size: 0.65rem;
    color: $neutral-700;
    font-family: var(--font-display);
  }

  &__hud-time {
    font-size: 0.78rem;
    font-weight: 600;
    color: $neutral-300;
    font-family: monospace;
    letter-spacing: 0.04em;
  }

  &__hud-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: $neutral-500;
    font-family: var(--font-display);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  &__hud-val {
    font-size: 0.78rem;
    font-weight: 600;
    color: $brand-secondary-soft;
    font-family: monospace;
  }

  // ── HUD Cidade próxima / dentro ──────────────────────────────────
  &__hud-city {
    position: absolute;
    bottom: $space-7;
    left: 50%;
    transform: translateX(-50%);
    z-index: $z-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
    padding: $space-4 $space-6;
    background: rgba($neutral-900, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba($brand-primary, 0.35);
    border-radius: $radius-xl;
    box-shadow: 0 0 28px rgba($brand-primary, 0.18);
    text-align: center;
    min-width: 200px;

    &--inside {
      bottom: auto;
      top: $space-5;
      border-color: rgba($brand-secondary, 0.5);
      box-shadow: 0 0 28px rgba($brand-secondary, 0.25);
    }

    &-name {
      font-size: 1rem;
      font-weight: 700;
      color: $neutral-0;
      font-family: var(--font-display);
    }

    &-meta {
      display: flex;
      align-items: center;
      gap: $space-2;
      font-size: 0.78rem;
      color: $neutral-400;
      font-family: var(--font-display);
    }

    &-dot { color: $neutral-600; }

    &-btn {
      margin-top: $space-1;
      padding: $space-2 $space-5;
      background: rgba($brand-primary, 0.18);
      border: 1px solid rgba($brand-primary, 0.4);
      border-radius: $radius-pill;
      color: $brand-primary-soft;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: var(--font-display);
      cursor: pointer;
      transition: background $dur-fast $ease-out;
      white-space: nowrap;

      &:hover { background: rgba($brand-primary, 0.32); }
    }
  }

  // ── HUD Controles ─────────────────────────────────────────────────
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
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────
.t-fade-enter-active,
.t-fade-leave-active { transition: opacity $dur-base $ease-out; }
.t-fade-enter-from,
.t-fade-leave-to     { opacity: 0; }

.t-slide-up-enter-active,
.t-slide-up-leave-active { transition: opacity $dur-slow $ease-out, transform $dur-slow $ease-out; }
.t-slide-up-enter-from,
.t-slide-up-leave-to     { opacity: 0; transform: translateY(16px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
