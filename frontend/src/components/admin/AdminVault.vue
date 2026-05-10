<template>
  <div class="vault">

    <!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
    <div class="vault__header">
      <h2 class="vault__heading"><Archive :size="20" /> Vault de Itens</h2>
    </div>

    <!-- ── Sub-tabs ───────────────────────────────────────────────────────── -->
    <div class="vault__subtabs">
      <button
        v-for="st in subtabs"
        :key="st.key"
        :class="['vault__subtab', { 'is-active': activeSubtab === st.key }]"
        @click="activeSubtab = st.key"
      >
        <component :is="st.icon" :size="14" />
        {{ st.label }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PAINEL: ITENS                                                      -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeSubtab === 'items'" class="vault__panel">

      <div class="vault__controls">
        <input
          v-model="itemSearch"
          class="c-field__input vault__search"
          placeholder="Buscar item por nome…"
        />
        <div class="vault__legend">
          <span class="vault__dot vault__dot--active" /> Ativo
          <span class="vault__dot vault__dot--vault" /> Vault
          <span class="vault__dot vault__dot--inactive" /> Inativo
        </div>
        <button class="c-btn c-btn--sm" @click="loadItems">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <div class="vault__table-wrap">
        <table class="vault__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Tipo</th>
              <th>Raridade</th>
              <th class="text-right">Preço</th>
              <th class="text-center">Status</th>
              <th class="text-center">Vault</th>
              <th class="text-center">Token</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingItems">
              <td colspan="7" class="vault__loading-row">
                <Loader2 :size="18" class="spin" /> Carregando…
              </td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id" class="vault__row">
              <td class="vault__item-name">
                <img v-if="item.imageUrl" :src="item.imageUrl" class="vault__thumb" />
                <span>{{ item.name }}</span>
              </td>
              <td>
                <span class="c-badge c-badge--muted">{{ item.type }}</span>
              </td>
              <td>
                <span :class="['c-badge', rarityClass(item.rarity)]">{{ item.rarity }}</span>
              </td>
              <td class="text-right vault__coins">
                <Coins :size="13" /> {{ item.priceCoins.toLocaleString('pt-BR') }}
              </td>
              <td class="text-center">
                <span :class="statusBadgeClass(item)">{{ statusLabel(item) }}</span>
              </td>
              <td class="text-center">
                <button
                  :class="['vault__toggle-btn', item.isVault ? 'is-on' : '']"
                  :title="item.isVault ? 'Remover do vault' : 'Mover para vault'"
                  @click="toggleVault(item)"
                >
                  <Lock v-if="item.isVault" :size="14" />
                  <Unlock v-else :size="14" />
                </button>
              </td>
              <td class="text-center">
                <button
                  v-if="item.isVault"
                  class="c-btn c-btn--ghost c-btn--sm"
                  @click="openTokenModal(item)"
                >
                  <Key :size="13" /> Gerar token
                </button>
                <span v-else class="u-text--muted">—</span>
              </td>
            </tr>
            <tr v-if="!loadingItems && !filteredItems.length">
              <td colspan="7" class="vault__loading-row">Nenhum item encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- PAINEL: TOKENS                                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeSubtab === 'tokens'" class="vault__panel">

      <div class="vault__controls">
        <button class="c-btn c-btn--sm" @click="loadTokens()">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <div class="vault__table-wrap">
        <table class="vault__table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Item</th>
              <th class="text-center">Usos</th>
              <th>Expiração</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingTokens">
              <td colspan="5" class="vault__loading-row">
                <Loader2 :size="18" class="spin" /> Carregando…
              </td>
            </tr>
            <tr v-for="tk in tokens" :key="tk.id" class="vault__row">
              <td>
                <span class="vault__code" @click="copyCode(tk.code)">
                  {{ tk.code }}
                  <Copy :size="12" />
                </span>
              </td>
              <td>{{ tk.item?.name ?? tk.itemId }}</td>
              <td class="text-center">
                <span :class="['vault__uses', tk.currentUses >= tk.maxUses ? 'is-exhausted' : '']">
                  {{ tk.currentUses }}/{{ tk.maxUses }}
                </span>
              </td>
              <td class="u-text--muted">{{ tk.expiresAt ? formatDate(tk.expiresAt) : '∞' }}</td>
              <td class="text-center">
                <span :class="tokenStatusClass(tk)">{{ tokenStatusLabel(tk) }}</span>
              </td>
            </tr>
            <tr v-if="!loadingTokens && !tokens.length">
              <td colspan="5" class="vault__loading-row">Nenhum token gerado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Gerar Token                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="tokenModal.open" class="vault__overlay" @click.self="tokenModal.open = false">
      <div class="vault__modal">
        <div class="vault__modal-header">
          <Key :size="18" />
          <h3>Gerar Token — <span class="u-text--accent">{{ tokenModal.itemName }}</span></h3>
          <button class="c-btn c-btn--ghost c-btn--sm" @click="tokenModal.open = false">
            <X :size="16" />
          </button>
        </div>
        <div class="vault__modal-body">
          <div class="c-field">
            <label class="c-field__label">Máximo de usos *</label>
            <input v-model.number="tokenModal.maxUses" class="c-field__input" type="number" min="1" />
          </div>
          <div class="c-field">
            <label class="c-field__label">Expiração (opcional)</label>
            <input v-model="tokenModal.expiresAt" class="c-field__input" type="datetime-local" />
          </div>
          <div v-if="tokenModal.result" class="vault__result">
            <span>Código gerado:</span>
            <strong class="vault__code vault__code--big" @click="copyCode(tokenModal.result)">
              {{ tokenModal.result }} <Copy :size="14" />
            </strong>
          </div>
          <div v-if="tokenModal.error" class="c-field__error">{{ tokenModal.error }}</div>
        </div>
        <div class="vault__modal-footer">
          <button class="c-btn c-btn--ghost c-btn--sm" @click="tokenModal.open = false">Fechar</button>
          <button class="c-btn" :disabled="tokenModal.saving" @click="submitToken">
            <Key :size="16" /> {{ tokenModal.saving ? 'Gerando…' : 'Gerar token' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast de cópia -->
    <Transition name="fade">
      <div v-if="copiedToast" class="vault__toast">
        <CheckCircle :size="14" /> Código copiado!
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Archive, RefreshCw, Loader2, Coins, Lock, Unlock, Key,
  Copy, X, CheckCircle,
} from 'lucide-vue-next'
import api from '@/core/api'

// ── Sub-tabs ───────────────────────────────────────────────────────────────

const subtabs = [
  { key: 'items',  label: 'Itens',   icon: Archive },
  { key: 'tokens', label: 'Tokens',  icon: Key },
]
const activeSubtab = ref('items')

// ── Items ──────────────────────────────────────────────────────────────────

const items        = ref([])
const loadingItems = ref(false)
const itemSearch   = ref('')

const filteredItems = computed(() =>
  items.value.filter(
    (i) => !itemSearch.value || i.name.toLowerCase().includes(itemSearch.value.toLowerCase()),
  ),
)

async function loadItems() {
  loadingItems.value = true
  try {
    const { data } = await api.get('/admin/vault/items')
    items.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loadingItems.value = false
  }
}

async function toggleVault(item) {
  try {
    const { data } = await api.patch(`/admin/vault/items/${item.id}/toggle-vault`)
    Object.assign(item, data)
  } catch (e) {
    console.error(e)
  }
}

function statusLabel(item) {
  if (item.isVault) return 'Vault'
  if (item.isActive) return 'Ativo'
  return 'Inativo'
}

function statusBadgeClass(item) {
  if (item.isVault)  return 'c-badge c-badge--warning'
  if (item.isActive) return 'c-badge c-badge--success'
  return 'c-badge c-badge--muted'
}

function rarityClass(rarity) {
  const map = { common: 'c-badge--muted', rare: 'c-badge--info', epic: 'c-badge--warning', legendary: 'c-badge--danger' }
  return map[rarity] || 'c-badge--muted'
}

// ── Tokens ─────────────────────────────────────────────────────────────────

const tokens        = ref([])
const loadingTokens = ref(false)

async function loadTokens(itemId) {
  loadingTokens.value = true
  try {
    const url = itemId ? `/admin/vault/tokens?itemId=${itemId}` : '/admin/vault/tokens'
    const { data } = await api.get(url)
    tokens.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loadingTokens.value = false
  }
}

function tokenStatusLabel(tk) {
  if (tk.currentUses >= tk.maxUses) return 'Esgotado'
  if (tk.expiresAt && new Date(tk.expiresAt) < new Date()) return 'Expirado'
  return 'Ativo'
}

function tokenStatusClass(tk) {
  const l = tokenStatusLabel(tk)
  if (l === 'Ativo') return 'c-badge c-badge--success'
  if (l === 'Esgotado') return 'c-badge c-badge--danger'
  return 'c-badge c-badge--muted'
}

// ── Modal: Gerar Token ─────────────────────────────────────────────────────

const tokenModal = ref({
  open: false, itemId: '', itemName: '', maxUses: 1, expiresAt: '',
  saving: false, result: '', error: '',
})

function openTokenModal(item) {
  tokenModal.value = { open: true, itemId: item.id, itemName: item.name, maxUses: 1, expiresAt: '', saving: false, result: '', error: '' }
}

async function submitToken() {
  tokenModal.value.error = ''
  tokenModal.value.saving = true
  try {
    const payload = {
      itemId:  tokenModal.value.itemId,
      maxUses: tokenModal.value.maxUses,
    }
    if (tokenModal.value.expiresAt) payload.expiresAt = tokenModal.value.expiresAt
    const { data } = await api.post('/admin/vault/tokens', payload)
    tokenModal.value.result = data.code
    // Recarregar lista de tokens
    await loadTokens()
  } catch (e) {
    tokenModal.value.error = e.response?.data?.message || 'Erro ao gerar token.'
  } finally {
    tokenModal.value.saving = false
  }
}

// ── Copy helper ────────────────────────────────────────────────────────────

const copiedToast = ref(false)

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    copiedToast.value = true
    setTimeout(() => (copiedToast.value = false), 2000)
  } catch (_) {}
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d) {
  return d ? new Date(d).toLocaleString('pt-BR') : '—'
}

// ── Inicialização ──────────────────────────────────────────────────────────

onMounted(() => {
  loadItems()
  loadTokens()
})
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.vault {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__header { display: flex; align-items: center; justify-content: space-between; }

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
    transition: all $dur-fast $ease-out;
    &:hover:not(.is-active) { color: var(--text-secondary); background: var(--bg-elevated); }
    &.is-active { background: var(--color-primary); color: #fff; }
  }

  // ── Panel / Controls ───────────────────────────────────────────────────

  &__panel { display: flex; flex-direction: column; gap: $space-3; }

  &__controls {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;
  }

  &__search { width: 260px; max-width: 100%; }

  &__legend {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    color: var(--text-muted);
  }

  &__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    &--active   { background: var(--color-success, #00d9c0); }
    &--vault    { background: #f39c12; }
    &--inactive { background: var(--text-muted); }
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

  &__item-name {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-weight: 500;
  }

  &__thumb {
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    object-fit: cover;
    background: var(--bg-elevated);
  }

  &__coins { color: var(--color-primary); font-weight: 600; }

  // ── Toggle vault ───────────────────────────────────────────────────────

  &__toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-sm;
    border: 1px solid var(--border-subtle);
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
    transition: all $dur-fast $ease-out;

    &:hover { border-color: #f39c12; color: #f39c12; }
    &.is-on {
      border-color: #f39c12;
      background: rgba(243, 156, 18, 0.15);
      color: #f39c12;
    }
  }

  // ── Token code ─────────────────────────────────────────────────────────

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

    &--big {
      font-size: $fs-xl;
      background: var(--bg-elevated);
      padding: $space-2 $space-4;
      border-radius: $radius-md;
      border: 1px solid var(--border-subtle);
      margin-top: $space-2;
      display: block;
      text-align: center;
    }
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
    max-width: 440px;
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
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__modal-footer {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
    padding: $space-4 $space-5;
    border-top: 1px solid var(--border-subtle);
  }

  &__result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: $space-3;
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
</style>
