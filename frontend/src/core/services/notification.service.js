import api from '../api.js'

export const notificationService = {
  list(params) {
    return api.get('/me/notifications', { params }).then(r => r.data)
  },
  getPreferences() {
    return api.get('/me/notifications/preferences').then(r => r.data)
  },
  updatePreferences(body) {
    return api.patch('/me/notifications/preferences', body).then(r => r.data)
  },
  markRead(id) {
    return api.patch(`/me/notifications/${id}/read`).then(r => r.data)
  },
  markAllRead() {
    return api.post('/me/notifications/read-all').then(r => r.data)
  },
}
