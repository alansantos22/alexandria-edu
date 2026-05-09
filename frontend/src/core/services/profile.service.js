import api from '@/core/api'

/**
 * Busca o perfil público de um usuário pelo username.
 * Requer autenticação (token JWT no header via interceptor do api.js).
 *
 * @param {string} username - ex: 'demo'
 * @returns {Promise<ProfileResponse>}
 */
export async function getProfile(username) {
  const { data } = await api.get(`/users/${encodeURIComponent(username)}/profile`)
  return data
}
