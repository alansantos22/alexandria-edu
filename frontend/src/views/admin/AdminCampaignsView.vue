<template>
  <div class="admin-campaigns">
    <header>
      <h2>Campanhas promocionais</h2>
      <button class="primary" @click="openCreate">+ Nova campanha</button>
    </header>

    <table>
      <thead><tr><th>Nome</th><th>Slug</th><th>Tipo</th><th>Desconto</th><th>Período</th><th>Ativa</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in items" :key="c.id">
          <td>{{ c.name }}</td>
          <td><code>/promo/{{ c.publicSlug }}</code></td>
          <td>{{ c.kind }}</td>
          <td>{{ c.kind === 'percent' ? `${c.discountPercent}%` : `R$ ${c.discountAmount}` }}</td>
          <td>{{ fmt(c.startsAt) }} → {{ fmt(c.endsAt) }}</td>
          <td>{{ c.isActive ? '✅' : '—' }}</td>
          <td><button @click="openEdit(c)">Editar</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="modalOpen" class="modal-bg" @click.self="modalOpen = false">
      <div class="modal">
        <h3>{{ editing?.id ? 'Editar' : 'Nova' }} campanha</h3>
        <label>Nome</label><input v-model="form.name" />
        <label>Slug público</label><input v-model="form.publicSlug" />
        <label>Banner URL</label><input v-model="form.bannerUrl" />
        <label>Badge</label><input v-model="form.badgeText" />
        <label>Descrição</label><textarea v-model="form.description" rows="3" />
        <label>Tipo de desconto</label>
        <select v-model="form.kind">
          <option value="percent">Percentual</option>
          <option value="fixed">Valor fixo</option>
        </select>
        <label>Desconto %</label><input type="number" v-model.number="form.discountPercent" />
        <label>Desconto fixo R$</label><input type="number" step="0.01" v-model.number="form.discountAmount" />
        <label>Início</label><input type="datetime-local" v-model="form.startsAt" />
        <label>Fim</label><input type="datetime-local" v-model="form.endsAt" />
        <label><input type="checkbox" v-model="form.isActive" /> Ativa</label>
        <label><input type="checkbox" v-model="form.appliesToAll" /> Aplica em todos os produtos publicados</label>

        <div v-if="editing?.id && !form.appliesToAll" class="attach">
          <label>Anexar produto:</label>
          <select v-model="attachId">
            <option value="">Selecione…</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button @click="doAttach">Anexar</button>
        </div>

        <div class="actions">
          <button @click="modalOpen = false">Cancelar</button>
          <button v-if="editing?.id" class="danger" @click="remove">Excluir</button>
          <button class="primary" @click="save">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { commerceService } from '../../core/services/commerce.service.js'

const items = ref([])
const products = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const form = ref({})
const attachId = ref('')

onMounted(async () => {
  items.value = await commerceService.adminListCampaigns()
  products.value = await commerceService.adminListProducts()
})

function openCreate() {
  editing.value = null
  form.value = {
    name: '', publicSlug: '', bannerUrl: '', badgeText: '', description: '',
    kind: 'percent', discountPercent: 0, discountAmount: 0,
    startsAt: '', endsAt: '', isActive: true, appliesToAll: false,
  }
  modalOpen.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = { ...c,
    discountPercent: Number(c.discountPercent), discountAmount: Number(c.discountAmount),
    startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0,16) : '',
    endsAt: c.endsAt ? new Date(c.endsAt).toISOString().slice(0,16) : '',
  }
  modalOpen.value = true
}

async function save() {
  const payload = { ...form.value,
    startsAt: form.value.startsAt ? new Date(form.value.startsAt).toISOString() : null,
    endsAt: form.value.endsAt ? new Date(form.value.endsAt).toISOString() : null,
  }
  if (editing.value?.id) await commerceService.adminUpdateCampaign(editing.value.id, payload)
  else await commerceService.adminCreateCampaign(payload)
  items.value = await commerceService.adminListCampaigns()
  modalOpen.value = false
}

async function remove() {
  if (!confirm('Excluir campanha?')) return
  await commerceService.adminDeleteCampaign(editing.value.id)
  items.value = await commerceService.adminListCampaigns()
  modalOpen.value = false
}

async function doAttach() {
  if (!attachId.value || !editing.value?.id) return
  await commerceService.adminAttachProductToCampaign(editing.value.id, attachId.value)
  attachId.value = ''
  alert('Produto anexado.')
}

function fmt(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }
</script>

<style lang="scss" scoped>
.admin-campaigns { padding: 16px;
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h2 { margin: 0; } .primary { padding: 8px 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
  }
  table { width: 100%; border-collapse: collapse;
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
  }
}
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
  .modal { background: white; border-radius: 12px; padding: 24px; width: min(560px, 92vw); max-height: 92vh; overflow-y: auto;
    label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 0.9rem; }
    input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    .attach { display: flex; gap: 8px; align-items: end; margin-top: 18px; padding-top: 14px; border-top: 1px solid #eee;
      label { margin: 0; flex: 0 0 100%; }
      select { flex: 1; }
      button { padding: 8px 14px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
    }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;
      button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #eee;
        &.primary { background: #2c7be5; color: white; } &.danger { background: #d33; color: white; }
      }
    }
  }
}
</style>
