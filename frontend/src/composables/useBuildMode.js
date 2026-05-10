import { ref, computed } from 'vue'
import { cityService } from '@/core/services/city.service.js'

export const BUILD_CATEGORIES = [
  { id: 'residential', icon: '🏠', label: 'Residencial' },
  { id: 'commercial',  icon: '🏢', label: 'Comercial' },
  { id: 'nature',      icon: '🌳', label: 'Natureza' },
  { id: 'road',        icon: '🛣️',  label: 'Estradas' },
  { id: 'decoration',  icon: '🎭', label: 'Decoração' },
]

/**
 * Manages Build Mode state machine.
 * @param {Object} renderer — API returned by useCityRenderer
 */
export function useBuildMode(renderer) {
  const isActive       = ref(false)
  const loading        = ref(false)
  const palette        = ref([])
  const buildings      = ref([])
  const selectedItem   = ref(null)
  const activeCategory = ref('residential')
  const ccuUsed        = ref(0)
  const ccuLimit       = ref(2000)
  const ghostValid     = ref(false)
  const deleteMode     = ref(false)
  const ghostRotation  = ref(0)   // radians, 45° steps

  // Occupied cells: Set<"gridX,gridZ">
  const occupied = new Set()

  const categoryItems = computed(() =>
    palette.value.filter(i => i.category === activeCategory.value),
  )

  const ccuPercent = computed(() =>
    Math.min(100, Math.round((ccuUsed.value / ccuLimit.value) * 100)),
  )

  // ── Occupancy helpers ────────────────────────────────────────────

  function _buildOccupancy() {
    occupied.clear()
    for (const b of buildings.value) {
      _markOccupied(b.gridX, b.gridZ, b.paletteItem.sizeX, b.paletteItem.sizeZ)
    }
  }

  function _markOccupied(gx, gz, sx, sz) {
    for (let dx = 0; dx < sx; dx++) {
      for (let dz = 0; dz < sz; dz++) {
        occupied.add(`${gx + dx},${gz + dz}`)
      }
    }
  }

  function _unmarkOccupied(gx, gz, sx, sz) {
    for (let dx = 0; dx < sx; dx++) {
      for (let dz = 0; dz < sz; dz++) {
        occupied.delete(`${gx + dx},${gz + dz}`)
      }
    }
  }

  function _isFootprintFree(gx, gz, sx, sz) {
    for (let dx = 0; dx < sx; dx++) {
      for (let dz = 0; dz < sz; dz++) {
        if (occupied.has(`${gx + dx},${gz + dz}`)) return false
      }
    }
    return true
  }

  // ── Activate / deactivate ────────────────────────────────────────

  async function activate(cityMeta) {
    loading.value = true
    try {
      const userId = cityMeta?.userId
      const [paletteData, buildingsData, ownedLand] = await Promise.all([
        cityService.getMyPalette(),
        cityService.getBuildings(),
        userId ? cityService.getLandOwned(userId) : Promise.resolve([]),
      ])
      // Only show buildings that have a 3D model (buildingAsset) associated
      // Also filter paid items where the user has no copies left
      palette.value   = paletteData.filter(item =>
        item.buildingAsset != null &&
        (item.priceCoins === 0 || (item.availableQty ?? 0) > 0)
      )
      buildings.value = buildingsData
      // Compute ccuUsed from actual placed buildings (avoids stale meta on re-entry)
      ccuUsed.value   = buildingsData.reduce((sum, b) => sum + (b.paletteItem?.ccuCost ?? 0), 0)
      ccuLimit.value  = cityMeta?.ccuLimit  ?? 2000
      _buildOccupancy()

      renderer.setOwnedTiles(ownedLand)
      renderer.enterBuildMode(buildingsData)
      renderer.setBuildCallbacks(_onHover, _onClick)
      window.addEventListener('keydown', _onKeyDown)

      isActive.value = true
    } finally {
      loading.value = false
    }
  }

  function deactivate() {
    renderer.exitBuildMode()
    selectedItem.value = null
    ghostValid.value   = false
    deleteMode.value   = false
    ghostRotation.value = 0
    isActive.value     = false
    window.removeEventListener('keydown', _onKeyDown)
  }

  // ── Palette sync ──────────────────────────────────────────────────

  async function _refreshPalette() {
    try {
      const paletteData = await cityService.getMyPalette()
      palette.value = paletteData.filter(item =>
        item.buildingAsset != null &&
        (item.priceCoins === 0 || (item.availableQty ?? 0) > 0)
      )
      // Clear selection if selected item is no longer available
      if (selectedItem.value) {
        const still = palette.value.find(p => p.id === selectedItem.value.id)
        if (!still) clearSelection()
        else selectedItem.value = still   // update ref to server-synced object
      }
    } catch { /* silent — stale state is better than crashing */ }
  }

  // ── Rotation (Q / E keys) ─────────────────────────────────────────

  const _ROTATE_STEP = Math.PI / 2   // 90° per press (matches backend accepted values: 0, 90, 180, 270)

  function rotateGhost(delta) {
    const next = ((ghostRotation.value + delta) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    ghostRotation.value = next
    renderer.setGhostRotation(next)
  }

  function _onKeyDown(e) {
    if (!isActive.value || !selectedItem.value) return
    if (e.key === 'q' || e.key === 'Q') rotateGhost(-_ROTATE_STEP)
    if (e.key === 'e' || e.key === 'E') rotateGhost(+_ROTATE_STEP)
  }

  // ── Delete mode ────────────────────────────────────────────

  function toggleDeleteMode() {
    deleteMode.value = !deleteMode.value
    if (deleteMode.value) {
      clearSelection()  // exit placement mode when entering delete mode
    }
  }

  // ── Item selection ───────────────────────────────────────────────

  function selectItem(item) {
    selectedItem.value = item
    ghostRotation.value = 0
    renderer.setGhostItem(item)
  }

  function clearSelection() {
    selectedItem.value = null
    ghostValid.value   = false
    ghostRotation.value = 0
    renderer.clearGhost()
  }

  // ── Hover (ghost movement) ────────────────────────────────────────

  function _onHover(clientX, clientY) {
    // In delete mode: suppress ghost, let user hover to identify buildings
    if (deleteMode.value) {
      renderer.clearGhost()
      return
    }
    if (!selectedItem.value) return
    const cell = renderer.raycastToGrid(clientX, clientY)
    if (!cell) {
      renderer.clearGhost()
      ghostValid.value = false
      return
    }
    const { gridX, gridZ } = cell
    const { sizeX, sizeZ, ccuCost, priceCoins, availableQty } = selectedItem.value
    const hasQty = priceCoins <= 0 || (availableQty ?? 0) > 0
    const valid = (
      hasQty &&
      _isFootprintFree(gridX, gridZ, sizeX, sizeZ) &&
      (ccuUsed.value + ccuCost) <= ccuLimit.value
    )
    ghostValid.value = valid
    renderer.moveGhost(gridX, gridZ, valid)
  }

  async function _onClick(e) {
    // ── Delete mode ───────────────────────────────────────────
    if (deleteMode.value) {
      const buildingId = renderer.pickPlacedBuilding(e.clientX, e.clientY)
      if (!buildingId) return
      const building = buildings.value.find(b => b.id === buildingId)
      if (building) await removeBuilding(building)
      return
    }

    // ── Placement mode ───────────────────────────────────────
    if (!selectedItem.value) return
    const cell = renderer.raycastToGrid(e.clientX, e.clientY)
    if (!cell) return

    const { gridX, gridZ } = cell
    const item = selectedItem.value
    const { sizeX, sizeZ, ccuCost } = item

    const valid = (
      _isFootprintFree(gridX, gridZ, sizeX, sizeZ) &&
      (ccuUsed.value + ccuCost) <= ccuLimit.value
    )
    if (!valid) return

    // Quantity guard (checked before optimistic update so rapid clicks can't bypass it)
    if (item.priceCoins > 0) {
      if ((item.availableQty ?? 0) <= 0) return
    }

    // Optimistic update — decrement qty immediately to block next rapid click
    if (item.priceCoins > 0) {
      item.availableQty = (item.availableQty ?? 1) - 1
    }

    const tempId = `tmp-${Date.now()}`
    // Convert radians to degrees for storage/API (backend expects 0|90|180|270)
    const rotationDeg = Math.round(ghostRotation.value * 180 / Math.PI) % 360
    const optimistic = {
      id: tempId,
      cityUserId: 'me',
      paletteItemId: item.id,
      paletteItem: item,
      gridX, gridZ, rotation: rotationDeg,
    }
    buildings.value.push(optimistic)
    ccuUsed.value += ccuCost
    _markOccupied(gridX, gridZ, sizeX, sizeZ)
    renderer.addPlacedBuilding(optimistic)

    // Hide palette item when qty hits 0
    if (item.priceCoins > 0 && item.availableQty <= 0) {
      palette.value = palette.value.filter(p => p.id !== item.id)
      clearSelection()
    } else {
      renderer.clearGhost()
    }

    try {
      const placed = await cityService.placeBuilding({
        paletteItemId: item.id,
        gridX,
        gridZ,
        rotation: rotationDeg,
      })
      // Swap temp → real id
      const idx = buildings.value.findIndex(b => b.id === tempId)
      if (idx !== -1) buildings.value[idx] = placed
      renderer.replacePlacedBuilding(tempId, placed.id)
      // Always sync palette qty from server after a successful placement
      await _refreshPalette()
    } catch {
      // Rollback optimistic 3D/state changes
      buildings.value = buildings.value.filter(b => b.id !== tempId)
      ccuUsed.value -= ccuCost
      _unmarkOccupied(gridX, gridZ, sizeX, sizeZ)
      renderer.removePlacedBuilding(tempId)
      // Re-sync palette from server so qty is always authoritative
      await _refreshPalette()
    }

    // Re-arm ghost if item still available after server sync
    if (selectedItem.value) renderer.setGhostItem(selectedItem.value)
  }

  // ── Remove building ───────────────────────────────────────────────

  async function removeBuilding(building) {
    const { id, paletteItem, gridX, gridZ } = building
    buildings.value = buildings.value.filter(b => b.id !== id)
    ccuUsed.value -= paletteItem.ccuCost
    _unmarkOccupied(gridX, gridZ, paletteItem.sizeX, paletteItem.sizeZ)
    renderer.removePlacedBuilding(id)

    try {
      await cityService.removeBuilding(id)
      // Re-sync palette from server — the most reliable way to update qty
      await _refreshPalette()
    } catch {
      buildings.value.push(building)
      ccuUsed.value += paletteItem.ccuCost
      _markOccupied(gridX, gridZ, paletteItem.sizeX, paletteItem.sizeZ)
      renderer.addPlacedBuilding(building)
    }
  }

  return {
    isActive, loading,
    palette, buildings, categoryItems,
    selectedItem, activeCategory,
    ccuUsed, ccuLimit, ccuPercent,
    ghostValid, ghostRotation,
    BUILD_CATEGORIES,
    activate, deactivate,
    selectItem, clearSelection,
    removeBuilding,
    deleteMode, toggleDeleteMode,
    rotateGhost,
  }
}
