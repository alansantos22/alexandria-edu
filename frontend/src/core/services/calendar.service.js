import api from '../api.js'

export const calendarService = {
  /** Lista eventos do aluno (live classes com hasAccess) */
  listMyCalendar(from, to) {
    return api.get('/calendar', { params: { from, to } }).then(r => r.data)
  },

  /** Admin: lista todos os eventos */
  listAdminCalendar(from, to) {
    return api.get('/admin/calendar', { params: { from, to } }).then(r => r.data)
  },
}
