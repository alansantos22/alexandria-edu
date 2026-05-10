import api from '@/core/api.js'

export const cityService = {
  // ── City ─────────────────────────────────────────────────
  getMyCity:        ()                          => api.get('/city/me').then(r => r.data),
  getCity:          (userId)                    => api.get(`/city/${userId}`).then(r => r.data),
  upsertChunk:      (chunkX, chunkZ, dataHex)   => api.patch('/city/chunk', { chunkX, chunkZ, dataHex }).then(r => r.data),

  // ── Palette & Buildings ───────────────────────────────────
getPalette:       ()                          => api.get('/city/palette').then(r => r.data),
  /** Returns only buildings the authenticated user has unlocked + all free ones */
  getMyPalette:     ()                          => api.get('/city/palette/my').then(r => r.data),
  getBuildings:     ()                          => api.get('/city/buildings').then(r => r.data),
  placeBuilding:    (dto)                       => api.post('/city/buildings', dto).then(r => r.data),
  removeBuilding:   (buildingId)                => api.delete(`/city/buildings/${buildingId}`).then(r => r.data),

  /** Retorna tiles de terreno possuídos pelo usuário autenticado */
  getLandOwned:     (userId)                    => api.get(`/land/${userId}`).then(r => r.data.owned ?? []),

  // ── Vehicles ─────────────────────────────────────────────
  getVehicleCatalog: ()                         => api.get('/city/vehicles/catalog').then(r => r.data),
  getVehicles:      ()                          => api.get('/city/vehicles').then(r => r.data),
  purchaseVehicle:  (vehicleType)               => api.post('/city/vehicles/purchase', { vehicleType }).then(r => r.data),
  activateVehicle:  (vehicleId)                 => api.patch(`/city/vehicles/${vehicleId}/activate`).then(r => r.data),

  // ── World ─────────────────────────────────────────────────
  getWorldMap:      ()                          => api.get('/city/world-map').then(r => r.data),
}
