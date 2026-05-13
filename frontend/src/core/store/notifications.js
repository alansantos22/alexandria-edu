import { reactive } from 'vue'
import { notificationService } from '../services/notification.service.js'

export const notificationsStore = reactive({
  items: [],
  unread: 0,
  loading: false,
  _pollHandle: null,

  async refresh() {
    if (!localStorage.getItem('token')) return
    try {
      this.loading = true
      const data = await notificationService.list({ unread: true, limit: 30 })
      this.items = data.items || data
      this.unread = (this.items || []).filter(n => !n.readAt).length
    } finally {
      this.loading = false
    }
  },

  async markRead(id) {
    await notificationService.markRead(id)
    await this.refresh()
  },

  async markAllRead() {
    await notificationService.markAllRead()
    await this.refresh()
  },

  startPolling(intervalMs = 60000) {
    this.refresh()
    if (this._pollHandle) return
    this._pollHandle = setInterval(() => this.refresh(), intervalMs)
  },

  stopPolling() {
    if (this._pollHandle) {
      clearInterval(this._pollHandle)
      this._pollHandle = null
    }
  },
})
