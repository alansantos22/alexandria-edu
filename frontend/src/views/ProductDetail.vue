<template>
  <div class="product-detail" v-if="product">
    <header>
      <h1>{{ product.name }}</h1>
      <PromoBadge v-if="product.pricing?.badge" :text="product.pricing.badge" />
    </header>

    <p class="kind">{{ kindLabel }}</p>
    <p class="desc">{{ product.description }}</p>

    <section class="pricing">
      <PriceTag :pricing="product.pricing" />
    </section>

    <section v-if="cohorts.length" class="cohorts">
      <h2>Turmas disponíveis</h2>
      <ul>
        <li v-for="c in cohorts" :key="c.id" :class="{ selected: selectedCohort === c.id }" @click="selectedCohort = c.id">
          <strong>{{ c.name }}</strong>
          <small>{{ fmt(c.startsAt) }} → {{ fmt(c.endsAt) }}</small>
          <small>{{ c.seatsLeft }} vagas restantes</small>
        </li>
      </ul>
    </section>

    <div class="actions">
      <button class="primary" @click="goCheckout">Comprar agora</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PriceTag from '../components/shared/PriceTag.vue'
import PromoBadge from '../components/shared/PromoBadge.vue'
import { commerceService } from '../core/services/commerce.service.js'

const route = useRoute()
const router = useRouter()
const product = ref(null)
const cohorts = ref([])
const selectedCohort = ref(null)

onMounted(async () => {
  product.value = await commerceService.getProduct(route.params.slug)
  try {
    cohorts.value = await commerceService.listCohorts(product.value.id)
    const open = cohorts.value.find(c => c.status === 'open')
    if (open) selectedCohort.value = open.id
  } catch {}
})

const kindLabel = computed(() => ({
  course: 'Curso',
  live_pack: 'Pacote de aulas ao vivo',
  webinar: 'Webinar',
  bundle: 'Pacote completo',
}[product.value?.kind] || ''))

function goCheckout() {
  const q = selectedCohort.value ? `?cohort=${selectedCohort.value}` : ''
  router.push(`/checkout/${product.value.id}${q}`)
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}
</script>

<style lang="scss" scoped>
.product-detail { max-width: 760px; margin: 0 auto; padding: 32px 24px;
  header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px;
    h1 { margin: 0; }
  }
  .kind { color: #888; text-transform: uppercase; font-size: 0.85rem; margin: 0 0 16px; }
  .desc { color: #444; line-height: 1.6; margin: 0 0 24px; }
  .pricing { margin: 20px 0 30px; }
  .cohorts { margin-bottom: 24px;
    ul { list-style: none; padding: 0;
      li { padding: 14px; border: 2px solid #eee; border-radius: 10px; margin-bottom: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;
        &.selected { border-color: #2c7be5; background: #f0f7ff; }
      }
    }
  }
  .actions { text-align: center;
    .primary { padding: 14px 40px; background: #2c7be5; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
  }
}
</style>
