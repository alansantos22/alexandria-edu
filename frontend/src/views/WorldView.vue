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
    </div>

    <!-- HUD — cidade próxima (centro inferior) -->
    <Transition name="t-slide-up">
      <div v-if="nearbyCity" class="v-world__hud-city">
        <span class="v-world__hud-city-name">🏙 {{ nearbyCity.username }}</span>
        <div class="v-world__hud-city-meta">
          <span>Nível {{ nearbyCity.cityLevel }}</span>
          <span class="v-world__hud-city-dot">·</span>
          <span>{{ nearbyCity.totalBuildings }} construções</span>
        </div>
        <button class="v-world__hud-city-btn" @click="visitCity">
          Visitar cidade →
        </button>
      </div>
    </Transition>

    <!-- HUD — dicas de controle (bottom-right) -->
    <div v-if="state === 'ready'" class="v-world__hud-controls">
      <span>W A S D · {{ playerMode === 'driving' ? 'Dirigir' : 'Andar' }}</span>
      <span>E · {{ playerMode === 'driving' ? 'Sair do veículo' : 'Entrar no veículo' }}</span>
      <span>Scroll · Zoom</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useWorldRenderer } from '@/composables/useWorldRenderer.js'
import { cityService } from '@/core/services/city.service.js'

const canvasRef = ref(null)
const state     = ref('loading')
const router    = useRouter()

let cities = []

const { init, loadWorld, checkNearbyCities, resize, dispose, nearbyCity, playerPos, playerMode } =
  useWorldRenderer(canvasRef)

async function load() {
  state.value = 'loading'
  try {
    cities = await cityService.getWorldMap()
    loadWorld(cities)
    state.value = 'ready'

    // Check nearby cities on each animation frame
    ;(function poll() {
      if (state.value !== 'ready') return
      checkNearbyCities(cities)
      requestAnimationFrame(poll)
    })()
  } catch {
    state.value = 'error'
  }
}

function visitCity() {
  if (nearbyCity.value) {
    router.push(`/city/${nearbyCity.value.userId}`)
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

  // ── HUD Cidade próxima ────────────────────────────────────────────
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
