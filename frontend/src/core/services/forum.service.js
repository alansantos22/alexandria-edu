import api from '../api.js'

export const forumService = {
  /** Lista todas as categorias do fórum */
  async getCategories() {
    const { data } = await api.get('/forum/categories')
    return data
  },

  /** Lista tópicos de uma categoria com paginação */
  async getTopics(categoryId, page = 1) {
    const { data } = await api.get(`/forum/categories/${categoryId}/topics`, {
      params: { page },
    })
    return data
  },

  /** Retorna detalhe de um tópico com posts/respostas */
  async getTopic(topicId, page = 1) {
    const { data } = await api.get(`/forum/topics/${topicId}`, {
      params: { page },
    })
    return data
  },

  /** Cria um novo tópico */
  async createTopic(categoryId, title, content) {
    const { data } = await api.post('/forum/topics', { categoryId, title, content })
    return data
  },

  /** Responde a um tópico existente */
  async createReply(topicId, content) {
    const { data } = await api.post(`/forum/topics/${topicId}/reply`, { content })
    return data
  },
}
