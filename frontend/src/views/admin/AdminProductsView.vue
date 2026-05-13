<template>
  <div class="admin-products">
    <header>
      <h2>Produtos</h2>
      <button class="primary" @click="openCreate">+ Novo produto</button>
    </header>

    <table>
      <thead>
        <tr><th>Nome</th><th>Tipo</th><th>Preço</th><th>Publicado</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.name }}<br/><small>{{ p.slug }}</small></td>
          <td>{{ p.kind }}</td>
          <td>R$ {{ p.priceBrl }}</td>
          <td>{{ p.isPublished ? '✅' : '—' }}</td>
          <td><button @click="openEdit(p)">Editar</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="modalOpen" class="modal-bg" @click.self="modalOpen = false">
      <div class="modal">
        <h3>{{ editing?.id ? 'Editar' : 'Novo' }} produto</h3>
        <label>Nome</label><input v-model="form.name" />
        <label>Slug</label><input v-model="form.slug" />
        <label>Tipo</label>
        <select v-model="form.kind">
          <option value="course">Curso</option>
          <option value="live_pack">Pacote de lives</option>
          <option value="webinar">Webinar</option>
          <option value="bundle">Bundle</option>
        </select>
        <label>Descrição curta</label><input v-model="form.shortDescription" />
        <label>Descrição</label><textarea v-model="form.description" rows="4" />
        <label>Preço BRL</label><input type="number" step="0.01" v-model.number="form.priceBrl" />
        <label><input type="checkbox" v-model="form.isFree" /> Grátis</label>
        <label><input type="checkbox" v-model="form.allowCoins" /> Aceita moedas</label>
        <label>Máx % em moedas</label><input type="number" v-model.number="form.coinsMaxPercent" />
        <label>Taxa moedas (moedas por 1 BRL)</label><input type="number" v-model.number="form.coinsRate" />
        <label>Dias de acesso</label><input type="number" v-model.number="form.accessDurationDays" />
        <label>Quota de aulas (NULL = ilimitado)</label><input type="number" v-model.number="form.lessonsQuota" />
        <label>Timezone</label><input v-model="form.timezone" placeholder="America/Sao_Paulo" />
        <label>Capacidade default</label><input type="number" v-model.number="form.defaultCapacity" />
        <label><input type="checkbox" v-model="form.isPublished" /> Publicado</label>

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
const modalOpen = ref(false)
const editing = ref(null)
const form = ref({})

onMounted(load)

async function load() {
  products.value = await commerceService.adminListProducts()
}

function openCreate() {
  editing.value = null
  form.value = {
    name: '', slug: '', kind: 'course', shortDescription: '', description: '',
    priceBrl: 0, isFree: false, allowCoins: true, coinsMaxPercent: 100, coinsRate: 1,
    accessDurationDays: 365, lessonsQuota: null,
    timezone: 'America/Sao_Paulo', defaultCapacity: null, isPublished: false,
  }
  modalOpen.value = true
}

function openEdit(p) {
  editing.value = p
  form.value = { ...p, priceBrl: Number(p.priceBrl), coinsMaxPercent: Number(p.coinsMaxPercent), coinsRate: Number(p.coinsRate) }
  modalOpen.value = true
}

async function save() {
  try {
    if (editing.value?.id) await commerceService.adminUpdateProduct(editing.value.id, form.value)
    else await commerceService.adminCreateProduct(form.value)
    modalOpen.value = false
    await load()
  } catch (err) { alert(err.response?.data?.message || err.message) }
}

async function remove() {
  if (!confirm('Excluir produto?')) return
  await commerceService.adminDeleteProduct(editing.value.id)
  modalOpen.value = false
  await load()
}
</script>

<style lang="scss" scoped>
.admin-products { padding: 16px;
  header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center;
    h2 { margin: 0; } .primary { padding: 8px 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
  }
  table { width: 100%; border-collapse: collapse;
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
    small { color: #888; }
  }
}
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
  .modal { background: white; border-radius: 12px; padding: 24px; width: min(560px, 92vw); max-height: 92vh; overflow-y: auto;
    label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 0.9rem; }
    input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;
      button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #eee;
        &.primary { background: #2c7be5; color: white; } &.danger { background: #d33; color: white; }
      }
    }
  }
}
</style>
