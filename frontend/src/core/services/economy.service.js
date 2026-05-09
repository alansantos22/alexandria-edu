import api from '../api.js'

export const economyService = {
  /** Saldo atual do usuário autenticado */
  async getBalance() {
    const { data } = await api.get('/economy/balance')
    return data // { balance: number }
  },

  /** Histórico de transações com paginação */
  async getHistory(page = 1, limit = 20) {
    const { data } = await api.get('/economy/history', { params: { page, limit } })
    return data // { transactions, total, page, totalPages }
  },

  /** Simula cashback de compra de curso */
  async simulatePurchaseCashback() {
    const { data } = await api.post('/economy/simulate-purchase')
    return data // { message, coinsEarned, balance }
  },
}
