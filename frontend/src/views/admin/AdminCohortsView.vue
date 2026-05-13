<template>
  <div class="admin-cohorts">
    <header>
      <h2>Turmas</h2>
      <select v-model="selectedProduct" @change="load">
        <option value="">Selecione um produto…</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <button class="primary" :disabled="!selectedProduct" @click="openCreate">+ Nova turma</button>
    </header>

    <table v-if="selectedProduct">
      <thead><tr><th>Nome</th><th>Início</th><th>Fim</th><th>Capacidade</th><th>Vagas</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in cohorts" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ fmt(c.startsAt) }}</td>
          <td>{{ fmt(c.endsAt) }}</td>
          <td>{{ c.capacity ?? '∞' }}</td>
          <td>{{ c.seatsLeft }}</td>
          <td>{{ c.status }}</td>
          <td><button @click="openEdit(c)">Editar</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="modalOpen" class="modal-bg" @click.self="modalOpen = false">
      <div class="modal">
        <h3>{{ editing?.id ? 'Editar' : 'Nova' }} turma</h3>
        <label>Nome</label><input v-model="form.name" />
        <label>Início</label><input type="datetime-local" v-model="form.startsAt" />
        <label>Fim</label><input type="datetime-local" v-model="form.endsAt" />
        <label>Capacidade (vazio = ilimitada)</label><input type="number" v-model.number="form.capacity" />
        <label>Timezone</label><input v-model="form.timezone" />
        <label>Status</label>
        <select v-model="form.status">
          <option value="draft">Rascunho</option>
          <option value="open">Aberta</option>
          <option value="closed">Fechada</option>
          <option value="running">Em andamento</option>
          <option value="finished">Concluída</option>
          <option value="cancelled">Cancelada</option>
        </select>
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

const products = ref([])
const cohorts = ref([])
const selectedProduct = ref('')
const modalOpen = ref(false)
const editing = ref(null)
const form = ref({})

onMounted(async () => {
  products.value = await commerceService.adminListProducts()
})

async function load() {
  if (!selectedProduct.value) { cohorts.value = []; return }
  cohorts.value = await commerceService.adminListCohorts(selectedProduct.value)
}

function openCreate() {
  editing.value = null
  form.value = {
    productId: selectedProduct.value, name: '', startsAt: '', endsAt: '',
    capacity: null, timezone: 'America/Sao_Paulo', status: 'draft',
  }
  modalOpen.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = { ...c, startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0,16) : '', endsAt: c.endsAt ? new Date(c.endsAt).toISOString().slice(0,16) : '' }
  modalOpen.value = true
}

async function save() {
  const payload = {
    ...form.value,
    startsAt: form.value.startsAt ? new Date(form.value.startsAt).toISOString() : null,
    endsAt: form.value.endsAt ? new Date(form.value.endsAt).toISOString() : null,
  }
  if (editing.value?.id) await commerceService.adminUpdateCohort(editing.value.id, payload)
  else await commerceService.adminCreateCohort(payload)
  modalOpen.value = false
  await load()
}

async function remove() {
  if (!confirm('Excluir turma?')) return
  await commerceService.adminDeleteCohort(editing.value.id)
  modalOpen.value = false
  await load()
}

function fmt(d) { return d ? new Date(d).toLocaleString('pt-BR') : '—' }
</script>

<style lang="scss" scoped>
.admin-cohorts { padding: 16px;
  header { display: flex; gap: 12px; align-items: center; margin-bottom: 16px;
    h2 { margin: 0; flex: 1; }
    select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
    .primary { padding: 8px 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; &:disabled { opacity: 0.5; } }
  }
  table { width: 100%; border-collapse: collapse;
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
  }
}
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
  .modal { background: white; border-radius: 12px; padding: 24px; width: min(500px, 92vw);
    label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 0.9rem; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;
      button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #eee;
        &.primary { background: #2c7be5; color: white; } &.danger { background: #d33; color: white; }
      }
    }
  }
}
</style>
