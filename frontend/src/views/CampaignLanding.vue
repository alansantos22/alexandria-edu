<template>
  <div class="campaign-landing">
    <div v-if="loading" class="state">Carregando…</div>
    <template v-else-if="campaign">
      <header :style="bannerStyle">
        <div class="overlay">
          <h1>{{ campaign.name }}</h1>
          <PromoBadge v-if="campaign.badgeText" :text="campaign.badgeText" />
          <p v-if="campaign.description">{{ campaign.description }}</p>
        </div>
      </header>

      <section class="grid">
        <ProductCard
          v-for="p in products"
          :key="p.id"
          :product="p"
          @open="$router.push(`/product/${p.slug}`)"
        />
      </section>
    </template>
    <div v-else class="state">Promoção não encontrada.</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/shared/ProductCard.vue'
import PromoBadge from '../components/shared/PromoBadge.vue'
import { commerceService } from '../core/services/commerce.service.js'

const route = useRoute()
const campaign = ref(null)
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const r = await commerceService.getPromo(route.params.slug)
    campaign.value = r.campaign
    products.value = r.products
  } catch {}
  finally { loading.value = false }
})

const bannerStyle = computed(() => ({
  backgroundImage: campaign.value?.bannerUrl ? `url(${campaign.value.bannerUrl})` : null,
}))
</script>

<style lang="scss" scoped>
.campaign-landing {
  max-width: 1200px; margin: 0 auto; padding: 0 0 40px;
  .state { text-align: center; padding: 60px 0; color: #888; }
  header { background: linear-gradient(135deg, #ff5e62, #ff9966); background-size: cover; color: white; padding: 60px 24px; text-align: center; position: relative;
    .overlay { max-width: 700px; margin: 0 auto;
      h1 { margin: 0 0 12px; font-size: 2.2rem; }
      p { font-size: 1.1rem; opacity: 0.95; }
    }
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 28px 24px; }
}
</style>
