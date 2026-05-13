<template>
  <div class="course-checkout">
    <h1>Finalizar compra</h1>

    <div v-if="loading" class="state">Carregando…</div>
    <div v-else-if="!product" class="state">Produto não encontrado.</div>

    <div v-else class="grid">
      <section class="summary">
        <h2>{{ product.name }}</h2>
        <PriceTag :pricing="product.pricing" />
        <p class="desc">{{ product.shortDescription }}</p>
      </section>

      <section class="form">
        <div class="row">
          <label>Cupom (opcional)</label>
          <div class="cupom">
            <input v-model="voucherCode" placeholder="ABCD-1234" />
            <button @click="refreshQuote">Aplicar</button>
          </div>
        </div>

        <CoinsSlider
          v-if="quote && product.pricing.allowCoins"
          :quote="quote"
          :balance="coinBalance"
          v-model="coinsToUse"
          @update:modelValue="refreshQuote"
        />

        <div v-if="quote" class="totals">
          <div class="line"><span>Preço</span><span>R$ {{ fmt(quote.listPriceBrl) }}</span></div>
          <div v-if="quote.discountBrl > 0" class="line discount">
            <span>Desconto ({{ quote.voucherCode ? 'cupom' : 'campanha' }})</span>
            <span>− R$ {{ fmt(quote.discountBrl) }}</span>
          </div>
          <div v-if="quote.coinsToUse > 0" class="line discount">
            <span>Moedas ({{ quote.coinsToUse }})</span>
            <span>− R$ {{ fmt(quote.coinsValueBrl) }}</span>
          </div>
          <div class="line total"><span>Total</span><span>R$ {{ fmt(quote.brlToPay) }}</span></div>
        </div>

        <div v-if="status === 'requires_payment'" id="stripe-card-element" class="stripe-element" />

        <div class="actions">
          <button
            class="primary"
            :disabled="processing"
            @click="processing ? null : (status === 'requires_payment' ? confirmStripe() : startCheckout())"
          >
            {{ buttonLabel }}
          </button>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PriceTag from '../components/shared/PriceTag.vue'
import CoinsSlider from '../components/shared/CoinsSlider.vue'
import { commerceService } from '../core/services/commerce.service.js'
import { economyService } from '../core/services/economy.service.js'
import { loadStripe } from '@stripe/stripe-js'

const route = useRoute()
const router = useRouter()
const product = ref(null)
const quote = ref(null)
const loading = ref(true)
const voucherCode = ref('')
const coinsToUse = ref(0)
const coinBalance = ref(0)
const status = ref('idle')
const processing = ref(false)
const errorMsg = ref('')
let stripe = null
let elements = null
let cardElement = null
let clientSecret = null
let orderId = null

onMounted(async () => {
  try {
    const products = await commerceService.adminListProducts?.().catch?.(() => null)
    // Como aluno, usa catálogo público pelo slug. Mas aqui temos só productId no route.
    // Usamos getProduct via slug se foi passado; se o param parece UUID, fazemos um workaround buscando pelo catálogo todo.
    const id = route.params.productId
    const cat = await commerceService.listCatalog()
    product.value = cat.find(p => p.id === id) || cat.find(p => p.slug === id)
    if (!product.value) throw new Error('Produto não encontrado')

    const bal = await economyService.getBalance()
    coinBalance.value = bal.balance ?? bal

    await refreshQuote()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
})

async function refreshQuote() {
  if (!product.value) return
  try {
    quote.value = await commerceService.quote({
      productId: product.value.id,
      cohortId: route.query.cohort || null,
      voucherCode: voucherCode.value || null,
      coinsToUse: coinsToUse.value,
    })
    errorMsg.value = ''
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message
  }
}

const buttonLabel = computed(() => {
  if (processing.value) return 'Processando…'
  if (status.value === 'requires_payment') return 'Confirmar pagamento'
  if (!quote.value) return 'Comprar'
  return quote.value.brlToPay <= 0.005 ? 'Liberar agora' : 'Pagar com cartão'
})

async function startCheckout() {
  if (!quote.value) return
  processing.value = true
  errorMsg.value = ''
  try {
    const r = await commerceService.start({
      productId: product.value.id,
      cohortId: route.query.cohort || null,
      voucherCode: voucherCode.value || null,
      coinsToUse: coinsToUse.value,
    })
    orderId = r.orderId
    if (!r.requiresStripe) {
      router.push('/me/enrollments?fresh=' + r.orderId)
      return
    }
    clientSecret = r.clientSecret
    status.value = 'requires_payment'

    if (!stripe) {
      const pk = import.meta.env.VITE_STRIPE_PUBLIC_KEY
      if (!pk) throw new Error('VITE_STRIPE_PUBLIC_KEY não configurada')
      stripe = await loadStripe(pk)
    }
    elements = stripe.elements({ clientSecret })
    setTimeout(() => {
      cardElement = elements.create('payment')
      cardElement.mount('#stripe-card-element')
    }, 50)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message
  } finally {
    processing.value = false
  }
}

async function confirmStripe() {
  processing.value = true
  errorMsg.value = ''
  try {
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/me/enrollments?fresh=' + orderId },
    })
    if (error) throw error
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    processing.value = false
  }
}

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style lang="scss" scoped>
.course-checkout { max-width: 980px; margin: 0 auto; padding: 32px 24px;
  h1 { margin: 0 0 24px; }
  .state { text-align: center; padding: 60px; color: #888; }
  .grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px;
    @media (max-width: 720px) { grid-template-columns: 1fr; }
  }
  .summary { background: #f7f9fc; padding: 24px; border-radius: 12px;
    h2 { margin: 0 0 10px; }
    .desc { color: #555; margin-top: 14px; }
  }
  .form .row { margin-bottom: 18px;
    label { display: block; font-weight: 600; margin-bottom: 6px; }
    .cupom { display: flex; gap: 8px;
      input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
      button { padding: 0 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
    }
  }
  .totals { margin: 18px 0; padding: 14px; border: 1px solid #eee; border-radius: 10px;
    .line { display: flex; justify-content: space-between; padding: 4px 0;
      &.discount { color: #1aa260; }
      &.total { border-top: 1px solid #eee; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 1.1rem; }
    }
  }
  .stripe-element { min-height: 80px; margin: 14px 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
  .actions .primary { width: 100%; padding: 14px; background: #2c7be5; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
  .error { color: #d33; margin-top: 10px; }
}
</style>
