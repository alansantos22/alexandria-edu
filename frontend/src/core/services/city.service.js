import api from '@/core/api.js'

export const cityService = {
  getMyCity:       ()                         => api.get('/city/me').then(r => r.data),
  getCity:         (userId)                   => api.get(`/city/${userId}`).then(r => r.data),
  upsertChunk:     (chunkX, chunkZ, dataHex)  => api.patch('/city/chunk', { chunkX, chunkZ, dataHex }).then(r => r.data),
  getVehicleCatalog: ()                       => api.get('/city/vehicles/catalog').then(r => r.data),
  getVehicles:     ()                         => api.get('/city/vehicles').then(r => r.data),
  purchaseVehicle: (vehicleType)              => api.post('/city/vehicles/purchase', { vehicleType }).then(r => r.data),
  activateVehicle: (vehicleId)               => api.patch(`/city/vehicles/${vehicleId}/activate`).then(r => r.data),
  getWorldMap:     ()                         => api.get('/city/world-map').then(r => r.data),
}
