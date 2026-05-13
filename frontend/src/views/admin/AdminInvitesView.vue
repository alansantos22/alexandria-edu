<template>
  <div class="admin-invites">
    <header>
      <h2>Convites &amp; Cupons</h2>
      <button class="primary" @click="openCreate">+ Novo convite</button>
    </header>

    <table>
      <thead><tr><th>Código</th><th>Tipo</th><th>Escopo</th><th>Usos</th><th>Expira</th><th>Rótulo</th></tr></thead>
      <tbody>
        <tr v-for="v in items" :key="v.id">
          <td><code>{{ v.code }}</code></td>
          <td>{{ v.kind }}</td>
          <td>{{ v.scope }} <small v-if="v.scopeId">/ {{ shortId(v.scopeId) }}</small></td>
          <td>{{ v.currentUses }} / {{ v.maxUses }}</td>
          <td>{{ fmt(v.expiresAt) }}</td>
          <td>{{ v.label || '—' }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="modalOpen" class="modal-bg" @click.self="modalOpen = false">
      <div class="modal">
        <h3>Novo convite/cupom</h3>
        <label>Rótulo (interno)</label><input v-model="form.label" />
        <label>Tipo</label>
        <select v-model="form.kind">
          <option value="access">Acesso (libera produto/turma/aula)</option>
          <option value="discount">Cupom de desconto</option>
        </select>
        <label>Escopo</label>
        <select v-model="form.scope">
          <option value="global">Global</option>
          <option value="product">Produto</option>
          <option value="cohort">Turma</option>
          <option value="live_class">Aula específica</option>
        </select>
        <label v-if="form.scope !== 'global'">ID do alvo</label>
        <input v-if="form.scope !== 'global'" v-model="form.scopeId" placeholder="UUID" />
        <label>Máx usos</label><input type="number" v-model.number="form.maxUses" />
        <label>Expira em</label><input type="datetime-local" v-model="form.expiresAt" />

        <template v-if="form.kind === 'access'">
          <label>Dias de acesso</label><input type="number" v-model.number="form.accessDays" />
        </template>
        <template v-else>
          <label>Tipo do desconto</label>
          <select v-model="form.discountKind">
            <option value="percent">Percentual</option>
            <option value="fixed">Valor fixo</option>
          </select>
          <label>% de desconto</label><input type="number" v-model.number="form.discountPercent" />
          <label>R$ de desconto</label><input type="number" step="0.01" v-model.number="form.discountAmount" />
        </template>

        <div class="actions">
          <button @click="modalOpen = false">Cancelar</button>
          <button class="primary" @click="save">Criar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { inviteService } from '../../core/services/invite.service.js'

const items = ref([])
const modalOpen = ref(false)
const form = ref({})

onMounted(load)

async function load() { items.value = await inviteService.adminList() }

function openCreate() {
  form.value = {
    label: '', kind: 'access', scope: 'global', scopeId: null,
    maxUses: 1, expiresAt: '', accessDays: 30,
    discountKind: 'percent', discountPercent: 10, discountAmount: 0,
  }
  modalOpen.value = true
}

async function save() {
  try {
    const payload = { ...form.value, expiresAt: form.value.expiresAt ? new Date(form.value.expiresAt).toISOString() : null }
    await inviteService.adminCreate(payload)
    modalOpen.value = false
    await load()
  } catch (err) { alert(err.response?.data?.message || err.message) }
}

function shortId(id) { return id ? id.slice(0, 8) : '' }
function fmt(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }
</script>

<style lang="scss" scoped>
.admin-invites { padding: 16px;
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h2 { margin: 0; } .primary { padding: 8px 16px; background: #2c7be5; color: white; border: none; border-radius: 6px; cursor: pointer; }
  }
  table { width: 100%; border-collapse: collapse;
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
    code { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
    small { color: #888; }
  }
}
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
  .modal { background: white; border-radius: 12px; padding: 24px; width: min(500px, 92vw); max-height: 92vh; overflow-y: auto;
    label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 0.9rem; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;
      button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #eee;
        &.primary { background: #2c7be5; color: white; }
      }
    }
  }
}
</style>
