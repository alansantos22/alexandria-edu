import api from '@/core/api'

// ── Admin ──────────────────────────────────────────────────────────────────

export async function adminUploadBackground(formData, queryParams) {
  const url = queryParams 
    ? `/admin/backgrounds/upload?${queryParams}`
    : '/admin/backgrounds/upload'
  
  const { data } = await api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function adminCreatePalette(payload) {
  const { data } = await api.post('/admin/palettes', payload)
  return data
}

export async function adminListItems() {
  const { data } = await api.get('/admin/items')
  return data
}

export async function adminToggleItem(id, active) {
  const { data } = await api.patch(`/admin/items/${id}/toggle`, { active })
  return data
}

export async function adminCreateBuilding(formData, queryParams) {
  const { data } = await api.post('/admin/buildings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: queryParams,
  })
  return data
}

export async function adminListBuildings() {
  const { data } = await api.get('/admin/buildings')
  return data
}

export async function adminToggleBuilding(id, active) {
  const { data } = await api.patch(`/admin/buildings/${id}/toggle`, { active })
  return data
}

export async function adminCreateMaterial(formData, queryParams) {
  const { data } = await api.post('/admin/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: queryParams,
  })
  return data
}

export async function adminUpdateMaterial(id, formData, queryParams) {
  const { data } = await api.patch(`/admin/materials/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: queryParams,
  })
  return data
}

export async function adminListMaterials() {
  const { data } = await api.get('/admin/materials')
  return data
}
