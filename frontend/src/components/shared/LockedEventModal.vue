<template>
  <div v-if="open" class="locked-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="x" @click="$emit('close')">×</button>
      <h2>🔒 Deseja ver essa aula?</h2>
      <p class="title">{{ event.title }}</p>
      <p class="theme" v-if="event.theme">{{ event.theme }}</p>
      <p class="when">{{ fmt(event.startsAt) }} · {{ event.durationMin }} min</p>

      <div v-if="loadingProduct" class="loading">Carregando…</div>

      <div v-else-if="product" class="product-block">
        <h3>{{ product.name }}</h3>
        <PriceTag :pricing="product.pricing" />
        <p v-if="product.shortDescription" class="desc">{{ product.shortDescription }}</p>
        <div class="actions">
          <button @click="$router.push(`/product/${product.slug}`)">Ver detalhes</button>
          <button class="primary" @click="$router.push(`/checkout/${product.id}`)">Comprar agora</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import PriceTag from './PriceTag.vue'
import { commerceService } from '../../core/services/commerce.service.js'

const props = defineProps({
  open: Boolean,
  event: { type: Object, default: () => ({}) },
})
defineEmits(['close'])

const product = ref(null)
const loadingProduct = ref(false)

watch(() => [props.open, props.event?.productSlug], async ([isOpen, slug]) => {
  if (!isOpen || !slug) return
  loadingProduct.value = true
  try {
    product.value = await commerceService.getProduct(slug)
  } finally {
    loadingProduct.value = false
  }
}, { immediate: true })

function fmt(d) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style lang="scss" scoped>
.locked-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  .modal {
    background: white; border-radius: 14px; padding: 28px 32px;
    width: min(480px, 92vw); position: relative;
    .x { position: absolute; top: 10px; right: 14px; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #888; }
    h2 { margin: 0 0 12px; }
    .title { font-weight: 600; margin: 4px 0; }
    .theme { color: #666; margin: 0 0 4px; }
    .when { color: #888; font-size: 0.9rem; margin: 0 0 18px; }
    .product-block {
      border-top: 1px solid #eee;
      padding-top: 18px;
      h3 { margin: 0 0 10px; }
      .desc { color: #555; margin: 12px 0; font-size: 0.92rem; }
      .actions { display: flex; gap: 10px; margin-top: 18px;
        button { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #2c7be5; background: white; color: #2c7be5; cursor: pointer; font-weight: 600;
          &.primary { background: #2c7be5; color: white; }
        }
      }
    }
    .loading { text-align: center; padding: 20px; color: #999; }
  }
}
</style>
