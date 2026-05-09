import api from '@/core/api'

// ── Admin ──────────────────────────────────────────────────────────────────

export async function adminUploadBackground(formData) {
  const { data } = await api.post('/admin/backgrounds/upload', formData, {
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
