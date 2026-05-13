<template>
  <span class="price-tag" :class="{ 'has-discount': hasDiscount, 'is-free': pricing.isFree }">
    <span v-if="pricing.isFree" class="free">Grátis</span>
    <template v-else>
      <span v-if="hasDiscount" class="list">R$ {{ fmt(pricing.listPriceBrl) }}</span>
      <span class="effective">R$ {{ fmt(pricing.effectivePriceBrl) }}</span>
      <span v-if="pricing.badge" class="badge">{{ pricing.badge }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pricing: { type: Object, required: true },
})

const hasDiscount = computed(() =>
  props.pricing.discountBrl > 0 && !props.pricing.isFree
)

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style lang="scss" scoped>
.price-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  .list {
    text-decoration: line-through;
    color: #888;
    font-size: 0.85em;
    font-weight: 400;
  }
  .effective {
    color: #2c7be5;
    font-size: 1.1em;
  }
  .free {
    color: #1aa260;
    font-weight: 700;
  }
  .badge {
    background: #ff7043;
    color: white;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 0.75em;
    letter-spacing: 0.5px;
  }
}
</style>
