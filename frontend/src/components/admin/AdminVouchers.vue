<template>
  <div class="vouchers">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="vouchers__header">
      <h2 class="vouchers__heading"><Ticket :size="20" /> Vouchers de Acesso</h2>
      <button class="c-btn" @click="showForm = !showForm">
        <Plus :size="16" /> Novo voucher
      </button>
    </div>

    <!-- ── Formulário de criação ──────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="showForm" class="vouchers__form-card">
        <h3 class="vouchers__form-title">Criar novo voucher</h3>
        <div class="vouchers__form-grid">
          <div class="c-field">
            <label class="c-field__label">Nome / Campanha (opcional)</label>
            <input v-model="form.label" class="c-field__input" placeholder="Ex: Turma EAD Maio 2026" />
          </div>
          <div class="c-field">
            <label class="c-field__label">Máximo de usos *</label>
            <input v-model.number="form.maxUses" class="c-field__input" type="number" min="1" />
          </div>
          <div class="c-field">
            <label class="c-field__label">Dias de acesso *</label>
            <input v-model.number="form.accessDays" class="c-field__input" type="number" min="1" />
            <span class="c-field__hint">Quantos dias de acesso o aluno ganhará ao resgatar</span>
          </div>
          <div class="c-field">
            <label class="c-field__label">Expiração do voucher (opcional)</label>
            <input v-model="form.expiresAt" class="c-field__input" type="datetime-local" />
          </div>
        </div>
        <div v-if="form.error" class="c-field__error">{{ form.error }}</div>
        <div class="vouchers__form-actions">
          <button class="c-btn c-btn--ghost c-btn--sm" @click="showForm = false">Cancelar</button>
          <button class="c-btn" :disabled="form.saving" @click="createVoucher">
            <Save :size="16" /> {{ form.saving ? 'Criando…' : 'Criar voucher' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Lista de vouchers ──────────────────────────────────────────────── -->
    <div class="vouchers__controls">
      <button class="c-btn c-btn--sm" @click="loadVouchers">
        <RefreshCw :size="14" /> Atualizar
      </button>
    </div>

    <div class="vouchers__table-wrap">
      <table class="vouchers__table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Campanha</th>
            <th class="text-center">Usos</th>
            <th class="text-center">Dias</th>
            <th>Expiração</th>
            <th class="text-center">Status</th>
            <th class="text-center">Magic Link</th>
            <th class="text-center">Usos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="vouchers__loading-row">
              <Loader2 :size="18" class="spin" /> Carregando…
            </td>
          </tr>
          <tr v-for="v in vouchers" :key="v.id" class="vouchers__row">
            <td>
              <span class="vouchers__code" @click="copyCode(v.code)">
                {{ v.code }} <Copy :size="12" />
              </span>
            </td>
            <td class="u-text--muted">{{ v.label || '—' }}</td>
            <td class="text-center">
              <span :class="['vouchers__uses', v.currentUses >= v.maxUses ? 'is-exhausted' : '']">
                {{ v.currentUses }}/{{ v.maxUses }}
              </span>
            </td>
            <td class="text-center">{{ v.accessDays }}d</td>
            <td class="u-text--muted">{{ v.expiresAt ? formatDate(v.expiresAt) : '∞' }}</td>
            <td class="text-center">
              <span :class="voucherStatusClass(v)">{{ voucherStatusLabel(v) }}</span>
            </td>
            <td class="text-center">
              <button
                class="c-btn c-btn--ghost c-btn--sm"
                :title="magicLink(v.code)"
                @click="copyCode(magicLink(v.code))"
              >
                <Link2 :size="13" /> Copiar link
              </button>
            </td>
            <td class="text-center">
              <button
                class="c-btn c-btn--ghost c-btn--sm"
                @click="openUsesModal(v)"
              >
                <Users :size="13" /> Ver usos
              </button>
            </td>
          </tr>
          <tr v-if="!loading && !vouchers.length">
            <td colspan="8" class="vouchers__loading-row">Nenhum voucher criado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Usos do voucher                                             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="usesModal.open" class="vouchers__overlay" @click.self="usesModal.open = false">
      <div class="vouchers__modal">
        <div class="vouchers__modal-header">
          <Users :size="18" />
          <h3>Usos — <span class="u-text--accent">{{ usesModal.code }}</span></h3>
          <button class="c-btn c-btn--ghost c-btn--sm" @click="usesModal.open = false">
            <X :size="16" />
          </button>
        </div>
        <div class="vouchers__modal-body">
          <div v-if="usesModal.loading" class="vouchers__loading-row">
            <Loader2 :size="18" class="spin" /> Carregando…
          </div>
          <table v-else-if="usesModal.uses.length" class="vouchers__table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Resgatado em</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usesModal.uses" :key="u.id">
                <td class="u-text--muted">{{ u.userId }}</td>
                <td>{{ formatDate(u.usedAt) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="vouchers__loading-row">Ainda não houve resgates.</p>
        </div>
      </div>
    </div>

    <!-- Toast de cópia -->
    <Transition name="fade">
      <div v-if="copiedToast" class="vouchers__toast">
        <CheckCircle :size="14" /> Copiado!
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Ticket, Plus, Save, RefreshCw, Loader2,
  Copy, Link2, Users, X, CheckCircle,
} from 'lucide-vue-next'
import api from '@/core/api'

// ── Lista de vouchers ──────────────────────────────────────────────────────

const vouchers = ref([])
const loading  = ref(false)

async function loadVouchers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/vouchers')
    vouchers.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ── Criação de voucher ─────────────────────────────────────────────────────

const showForm = ref(false)
const form = ref({ label: '', maxUses: 1, accessDays: 30, expiresAt: '', saving: false, error: '' })

async function createVoucher() {
  form.value.error = ''
  if (!form.value.maxUses || form.value.maxUses < 1) {
    form.value.error = 'Máximo de usos deve ser ao menos 1.'; return
  }
  if (!form.value.accessDays || form.value.accessDays < 1) {
    form.value.error = 'Dias de acesso deve ser ao menos 1.'; return
  }
  form.value.saving = true
  try {
    const payload = {
      maxUses:   form.value.maxUses,
      accessDays: form.value.accessDays,
    }
    if (form.value.label)     payload.label     = form.value.label
    if (form.value.expiresAt) payload.expiresAt = form.value.expiresAt
    const { data } = await api.post('/admin/vouchers', payload)
    vouchers.value.unshift(data)
    showForm.value = false
    form.value = { label: '', maxUses: 1, accessDays: 30, expiresAt: '', saving: false, error: '' }
  } catch (e) {
    form.value.error = e.response?.data?.message || 'Erro ao criar voucher.'
  } finally {
    form.value.saving = false
  }
}

// ── Modal: usos ────────────────────────────────────────────────────────────

const usesModal = ref({ open: false, id: '', code: '', uses: [], loading: false })

async function openUsesModal(v) {
  usesModal.value = { open: true, id: v.id, code: v.code, uses: [], loading: true }
  try {
    const { data } = await api.get(`/admin/vouchers/${v.id}/uses`)
    usesModal.value.uses = data
  } finally {
    usesModal.value.loading = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function voucherStatusLabel(v) {
  if (v.currentUses >= v.maxUses) return 'Esgotado'
  if (v.expiresAt && new Date(v.expiresAt) < new Date()) return 'Expirado'
  return 'Ativo'
}

function voucherStatusClass(v) {
  const l = voucherStatusLabel(v)
  if (l === 'Ativo')    return 'c-badge c-badge--success'
  if (l === 'Esgotado') return 'c-badge c-badge--danger'
  return 'c-badge c-badge--muted'
}

function magicLink(code) {
  return `${window.location.origin}/voucher?code=${code}`
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('pt-BR') : '—'
}

const copiedToast = ref(false)
async function copyCode(text) {
  try {
    await navigator.clipboard.writeText(text)
    copiedToast.value = true
    setTimeout(() => (copiedToast.value = false), 2000)
  } catch (_) {}
}

onMounted(loadVouchers)
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.vouchers {
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

  // ── Formulário ─────────────────────────────────────────────────────────

  &__form-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-xl;
    padding: $space-5;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__form-title {
    font-size: $fs-base;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: $space-3;
  }

  &__form-actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
  }

  // ── Controls ───────────────────────────────────────────────────────────

  &__controls {
    display: flex;
    align-items: center;
    gap: $space-3;
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

  &__loading-row {
    text-align: center;
    color: var(--text-muted);
    padding: $space-6 !important;
  }

  &__code {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    color: var(--color-primary);
    &:hover { text-decoration: underline; }
  }

  &__uses {
    font-weight: 600;
    &.is-exhausted { color: var(--color-danger, #e74c3c); }
  }

  // ── Modal ──────────────────────────────────────────────────────────────

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
    max-width: 560px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
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
    max-height: 60vh;
    overflow-y: auto;
  }

  // ── Toast ──────────────────────────────────────────────────────────────

  &__toast {
    position: fixed;
    bottom: $space-8;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-primary);
    color: #fff;
    padding: $space-2 $space-5;
    border-radius: $radius-pill;
    font-size: $fs-sm;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $space-2;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 300;
  }
}

.text-right  { text-align: right; }
.text-center { text-align: center; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-down-enter-active { animation: slideDown 0.2s ease-out; }
.slide-down-leave-active { animation: slideDown 0.15s ease-in reverse; }
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
