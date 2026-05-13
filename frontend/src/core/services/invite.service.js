import api from '../api.js'

export const inviteService = {
  /** Verifica convite sem resgatar (público) */
  preview(code) {
    return api.get(`/invites/${encodeURIComponent(code)}/preview`).then(r => r.data)
  },

  /** Aluno resgata convite de acesso */
  redeem(code) {
    return api.post(`/invites/${encodeURIComponent(code)}/redeem`).then(r => r.data)
  },

  // Admin
  adminList()           { return api.get('/admin/invites').then(r => r.data) },
  adminCreate(body)     { return api.post('/admin/invites', body).then(r => r.data) },
  adminGet(id)          { return api.get(`/admin/invites/${id}`).then(r => r.data) },
  adminListUses(id)     { return api.get(`/admin/invites/${id}/uses`).then(r => r.data) },
}
