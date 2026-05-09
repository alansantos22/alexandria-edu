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

  /** Equipa um item (aplica ao slot correspondente) */
  equipItem(itemId) {
    return api.put('/marketplace/equip', { itemId }).then(r => r.data)
  },

  /** Perfil público de um usuário */
  getPublicProfile(userId) {
    return api.get(`/marketplace/profile/${userId}`).then(r => r.data)
  },
}
