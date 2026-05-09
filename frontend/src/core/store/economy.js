/**
 * Economy Store — Singleton reativo (Vue 3 sem Pinia)
 * Gerencia saldo de moedas e notificações de ganho globalmente.
 */
import { ref, readonly } from 'vue'
import { economyService } from '../services/economy.service.js'

const balance       = ref(0)
const isLoading     = ref(false)
const notification  = ref(null) // { coins: number, message: string } | null
let   notifTimer    = null

/** Busca saldo do servidor e atualiza estado */
async function fetchBalance() {
  try {
    isLoading.value = true
    const data = await economyService.getBalance()
    balance.value = data.balance
  } catch {
    // silencioso — não quebrar UI por falha de saldo
  } finally {
    isLoading.value = false
  }
}

/**
 * Atualiza saldo localmente após receber resposta de conclusão de aula.
 * Evita chamada extra ao servidor.
 */
function applyReward(coinsEarned, newBalance) {
  if (coinsEarned <= 0) return

  balance.value = newBalance

  // Mostrar notificação por 3 segundos
  clearTimeout(notifTimer)
  notification.value = { coins: coinsEarned, message: `+${coinsEarned} moedas` }
  notifTimer = setTimeout(() => {
    notification.value = null
  }, 3000)
}

function clearNotification() {
  clearTimeout(notifTimer)
  notification.value = null
}

export function useEconomyStore() {
  return {
    balance:      readonly(balance),
    isLoading:    readonly(isLoading),
    notification: readonly(notification),
    fetchBalance,
    applyReward,
    clearNotification,
  }
}
