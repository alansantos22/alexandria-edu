<template>
  <div class="product-card" @click="$emit('open', product)">
    <div class="thumb" :style="{ backgroundImage: product.coverUrl ? `url(${product.coverUrl})` : null }">
      <PromoBadge v-if="product.pricing?.badge" :text="product.pricing.badge" />
    </div>
    <div class="body">
      <h3>{{ product.name }}</h3>
      <p class="kind">{{ kindLabel }}</p>
      <p class="desc" v-if="product.shortDescription">{{ product.shortDescription }}</p>
      <PriceTag :pricing="product.pricing" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PriceTag from './PriceTag.vue'
import PromoBadge from './PromoBadge.vue'

const props = defineProps({
  product: { type: Object, required: true },
})

const kindLabel = computed(() => ({
  course: 'Curso',
  live_pack: 'Pacote de Lives',
  webinar: 'Webinar',
  bundle: 'Pacote',
}[props.product.kind] || props.product.kind))
</script>

<style lang="scss" scoped>
.product-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.18s;
  &:hover { transform: translateY(-3px); box-shadow: 0 6px 22px rgba(0, 0, 0, 0.12); }
  .thumb {
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #667eea, #764ba2);
    background-size: cover;
    background-position: center;
    position: relative;
    .promo-badge { position: absolute; top: 10px; left: 10px; }
  }
  .body {
    padding: 14px 16px;
    h3 { margin: 0 0 4px; font-size: 1.05rem; color: #2c3e50; }
    .kind { margin: 0 0 8px; font-size: 0.75rem; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .desc { font-size: 0.9rem; color: #555; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  }
}
</style>
