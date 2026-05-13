import api from '../api.js'

export const liveClassService = {
  /** Metadata da aula (sem link externo) */
  get(id) {
    return api.get(`/live-classes/${id}`).then(r => r.data)
  },

  /** Solicita join token + URL */
  requestJoinToken(id) {
    return api.post(`/live-classes/${id}/join-token`).then(r => r.data)
  },

  // Admin
  adminCreate(body)         { return api.post('/admin/live-classes', body).then(r => r.data) },
  adminUpdate(id, body)     { return api.patch(`/admin/live-classes/${id}`, body).then(r => r.data) },
  adminDelete(id)           { return api.delete(`/admin/live-classes/${id}`).then(r => r.data) },
  adminSetRecording(id, url){ return api.post(`/admin/live-classes/${id}/recording`, { url }).then(r => r.data) },
}
