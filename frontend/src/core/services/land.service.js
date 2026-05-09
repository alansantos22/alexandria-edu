import api from '@/core/api.js'

export const landService = {
  /** Retorna tiles possuídos + disponíveis de qualquer cidade (público) */
  getLand: (cityUserId) =>
    api.get(`/land/${cityUserId}`).then(r => r.data),

  /** Compra um tile para a cidade do usuário autenticado */
  purchaseTile: (tileX, tileZ) =>
    api.post('/land/purchase', { tileX, tileZ }).then(r => r.data),
}
