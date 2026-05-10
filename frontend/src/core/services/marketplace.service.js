import api from '../api.js'

export const marketplaceService = {
  /** Lista itens ativos com campo `owned` e `canAfford` por usuário */
  listItems() {
    return api.get('/marketplace/items').then(r => r.data)
  },

  /** Compra um item pelo id */
  buyItem(itemId) {
    return api.post(`/marketplace/items/${itemId}/buy`).then(r => r.data)
  },

  /** Inventário do usuário com detalhes de cada item e perfil equipado */
  getInventory() {
    return api.get('/marketplace/inventory').then(r => r.data)
  },

  /**
   * Equipa um item ou desequipa um slot.
   * @param {string|null} itemId - null para desequipar
   * @param {'avatar'|'wallpaper'|'badge'|'frame'} [type] - obrigatório quando itemId é null
   */
  equipItem(itemId, type) {
    return api.put('/marketplace/equip', { itemId: itemId ?? null, type }).then(r => r.data)
  },

  /** Perfil público de um usuário */
  getPublicProfile(userId) {
    return api.get(`/marketplace/profile/${userId}`).then(r => r.data)
  },

  /** Lista edifícios disponíveis no marketplace com campo `owned` e `canAfford` */
  listBuildings() {
    return api.get('/marketplace/buildings').then(r => r.data)
  },

  /** Compra (desbloqueia) um edifício pelo paletteItemId */
  buyBuilding(paletteItemId) {
    return api.post(`/marketplace/buildings/${paletteItemId}/buy`).then(r => r.data)
  },

  // ── Veículos ─────────────────────────────────────────────────────────────

  /** Lista veículos do catálogo DB com campo `owned` e `canAfford` */
  listVehicles() {
    return api.get('/marketplace/vehicles').then(r => r.data)
  },

  /** Compra um veículo pelo catalogId (equipa automaticamente se for o primeiro) */
  buyVehicle(catalogId) {
    return api.post(`/marketplace/vehicles/${catalogId}/buy`).then(r => r.data)
  },
}
