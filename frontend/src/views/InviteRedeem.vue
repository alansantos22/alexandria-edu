<template>
  <div class="invite-redeem">
    <h1>🎟️ Resgatar convite</h1>
    <div v-if="loading" class="state">Verificando…</div>

    <div v-else-if="error" class="state error">{{ error }}</div>

    <div v-else-if="preview" class="preview">
      <p>Código: <code>{{ preview.code }}</code></p>
      <p v-if="preview.label">{{ preview.label }}</p>
      <p><strong>Tipo:</strong> {{ kindLabel }}</p>
      <p><strong>Escopo:</strong> {{ scopeLabel }}</p>
      <p v-if="preview.targetMeta">→ {{ preview.targetMeta.title || preview.targetMeta.name }}</p>
      <p><strong>Vagas restantes:</strong> {{ preview.remainingUses }}</p>
      <p v-if="preview.expired" class="error">⚠️ Convite expirado.</p>

      <div v-if="preview.kind === 'discount'">
        <p>Use este cupom durante o checkout para receber desconto.</p>
        <button class="primary" @click="$router.push('/catalog')">Ver catálogo</button>
      </div>

      <div v-else>
        <button
          class="primary"
          :disabled="processing || preview.expired || preview.remainingUses === 0"
          @click="redeem"
        >
          {{ processing ? 'Resgatando…' : 'Resgatar acesso' }}
        </button>
      </div>
    </div>

    <div v-if="redeemed" class="success">
      ✅ Acesso liberado! <router-link to="/me/enrollments">Ver minhas matrículas</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { inviteService } from '../core/services/invite.service.js'

const route = useRoute()
const preview = ref(null)
const loading = ref(true)
const processing = ref(false)
const error = ref('')
const redeemed = ref(false)

onMounted(async () => {
  try {
    preview.value = await inviteService.preview(route.params.code)
  } catch (err) {
    error.value = err.response?.data?.message || 'Convite inválido.'
  } finally {
    loading.value = false
  }
})

const kindLabel = computed(() => preview.value?.kind === 'access' ? 'Acesso' : 'Cupom de desconto')
const scopeLabel = computed(() => ({
  global: 'Global',
  product: 'Produto',
  cohort: 'Turma',
  live_class: 'Aula específica',
}[preview.value?.scope] || preview.value?.scope))

async function redeem() {
  processing.value = true
  error.value = ''
  try {
    await inviteService.redeem(route.params.code)
    redeemed.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Falha ao resgatar.'
  } finally {
    processing.value = false
  }
}
</script>

<style lang="scss" scoped>
.invite-redeem { max-width: 540px; margin: 60px auto; padding: 32px; background: white; border-radius: 14px; box-shadow: 0 2px 14px rgba(0,0,0,0.08);
  h1 { margin: 0 0 20px; }
  .state { padding: 30px 0; text-align: center;
    &.error { color: #d33; }
  }
  .preview p { margin: 6px 0; code { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; } }
  .primary { width: 100%; padding: 12px; margin-top: 16px; background: #2c7be5; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
  .success { margin-top: 24px; padding: 18px; background: #e8f7ee; border-radius: 10px; text-align: center; color: #1a7a3e;
    a { color: #1a7a3e; text-decoration: underline; }
  }
  .error { color: #d33; }
}
</style>
