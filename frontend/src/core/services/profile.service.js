import api from '@/core/api'

/**
 * Busca o perfil público de um usuário pelo username.
 */
export async function getProfile(username) {
  const { data } = await api.get(`/users/${encodeURIComponent(username)}/profile`)
  return data
}

/**
 * Atualiza a bio do perfil do usuário autenticado.
 * @param {string|null} bio
 */
export async function updateBio(bio) {
  const { data } = await api.patch('/users/me/bio', { bio })
  return data
}
