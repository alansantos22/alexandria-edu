<template>
  <div class="catalog">
    <header>
      <h1>📚 Catálogo</h1>
      <p>Cursos, webinars e pacotes de aulas ao vivo.</p>
    </header>
    <div v-if="loading" class="state">Carregando…</div>
    <div v-else-if="!products.length" class="state">Nenhum produto disponível.</div>
    <div v-else class="grid">
      <ProductCard
        v-for="p in products"
        :key="p.id"
        :product="p"
        @open="goTo(p)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProductCard from '../components/shared/ProductCard.vue'
import { commerceService } from '../core/services/commerce.service.js'

const router = useRouter()
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    products.value = await commerceService.listCatalog()
  } finally {
    loading.value = false
  }
})

function goTo(p) {
  router.push(`/product/${p.slug}`)
}
</script>

<style lang="scss" scoped>
.catalog { max-width: 1200px; margin: 0 auto; padding: 24px;
  header { margin-bottom: 24px; h1 { margin: 0 0 4px; } p { color: #555; margin: 0; } }
  .state { text-align: center; padding: 60px 0; color: #888; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
}
</style>
