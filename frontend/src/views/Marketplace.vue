<template>
  <div class="p-marketplace">

    <!-- ── Header ────────────────────────────────────────────────────── -->
    <header class="p-marketplace__header a-fade-in-up">
      <div>
        <p class="u-text--eyebrow">Loja de cosméticos</p>
        <h1 class="p-marketplace__title">
          <ShoppingBag :size="28" />
          Marketplace
        </h1>
        <p class="p-marketplace__lead">
          Personalize seu perfil, desbloqueie edifícios e adquira veículos para sua cidade.
        </p>
      </div>

      <!-- Balance chip -->
      <div class="c-balance-chip">
        <span class="c-balance-chip__icon">🪙</span>
        <span class="c-balance-chip__value">{{ userBalance.toLocaleString('pt-BR') }}</span>
        <span class="c-balance-chip__label">moedas</span>
      </div>
    </header>

    <!-- ── Season banner ─────────────────────────────────────────────── -->
    <div v-if="activeSeason" class="c-season-banner a-fade-in-up">
      <div class="c-season-banner__left">
        <span class="c-season-banner__icon">🏆</span>
        <div>
          <p class="c-season-banner__name">{{ activeSeason.name }}</p>
          <p class="c-season-banner__ends">Termina em {{ timeRemaining }}</p>
        </div>
      </div>
      <span class="c-badge c-season-banner__badge">Exclusivos disponíveis</span>
    </div>

    <!-- ── Filters ───────────────────────────────────────────────────── -->
    <nav class="p-marketplace__filters" aria-label="Filtrar por tipo">
      <button
        v-for="f in filters"
        :key="f.value"
        class="c-filter-chip"
        :class="{ 'c-filter-chip--active': activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        {{ f.icon }} {{ f.label }}
      </button>
    </nav>

    <!-- ── Loading ───────────────────────────────────────────────────── -->
    <div v-if="loading" class="p-marketplace__loading">
      <div class="c-spinner" aria-label="Carregando itens..." />
    </div>

    <!-- ── Empty ─────────────────────────────────────────────────────── -->
    <div v-else-if="filteredItems.length === 0" class="p-marketplace__empty">
      <span>🎁</span>
      <p>Nenhum item nesta categoria por enquanto.</p>
    </div>

    <!-- ── Grid ──────────────────────────────────────────────────────── -->
    <section v-else class="p-marketplace__grid">
      <MarketplaceItemCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :is-seasonal="!!item.seasonId"
        @select="openBuyModal"
        @equip="handleEquip"
      />
    </section>

    <!-- ── Buy modal ─────────────────────────────────────────────────── -->
    <BuyConfirmModal
      :item="selectedItem"
      :user-balance="userBalance"
      :season-ends-at="activeSeason?.endsAt ?? null"
      :loading="purchasing"
      @close="selectedItem = null"
      @confirm="confirmPurchase"
    />

    <!-- ── Success toast (equip) ─────────────────────────────────────── -->
    <Transition name="coin-toast">
      <div v-if="equipToast" class="c-coin-toast c-coin-toast--success" role="status" aria-live="polite">
        <span class="c-coin-toast__icon">✨</span>
        <span class="c-coin-toast__text">{{ equipToast }}</span>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ShoppingBag } from 'lucide-vue-next'
import api                          from '@/core/api.js'
import { marketplaceService } from '@/core/services/marketplace.service.js'
import { useEconomyStore }    from '@/core/store/economy.js'
import MarketplaceItemCard    from '@/components/marketplace/MarketplaceItemCard.vue'
import BuyConfirmModal        from '@/components/marketplace/BuyConfirmModal.vue'

// ── State ─────────────────────────────────────────────────────────────────
const { balance, applyReward, fetchBalance } = useEconomyStore()

const items        = ref([])
const buildings    = ref([])
const vehicles     = ref([])
const activeSeason = ref(null)
const loading      = ref(true)
const purchasing   = ref(false)
const selectedItem = ref(null)
const equipToast   = ref(null)
const activeFilter = ref('all')

const userBalance = computed(() => balance.value)

// ── Filters ───────────────────────────────────────────────────────────────
const filters = [
  { value: 'all',       label: 'Todos',      icon: '🛍️' },
  { value: 'avatar',    label: 'Avatares',   icon: '🧑' },
  { value: 'frame',     label: 'Molduras',   icon: '🪞' },
  { value: 'badge',     label: 'Emblemas',   icon: '🏅' },
  { value: 'wallpaper', label: 'Wallpapers', icon: '🖼️' },
  { value: 'palette',   label: 'Paletas',    icon: '🎨' },
  { value: 'building',  label: 'Edifícios',  icon: '🏗️' },
  { value: 'vehicle',   label: 'Veículos',   icon: '🚗' },
]

const allItems = computed(() => {
  const cosmetics = items.value
  const blds      = buildings.value
  const vehs      = vehicles.value
  return [...cosmetics, ...blds, ...vehs]
})

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return allItems.value
  return allItems.value.filter(i => i.type === activeFilter.value)
})

// ── Season countdown ──────────────────────────────────────────────────────
const timeRemaining = computed(() => {
  if (!activeSeason.value?.endsAt) return ''
  const diff = new Date(activeSeason.value.endsAt) - Date.now()
  if (diff <= 0) return 'Encerrada'
  const days    = Math.floor(diff / 86_400_000)
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
})

// ── Load ──────────────────────────────────────────────────────────────────
async function loadItems() {
  loading.value = true
  try {
    const [cosmeticsData, buildingsData, vehiclesData] = await Promise.all([
      marketplaceService.listItems(),
      marketplaceService.listBuildings(),
      marketplaceService.listVehicles(),
    ])
    items.value        = cosmeticsData.items
    activeSeason.value = cosmeticsData.activeSeason
    buildings.value    = buildingsData.buildings
    vehicles.value     = vehiclesData.vehicles
  } catch {
    // silencioso; o interceptor de axios já redireciona no 401
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)

// ── Buy flow ──────────────────────────────────────────────────────────────
function openBuyModal(item) {
  if (item.owned) return // já possui, não abrir modal de compra
  selectedItem.value = item
}

async function confirmPurchase() {
  if (!selectedItem.value) return
  purchasing.value = true
  try {
    const item = selectedItem.value
    let result

    if (item.type === 'building') {
      result = await marketplaceService.buyBuilding(item.id)
      applyReward(-item.priceCoins, result.newBalance)
      fetchBalance()
      const idx = buildings.value.findIndex(b => b.id === item.id)
      if (idx !== -1) buildings.value[idx] = { ...buildings.value[idx], owned: true }
    } else if (item.type === 'vehicle') {
      result = await marketplaceService.buyVehicle(item.id)
      if (item.priceCoins > 0) { applyReward(-item.priceCoins, result.newBalance); fetchBalance() }
      const idx = vehicles.value.findIndex(v => v.id === item.id)
      if (idx !== -1) vehicles.value[idx] = { ...vehicles.value[idx], owned: true }
      showEquipToast(`${item.name} adquirido e equipado! 🚗`)
    } else {
      result = await marketplaceService.buyItem(item.id)
      applyReward(-item.priceCoins, result.newBalance)
      fetchBalance()
      const idx = items.value.findIndex(i => i.id === item.id)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], owned: true }
    }

    selectedItem.value = null
  } catch (err) {
    console.error(err)
  } finally {
    purchasing.value = false
  }
}

// ── Equip ─────────────────────────────────────────────────────────────────
async function handleEquip(item) {
  try {
    if (item.type === 'vehicle') {
      // Veículos usam endpoint próprio com o ID da linha user_vehicles
      if (!item.userVehicleId) throw new Error('userVehicleId ausente')
      await api.post(`/city/vehicles/${item.userVehicleId}/activate`)
      showEquipToast(`${item.name} equipado! 🚗`)
    } else {
      await marketplaceService.equipItem(item.id)
      showEquipToast(`${item.name} equipado!`)
    }
  } catch {
    showEquipToast('Erro ao equipar o item.')
  }
}

function showEquipToast(msg) {
  equipToast.value = msg
  setTimeout(() => { equipToast.value = null }, 3000)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/colors'    as *;
@use '@/assets/scss/mixins'    as *;

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------
.p-marketplace {
  max-width: 1100px;
  margin: 0 auto;
  padding: $space-6 $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-6;

  @media (max-width: $bp-sm) {
    padding: $space-4 $space-3;
    gap: $space-4;
  }

  // ── Header ───────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-4;
    flex-wrap: wrap;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $space-3;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 800;
    margin: $space-1 0;
    color: var(--text-primary);
  }

  &__lead {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    max-width: 480px;
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  &__filters {
    display: flex;
    gap: $space-2;
    flex-wrap: wrap;
  }

  // ── Grid ─────────────────────────────────────────────────────────────────
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $space-4;

    @media (max-width: $bp-sm) {
      grid-template-columns: repeat(2, 1fr);
      gap: $space-3;
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  &__loading {
    display: flex;
    justify-content: center;
    padding: $space-8 0;
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    padding: $space-8 0;
    color: var(--text-tertiary, #{$neutral-500});
    font-size: 0.9rem;

    span { font-size: 2.5rem; }
  }
}

// ---------------------------------------------------------------------------
// Balance chip
// ---------------------------------------------------------------------------
.c-balance-chip {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: rgba($brand-gold, 0.1);
  border: 1px solid rgba($brand-gold, 0.3);
  border-radius: $radius-pill;
  white-space: nowrap;

  &__icon  { font-size: 1.1rem; }
  &__value { font-size: 1.1rem; font-weight: 800; color: $brand-gold; }
  &__label { font-size: 0.72rem; color: rgba($brand-gold, 0.75); text-transform: uppercase; letter-spacing: 0.07em; }
}

// ---------------------------------------------------------------------------
// Season banner
// ---------------------------------------------------------------------------
.c-season-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4 $space-5;
  background: linear-gradient(130deg, rgba($brand-gold, 0.12) 0%, rgba($neutral-800, 0.95) 70%);
  border: 1px solid rgba($brand-gold, 0.3);
  border-radius: $radius-lg;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__icon {
    font-size: 1.8rem;
  }

  &__name {
    font-weight: 700;
    color: $brand-gold;
    margin: 0;
    font-size: 0.95rem;
  }

  &__ends {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin: 0;
  }

  &__badge {
    background: rgba($brand-gold, 0.15);
    color: $brand-gold;
    border: 1px solid rgba($brand-gold, 0.3);
    font-size: 0.7rem;
    padding: $space-1 $space-3;
    border-radius: $radius-pill;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------
.c-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-4;
  border-radius: $radius-pill;
  border: 1.5px solid $neutral-700;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all $dur-fast $ease-out;

  &:hover {
    border-color: $brand-primary;
    color: var(--text-primary);
  }

  &--active {
    background: $brand-primary;
    border-color: $brand-primary;
    color: #fff;
  }
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
.c-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($brand-primary, 0.2);
  border-top-color: $brand-primary;
  border-radius: 50%;
  animation: spin $dur-slower linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ---------------------------------------------------------------------------
// Equip toast (global — Teleport to body não é usado aqui, mas precisa do estilo)
// ---------------------------------------------------------------------------
</style>
