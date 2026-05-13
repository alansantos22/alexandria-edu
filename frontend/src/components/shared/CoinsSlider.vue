<template>
  <div class="coins-slider" v-if="quote">
    <label>Usar moedas (máx R$ {{ fmt(quote.maxCoinsValueBrl) }})</label>
    <div class="row">
      <input
        type="range"
        :min="0"
        :max="maxCoins"
        :step="1"
        v-model.number="coinsLocal"
        @input="onChange"
      />
      <input
        type="number"
        :min="0"
        :max="maxCoins"
        v-model.number="coinsLocal"
        @change="onChange"
      />
    </div>
    <p class="info">
      = R$ {{ fmt(coinsValue) }} &nbsp;|&nbsp; Saldo: {{ balance }} moedas
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  quote: { type: Object, required: true },
  balance: { type: Number, default: 0 },
  modelValue: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue'])

const coinsLocal = ref(props.modelValue)

watch(() => props.modelValue, v => { coinsLocal.value = v })

const maxCoins = computed(() => {
  if (!props.quote) return 0
  const rate = props.quote.coinsRate || 1
  const byValue = Math.floor(props.quote.maxCoinsValueBrl * rate)
  return Math.max(0, Math.min(byValue, props.balance || 0))
})

const coinsValue = computed(() => {
  if (!props.quote || !coinsLocal.value) return 0
  return coinsLocal.value / (props.quote.coinsRate || 1)
})

function onChange() {
  if (coinsLocal.value < 0) coinsLocal.value = 0
  if (coinsLocal.value > maxCoins.value) coinsLocal.value = maxCoins.value
  emit('update:modelValue', coinsLocal.value)
}

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style lang="scss" scoped>
.coins-slider {
  background: #f7f9fc;
  padding: 14px;
  border-radius: 10px;
  label { display: block; font-weight: 600; margin-bottom: 8px; }
  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    input[type="range"] { flex: 1; }
    input[type="number"] { width: 110px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; }
  }
  .info { margin: 8px 0 0; font-size: 0.85rem; color: #666; }
}
</style>
