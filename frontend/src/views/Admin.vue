<template>
  <div>
    <header class="c-appbar">
      <div class="c-appbar__brand">
        <span class="c-appbar__logo"><ShieldCheck :size="20" /></span>
        <span>Alexandria <small class="u-text--muted">Admin</small></span>
      </div>
      <div class="c-appbar__actions">
        <span class="c-badge c-badge--accent">
          <Crown :size="12" /> Administrador
        </span>
        <button class="c-btn c-btn--ghost c-btn--sm" @click="logout">
          <LogOut :size="16" /> Sair
        </button>
      </div>
    </header>

    <main class="l-container p-admin">
      <section class="p-admin__hero a-fade-in-up">
        <p class="u-text--eyebrow"><Settings :size="14" /> Painel</p>
        <h1>Centro de controle</h1>
      </section>

      <nav class="p-admin__tabs">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="`/admin/${tab.key}`"
          class="p-admin__tab"
          active-class="is-active"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </RouterLink>
      </nav>

      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShieldCheck, Crown, LogOut, Settings,
  Users, Library, ShoppingBag, LayoutDashboard, Box, ShieldAlert, Archive, Ticket,
} from 'lucide-vue-next'

const tabs = [
  { key: 'painel',      label: 'Painel',     icon: LayoutDashboard },
  { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { key: 'edificios',   label: 'Edifícios',   icon: Box },
  { key: 'conteudo',    label: 'Conteúdo',    icon: Library },
  { key: 'vault',       label: 'Vault',       icon: Archive },
  { key: 'vouchers',    label: 'Vouchers',    icon: Ticket },
  { key: 'auditoria',   label: 'Auditoria',   icon: ShieldAlert },
  { key: 'usuarios',    label: 'Usuários',    icon: Users },
]

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')

onMounted(() => {
  if (!user || user.role !== 'admin') router.push('/')
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin {
  &__hero { margin-bottom: $space-4; }

  &__tabs {
    display: flex;
    gap: $space-1;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-lg;
    padding: $space-1;
    margin-bottom: $space-6;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__tab {
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
    white-space: nowrap;
    text-decoration: none;
    transition: all $dur-fast $ease-out;

    &:hover:not(.is-active) {
      color: var(--text-secondary);
      background: var(--bg-elevated);
    }

    &.is-active {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 2px 8px rgba(108, 92, 231, 0.35);
    }
  }
}
</style>
