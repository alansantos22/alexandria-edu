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
      const [paletteData, buildingsData] = await Promise.all([
        cityService.getPalette(),
        cityService.getBuildings(),
      ])
      palette.value   = paletteData
      buildings.value = buildingsData
      ccuUsed.value   = cityMeta?.ccuUsed   ?? 0
      ccuLimit.value  = cityMeta?.ccuLimit  ?? 2000
      _buildOccupancy()

      renderer.enterBuildMode(buildingsData)
      renderer.setBuildCallbacks(_onHover, _onClick)

      isActive.value = true
    } finally {
      loading.value = false
    }
  }

  function deactivate() {
    renderer.exitBuildMode()
    selectedItem.value = null
    ghostValid.value   = false
    isActive.value     = false
  }

  // ── Item selection ───────────────────────────────────────────────

  function selectItem(item) {
    selectedItem.value = item
    renderer.setGhostItem(item)
  }

  function clearSelection() {
    selectedItem.value = null
    ghostValid.value   = false
    renderer.clearGhost()
  }

  // ── Hover (ghost movement) ────────────────────────────────────────

  function _onHover(clientX, clientY) {
    if (!selectedItem.value) return
    const cell = renderer.raycastToGrid(clientX, clientY)
    if (!cell) {
      renderer.clearGhost()
      ghostValid.value = false
      return
    }
    const { gridX, gridZ } = cell
    const { sizeX, sizeZ, ccuCost } = selectedItem.value
    const valid = (
      _isFootprintFree(gridX, gridZ, sizeX, sizeZ) &&
      (ccuUsed.value + ccuCost) <= ccuLimit.value
    )
    ghostValid.value = valid
    renderer.moveGhost(gridX, gridZ, valid)
  }

  // ── Click (place building) ────────────────────────────────────────

  async function _onClick(e) {
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

    // Optimistic update
    const tempId = `tmp-${Date.now()}`
    const optimistic = {
      id: tempId,
      cityUserId: 'me',
      paletteItemId: item.id,
      paletteItem: item,
      gridX, gridZ, rotation: 0,
    }
    buildings.value.push(optimistic)
    ccuUsed.value += ccuCost
    _markOccupied(gridX, gridZ, sizeX, sizeZ)
    renderer.addPlacedBuilding(optimistic)
    renderer.clearGhost()

    try {
      const placed = await cityService.placeBuilding({
        paletteItemId: item.id,
        gridX,
        gridZ,
        rotation: 0,
      })
      // Swap temp → real id
      const idx = buildings.value.findIndex(b => b.id === tempId)
      if (idx !== -1) buildings.value[idx] = placed
      renderer.replacePlacedBuilding(tempId, placed.id)
    } catch {
      // Rollback
      buildings.value = buildings.value.filter(b => b.id !== tempId)
      ccuUsed.value -= ccuCost
      _unmarkOccupied(gridX, gridZ, sizeX, sizeZ)
      renderer.removePlacedBuilding(tempId)
    }

    // Re-arm ghost so player can continue placing same item
    renderer.setGhostItem(item)
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
    ghostValid,
    BUILD_CATEGORIES,
    activate, deactivate,
    selectItem, clearSelection,
    removeBuilding,
  }
}
