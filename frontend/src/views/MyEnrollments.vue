<template>
  <div class="my-enrollments">
    <h1>🎓 Minhas matrículas</h1>
    <div v-if="loading" class="state">Carregando…</div>
    <div v-else-if="!items.length" class="state">Você ainda não tem matrículas. <router-link to="/catalog">Ver catálogo</router-link></div>
    <ul v-else>
      <li v-for="e in items" :key="e.id" :class="{ expired: e.status !== 'active' }">
        <h3>{{ e.product?.name || 'Produto' }}</h3>
        <p>Status: {{ e.status }}</p>
        <p v-if="e.expiresAt">Expira em {{ fmt(e.expiresAt) }}</p>
        <p v-if="e.lessonsQuota">Aulas: {{ e.lessonsConsumed }} / {{ e.lessonsQuota }}</p>
        <small>Fonte: {{ e.source }}</small>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { commerceService } from '../core/services/commerce.service.js'

const items = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    items.value = await commerceService.myEnrollments()
  } finally {
    loading.value = false
  }
})

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}
</script>

<style lang="scss" scoped>
.my-enrollments { max-width: 800px; margin: 0 auto; padding: 32px 24px;
  h1 { margin: 0 0 24px; }
  .state { text-align: center; padding: 60px 0; color: #888; }
  ul { list-style: none; padding: 0;
    li { background: white; border-radius: 12px; padding: 18px 22px; margin-bottom: 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      &.expired { opacity: 0.65; }
      h3 { margin: 0 0 6px; }
      p { margin: 2px 0; font-size: 0.92rem; color: #555; }
      small { color: #999; }
    }
  }
}
</style>
