<template>
  <div class="auditoria">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="auditoria__header">
      <h2 class="auditoria__heading">
        <ShieldAlert :size="20" /> Auditoria & Banco Central
      </h2>
    </div>

    <!-- ── Sub-tabs ───────────────────────────────────────────────────────── -->
    <div class="auditoria__subtabs">
      <button
        v-for="st in subtabs"
        :key="st.key"
        :class="['auditoria__subtab', { 'is-active': activeSubtab === st.key }]"
        @click="activeSubtab = st.key"
      >
        <component :is="st.icon" :size="14" />
        {{ st.label }}
        <span v-if="st.key === 'flags' && pendingCount" class="auditoria__badge-count">
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PAINEL: MOEDAS ─ lista de alunos + ajuste manual                  -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeSubtab === 'moedas'" class="auditoria__panel">

      <div class="auditoria__controls">
        <input
          v-model="userSearch"
          class="c-field__input auditoria__search"
          placeholder="Buscar aluno por nome ou e-mail…"
        />
        <button class="c-btn c-btn--sm" @click="loadUsers">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <!-- Tabela de alunos -->
      <div class="auditoria__table-wrap">
        <table class="auditoria__table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>E-mail</th>
              <th class="text-right">Saldo</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingUsers">
              <td colspan="4" class="auditoria__loading-row">
                <Loader2 :size="18" class="spin" /> Carregando…
              </td>
            </tr>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="auditoria__row"
            >
              <td>{{ u.username }}</td>
              <td class="u-text--muted">{{ u.email }}</td>
              <td class="text-right auditoria__coins">
                <Coins :size="14" /> {{ u.coinsBalance.toLocaleString('pt-BR') }}
              </td>
              <td class="text-center">
                <button class="c-btn c-btn--ghost c-btn--sm" @click="openAdjustModal(u)">
                  <Sliders :size="14" /> Ajustar
                </button>
                <button class="c-btn c-btn--ghost c-btn--sm" @click="openHistoryModal(u)">
                  <History :size="14" /> Histórico
                </button>
              </td>
            </tr>
            <tr v-if="!loadingUsers && !filteredUsers.length">
              <td colspan="4" class="auditoria__empty-row">Nenhum aluno encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação simples -->
      <div class="auditoria__pagination">
        <button class="c-btn c-btn--ghost c-btn--sm" :disabled="userPage <= 1" @click="userPage--; loadUsers()">
          Anterior
        </button>
        <span>Página {{ userPage }} de {{ userTotalPages }}</span>
        <button class="c-btn c-btn--ghost c-btn--sm" :disabled="userPage >= userTotalPages" @click="userPage++; loadUsers()">
          Próxima
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PAINEL: FLAGS ─ anomalias detectadas                               -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeSubtab === 'flags'" class="auditoria__panel">

      <div class="auditoria__controls">
        <label class="auditoria__toggle">
          <input v-model="onlyPending" type="checkbox" @change="loadFlags" />
          Apenas pendentes
        </label>
        <button class="c-btn c-btn--sm" @click="loadFlags">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <div class="auditoria__table-wrap">
        <table class="auditoria__table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Tipo</th>
              <th>Detalhe</th>
              <th>Data</th>
              <th class="text-center">Status</th>
              <th class="text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingFlags">
              <td colspan="6" class="auditoria__loading-row">
                <Loader2 :size="18" class="spin" /> Carregando…
              </td>
            </tr>
            <tr v-for="flag in flags" :key="flag.flag_id" class="auditoria__row">
              <td>{{ flag.username }}</td>
              <td>
                <span class="c-badge c-badge--danger">{{ flag.flag_type }}</span>
              </td>
              <td class="auditoria__detail">{{ flag.detail }}</td>
              <td class="u-text--muted">{{ formatDate(flag.created_at) }}</td>
              <td class="text-center">
                <span :class="['c-badge', flag.is_reviewed ? 'c-badge--success' : 'c-badge--warning']">
                  {{ flag.is_reviewed ? 'Revisado' : 'Pendente' }}
                </span>
              </td>
              <td class="text-center">
                <button
                  v-if="!flag.is_reviewed"
                  class="c-btn c-btn--ghost c-btn--sm"
                  @click="reviewFlag(flag)"
                >
                  <CheckCircle :size="14" /> Revisar
                </button>
                <button class="c-btn c-btn--ghost c-btn--sm" @click="openAdjustByUserId(flag.user_id, flag.username)">
                  <Sliders :size="14" /> Ajustar
                </button>
              </td>
            </tr>
            <tr v-if="!loadingFlags && !flags.length">
              <td colspan="6" class="auditoria__empty-row">Nenhuma anomalia encontrada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Ajuste de Moedas                                            -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="adjustModal.open" class="auditoria__overlay" @click.self="adjustModal.open = false">
      <div class="auditoria__modal">
        <div class="auditoria__modal-header">
          <Coins :size="18" />
          <h3>Ajustar moedas — <span class="u-text--accent">{{ adjustModal.username }}</span></h3>
          <button class="c-btn c-btn--ghost c-btn--sm" @click="adjustModal.open = false">
            <X :size="16" />
          </button>
        </div>

        <div class="auditoria__modal-body">
          <div class="auditoria__direction">
            <button
              :class="['auditoria__dir-btn', { 'is-active is-credit': adjustModal.direction === 'credit' }]"
              @click="adjustModal.direction = 'credit'"
            >
              <TrendingUp :size="16" /> Creditar
            </button>
            <button
              :class="['auditoria__dir-btn', { 'is-active is-debit': adjustModal.direction === 'debit' }]"
              @click="adjustModal.direction = 'debit'"
            >
              <TrendingDown :size="16" /> Debitar
            </button>
          </div>

          <div class="c-field">
            <label class="c-field__label">Quantidade *</label>
            <input v-model.number="adjustModal.amount" class="c-field__input" type="number" min="1" />
          </div>

          <div class="c-field">
            <label class="c-field__label">Motivo / Nota *</label>
            <input v-model="adjustModal.note" class="c-field__input" placeholder="Ex: Prêmio por participação no Discord" />
          </div>

          <div v-if="adjustModal.error" class="c-field__error">{{ adjustModal.error }}</div>
        </div>

        <div class="auditoria__modal-footer">
          <button class="c-btn c-btn--ghost c-btn--sm" @click="adjustModal.open = false">Cancelar</button>
          <button class="c-btn" :disabled="adjustModal.saving" @click="submitAdjust">
            <Save :size="16" /> {{ adjustModal.saving ? 'Salvando…' : 'Confirmar ajuste' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Histórico de Transações                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="historyModal.open" class="auditoria__overlay" @click.self="historyModal.open = false">
      <div class="auditoria__modal auditoria__modal--wide">
        <div class="auditoria__modal-header">
          <History :size="18" />
          <h3>Histórico — <span class="u-text--accent">{{ historyModal.username }}</span></h3>
          <button class="c-btn c-btn--ghost c-btn--sm" @click="historyModal.open = false">
            <X :size="16" />
          </button>
        </div>
        <div class="auditoria__modal-body">
          <div v-if="historyModal.loading" class="auditoria__loading-row">
            <Loader2 :size="18" class="spin" /> Carregando…
          </div>
          <table v-else class="auditoria__table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Evento</th>
                <th class="text-right">Delta</th>
                <th class="text-right">Saldo após</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in historyModal.transactions" :key="tx.id" class="auditoria__row">
                <td class="u-text--muted">{{ formatDate(tx.createdAt) }}</td>
                <td>
                  <span class="c-badge c-badge--muted">{{ tx.eventType }}</span>
                </td>
                <td :class="['text-right', tx.delta >= 0 ? 'auditoria__plus' : 'auditoria__minus']">
                  {{ tx.delta >= 0 ? '+' : '' }}{{ tx.delta }}
                </td>
                <td class="text-right">{{ tx.balanceAfter }}</td>
                <td class="auditoria__detail">{{ tx.description || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ShieldAlert, RefreshCw, Loader2, Coins, Sliders, History,
  CheckCircle, X, TrendingUp, TrendingDown, Save,
} from 'lucide-vue-next'
import api from '@/core/api'

// ── Sub-tabs ───────────────────────────────────────────────────────────────

const subtabs = [
  { key: 'moedas', label: 'Moedas',    icon: Coins },
  { key: 'flags',  label: 'Anomalias', icon: ShieldAlert },
]
const activeSubtab = ref('moedas')

// ── Usuários ───────────────────────────────────────────────────────────────

const users        = ref([])
const userPage     = ref(1)
const userTotal    = ref(0)
const userSearch   = ref('')
const loadingUsers = ref(false)

const userTotalPages = computed(() => Math.max(1, Math.ceil(userTotal.value / 20)))
const filteredUsers  = computed(() =>
  users.value.filter(
    (u) =>
      !userSearch.value ||
      u.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.value.toLowerCase()),
  ),
)

async function loadUsers() {
  loadingUsers.value = true
  try {
    const { data } = await api.get(`/admin/economy/users?page=${userPage.value}&limit=20`)
    users.value   = data.users
    userTotal.value = data.total
  } catch (e) {
    console.error(e)
  } finally {
    loadingUsers.value = false
  }
}

// ── Flags ──────────────────────────────────────────────────────────────────

const flags        = ref([])
const pendingCount = ref(0)
const onlyPending  = ref(true)
const loadingFlags = ref(false)

async function loadFlags() {
  loadingFlags.value = true
  try {
    const { data } = await api.get(`/admin/economy/flags?onlyPending=${onlyPending.value}&limit=50`)
    flags.value = data.flags
    if (onlyPending.value) pendingCount.value = data.total
  } catch (e) {
    console.error(e)
  } finally {
    loadingFlags.value = false
  }
}

async function reviewFlag(flag) {
  try {
    await api.patch(`/admin/economy/flags/${flag.flag_id}/review`)
    flag.is_reviewed = true
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  } catch (e) {
    console.error(e)
  }
}

// ── Modal: Ajuste de Moedas ────────────────────────────────────────────────

const adjustModal = ref({
  open:      false,
  userId:    '',
  username:  '',
  direction: 'credit',
  amount:    100,
  note:      '',
  saving:    false,
  error:     '',
})

function openAdjustModal(user) {
  adjustModal.value = { open: true, userId: user.id, username: user.username, direction: 'credit', amount: 100, note: '', saving: false, error: '' }
}

function openAdjustByUserId(userId, username) {
  adjustModal.value = { open: true, userId, username, direction: 'credit', amount: 100, note: '', saving: false, error: '' }
}

async function submitAdjust() {
  adjustModal.value.error = ''
  if (!adjustModal.value.amount || adjustModal.value.amount < 1) {
    adjustModal.value.error = 'Quantidade deve ser ao menos 1.'; return
  }
  if (!adjustModal.value.note.trim()) {
    adjustModal.value.error = 'Motivo obrigatório.'; return
  }
  adjustModal.value.saving = true
  try {
    await api.post('/admin/economy/adjust', {
      userId:    adjustModal.value.userId,
      direction: adjustModal.value.direction,
      amount:    adjustModal.value.amount,
      note:      adjustModal.value.note,
    })
    // Atualizar saldo localmente
    const user = users.value.find((u) => u.id === adjustModal.value.userId)
    if (user) {
      user.coinsBalance += adjustModal.value.direction === 'credit'
        ? adjustModal.value.amount
        : -adjustModal.value.amount
    }
    adjustModal.value.open = false
  } catch (e) {
    adjustModal.value.error = e.response?.data?.message || 'Erro ao ajustar moedas.'
  } finally {
    adjustModal.value.saving = false
  }
}

// ── Modal: Histórico ───────────────────────────────────────────────────────

const historyModal = ref({ open: false, userId: '', username: '', transactions: [], loading: false })

async function openHistoryModal(user) {
  historyModal.value = { open: true, userId: user.id, username: user.username, transactions: [], loading: true }
  try {
    const { data } = await api.get(`/admin/economy/users/${user.id}/history?limit=50`)
    historyModal.value.transactions = data.transactions
  } finally {
    historyModal.value.loading = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  return d ? new Date(d).toLocaleString('pt-BR') : '—'
}

// ── Inicialização ──────────────────────────────────────────────────────────

onMounted(() => {
  loadUsers()
  loadFlags()
})
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.auditoria {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-lg;
    font-weight: 700;
  }

  // ── Sub-tabs ───────────────────────────────────────────────────────────

  &__subtabs {
    display: flex;
    gap: $space-1;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-lg;
    padding: $space-1;
    align-self: flex-start;
  }

  &__subtab {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    border-radius: calc(#{$radius-lg} - 4px);
    font-size: $fs-sm;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all $dur-fast $ease-out;

    &:hover:not(.is-active) { color: var(--text-secondary); background: var(--bg-elevated); }
    &.is-active { background: var(--color-primary); color: #fff; }
  }

  &__badge-count {
    background: #e74c3c;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 10px;
    padding: 0 6px;
    min-width: 18px;
    text-align: center;
    line-height: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  // ── Painel ─────────────────────────────────────────────────────────────

  &__panel {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;
  }

  &__search {
    width: 280px;
    max-width: 100%;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: var(--text-secondary);
    cursor: pointer;
  }

  // ── Tabela ─────────────────────────────────────────────────────────────

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $fs-sm;

    th {
      background: var(--bg-elevated);
      padding: $space-2 $space-3;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      white-space: nowrap;
    }

    td {
      padding: $space-2 $space-3;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      vertical-align: middle;
    }
  }

  &__row:last-child td { border-bottom: none; }
  &__row:hover td { background: var(--bg-elevated); }

  &__loading-row,
  &__empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: $space-6 !important;
  }

  &__coins  { color: var(--color-primary); font-weight: 600; }
  &__plus   { color: var(--color-success, #00d9c0); font-weight: 600; }
  &__minus  { color: var(--color-danger, #e74c3c); font-weight: 600; }
  &__detail { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__pagination {
    display: flex;
    align-items: center;
    gap: $space-3;
    justify-content: flex-end;
    font-size: $fs-sm;
    color: var(--text-muted);
  }

  // ── Overlay / Modal ────────────────────────────────────────────────────

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: $space-4;
  }

  &__modal {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-xl;
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);

    &--wide { max-width: 720px; }
  }

  &__modal-header {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-4 $space-5;
    border-bottom: 1px solid var(--border-subtle);
    font-weight: 600;

    h3 { flex: 1; font-size: $fs-base; }
  }

  &__modal-body {
    padding: $space-5;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__modal-footer {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
    padding: $space-4 $space-5;
    border-top: 1px solid var(--border-subtle);
  }

  // ── Direção crédito/débito ─────────────────────────────────────────────

  &__direction {
    display: flex;
    gap: $space-2;
  }

  &__dir-btn {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
    font-size: $fs-sm;
    transition: all $dur-fast $ease-out;

    &:hover { color: var(--text-primary); }
    &.is-active.is-credit {
      border-color: var(--color-success, #00d9c0);
      background: rgba(0, 217, 192, 0.12);
      color: var(--color-success, #00d9c0);
    }
    &.is-active.is-debit {
      border-color: var(--color-danger, #e74c3c);
      background: rgba(231, 76, 60, 0.12);
      color: var(--color-danger, #e74c3c);
    }
  }
}

.text-right  { text-align: right; }
.text-center { text-align: center; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
