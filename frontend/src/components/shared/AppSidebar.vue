<template>
  <aside
    class="c-sidebar"
    :class="{
      'c-sidebar--collapsed': collapsed,
      'c-sidebar--mobile-open': mobileOpen,
    }"
    aria-label="Navegação principal"
  >
    <!-- ── Header ─────────────────────────────── -->
    <div class="c-sidebar__head">
      <router-link to="/home" class="c-sidebar__brand" @click="$emit('close-mobile')">
        <span class="c-sidebar__brand-icon">✦</span>
        <span class="c-sidebar__brand-text">
          Alexandria <small>EDU</small>
        </span>
      </router-link>

      <!-- Collapse toggle (desktop only) -->
      <button
        class="c-sidebar__collapse-btn"
        @click="$emit('toggle-collapse')"
        :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
      >
        <ChevronLeft :size="15" :class="{ 'c-sidebar__chevron--flip': collapsed }" />
      </button>
    </div>

    <!-- ── Nav ───────────────────────────────── -->
    <nav class="c-sidebar__nav" role="navigation">
      <router-link
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="c-sidebar__link"
        :class="{ 'c-sidebar__link--active': isActive(item.to) }"
        :title="collapsed ? item.label : undefined"
        @click="$emit('close-mobile')"
      >
        <component :is="item.icon" :size="19" class="c-sidebar__link-icon" />
        <span class="c-sidebar__link-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- ── Footer ────────────────────────────── -->
    <div class="c-sidebar__foot">
      <!-- Coins balance -->
      <div
        class="c-sidebar__coins"
        :title="collapsed ? `${balance} moedas` : undefined"
      >
        <span class="c-sidebar__coins-icon">🪙</span>
        <span class="c-sidebar__coins-value c-sidebar__link-label">{{ balance.toLocaleString('pt-BR') }}</span>
      </div>

      <div
        class="c-sidebar__user"
        :title="collapsed ? (user?.username || 'Aluno') : undefined"
      >
        <div class="c-sidebar__avatar">{{ userInitial }}</div>
        <div class="c-sidebar__user-info">
          <span class="c-sidebar__user-name">{{ user?.username || 'Aluno' }}</span>
          <span class="c-sidebar__user-role">
            {{ user?.role === 'admin' ? 'Admin' : 'Aluno' }}
          </span>
        </div>
      </div>

      <button
        class="c-sidebar__logout"
        @click="handleLogout"
        :title="collapsed ? 'Sair' : undefined"
        aria-label="Sair da conta"
      >
        <LogOut :size="17" />
        <span class="c-sidebar__link-label">Sair</span>
      </button>
    </div>
  </aside>

  <!-- ── Coin reward toast ─────────────────── -->
  <Transition name="coin-toast">
    <div v-if="notification" class="c-coin-toast" role="status" aria-live="polite">
      <span class="c-coin-toast__icon">🪙</span>
      <span class="c-coin-toast__text">{{ notification.message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft, LogOut,
  House, MessageCircle, ShieldCheck, BookOpen, ShoppingBag, Building2, Map,
} from 'lucide-vue-next'
import { useEconomyStore } from '@/core/store/economy.js'

const { balance, notification, fetchBalance } = useEconomyStore()

defineProps({
  collapsed:  { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
})

defineEmits(['toggle-collapse', 'close-mobile'])

const route  = useRoute()
const router = useRouter()

const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))

onMounted(() => {
  if (user.value) fetchBalance()
})

const userInitial = computed(() => {
  const name = user.value?.username || user.value?.email || '?'
  return name[0].toUpperCase()
})

const allNavItems = [
  { to: '/home',        icon: House,         label: 'Início'      },
  { to: '/world',       icon: Map,           label: 'Mapa'        },
  { to: '/city',        icon: Building2,     label: 'Cidade'      },
  { to: '/forum',       icon: MessageCircle, label: 'Fórum'       },
  { to: '/marketplace', icon: ShoppingBag,   label: 'Marketplace' },
  { to: '/admin',       icon: ShieldCheck,   label: 'Admin', adminOnly: true },
]

const visibleItems = computed(() =>
  allNavItems.filter(item => !item.adminOnly || user.value?.role === 'admin'),
)

function isActive(to) {
  if (to === '/home') return route.path === '/home'
  return route.path.startsWith(to)
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/colors' as *;
@use '@/assets/scss/variables' as *;

$_w:            240px;
$_w-collapsed:  68px;
$_w-mobile:     280px;
$_transition:   width $dur-base $ease-out, transform $dur-base $ease-out;

// ── Base ────────────────────────────────────────────────────────────
.c-sidebar {
  width: $_w;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba($neutral-900, 0.78);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-right: 1px solid rgba($neutral-600, 0.28);
  transition: $_transition;
  z-index: $z-header;
  flex-shrink: 0;

  // ── Header ──────────────────────────────────────────────────────
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4 $space-4 $space-3;
    border-bottom: 1px solid rgba($neutral-600, 0.2);
    gap: $space-2;
    min-height: 64px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $space-3;
    text-decoration: none;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }

  &__brand-icon {
    font-size: 1.3rem;
    color: $brand-primary-soft;
    flex-shrink: 0;
    line-height: 1;
    text-shadow: $shadow-glow-primary;
  }

  &__brand-text {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: $neutral-0;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity $dur-base $ease-out, width $dur-base $ease-out;

    small {
      color: $neutral-400;
      font-weight: 400;
      margin-left: 2px;
    }
  }

  &__collapse-btn {
    background: transparent;
    border: 1px solid rgba($neutral-600, 0.3);
    border-radius: $radius-sm;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $neutral-400;
    flex-shrink: 0;
    transition: background $dur-fast $ease-out, color $dur-fast $ease-out;

    &:hover {
      background: rgba($neutral-700, 0.5);
      color: $neutral-0;
    }
  }

  &__chevron--flip {
    transform: rotate(180deg);
    transition: transform $dur-base $ease-out;
  }

  // ── Nav ─────────────────────────────────────────────────────────
  &__nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: $space-3 $space-3;
    display: flex;
    flex-direction: column;
    gap: $space-1;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba($neutral-600, 0.4); border-radius: $radius-pill; }
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    text-decoration: none;
    color: $neutral-300;
    font-size: 0.9rem;
    font-weight: 500;
    font-family: var(--font-display);
    white-space: nowrap;
    overflow: hidden;
    transition: background $dur-fast $ease-out, color $dur-fast $ease-out;

    &:hover {
      background: rgba($neutral-700, 0.5);
      color: $neutral-0;
    }

    &--active {
      background: rgba($brand-primary, 0.18);
      color: $brand-primary-soft;
      border: 1px solid rgba($brand-primary, 0.3);

      .c-sidebar__link-icon {
        filter: drop-shadow(0 0 6px rgba($brand-primary, 0.6));
      }
    }
  }

  &__link-icon {
    flex-shrink: 0;
  }

  &__link-label {
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity $dur-base $ease-out;
  }

  // ── Footer ──────────────────────────────────────────────────────
  &__foot {
    padding: $space-3 $space-3 $space-4;
    border-top: 1px solid rgba($neutral-600, 0.2);
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2 $space-2;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__avatar {
    width: 34px;
    height: 34px;
    border-radius: $radius-pill;
    background: $gradient-violet;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $neutral-0;
    flex-shrink: 0;
    box-shadow: $shadow-glow-primary;
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: opacity $dur-base $ease-out;
  }

  &__user-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: $neutral-0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-role {
    font-size: 0.75rem;
    color: $neutral-400;
    text-transform: capitalize;
  }

  &__logout {
    display: flex;
    align-items: center;
    gap: $space-3;
    width: 100%;
    padding: $space-3 $space-4;
    background: transparent;
    border: 1px solid rgba($neutral-600, 0.25);
    border-radius: $radius-md;
    color: $neutral-400;
    font-size: 0.88rem;
    font-weight: 500;
    font-family: var(--font-display);
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    transition: background $dur-fast $ease-out, color $dur-fast $ease-out, border-color $dur-fast $ease-out;

    &:hover {
      background: rgba($state-error, 0.12);
      color: $state-error;
      border-color: rgba($state-error, 0.3);
    }
  }

  &__coins {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    background: rgba($brand-primary, 0.1);
    border: 1px solid rgba($brand-primary, 0.2);
    overflow: hidden;
    white-space: nowrap;

    &-icon { font-size: 1rem; flex-shrink: 0; }
    &-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: $brand-primary-soft;
      font-family: var(--font-display);
    }
  }

  // ── Collapsed (desktop) ─────────────────────────────────────────
  &--collapsed {
    width: $_w-collapsed;

    .c-sidebar__brand-text,
    .c-sidebar__link-label,
    .c-sidebar__user-info {
      opacity: 0;
      max-width: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .c-sidebar__head    { justify-content: center; padding: $space-4 $space-2 $space-3; }
    .c-sidebar__brand   { justify-content: center; flex: none; }
    .c-sidebar__collapse-btn { display: none; }

    .c-sidebar__link    { justify-content: center; padding: $space-3; gap: 0; }
    .c-sidebar__user    { justify-content: center; padding: $space-2 0; }
    .c-sidebar__logout  { justify-content: center; padding: $space-3; gap: 0; }
    .c-sidebar__coins   { justify-content: center; padding: $space-2; gap: 0; }
  }

  // ── Mobile ──────────────────────────────────────────────────────
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: $_w-mobile;
    height: 100dvh;
    transform: translateX(-100%);
    z-index: $z-overlay;

    &--mobile-open {
      transform: translateX(0);
      box-shadow: $shadow-lg;
    }

    // Reset collapsed on mobile
    &--collapsed {
      width: $_w-mobile;

      .c-sidebar__brand-text,
      .c-sidebar__link-label,
      .c-sidebar__user-info { opacity: 1; max-width: unset; pointer-events: auto; overflow: visible; }

      .c-sidebar__head    { justify-content: space-between; padding: $space-4; }
      .c-sidebar__brand   { flex: 1; justify-content: flex-start; }
      .c-sidebar__collapse-btn { display: flex; }
      .c-sidebar__link    { justify-content: flex-start; padding: $space-3 $space-4; gap: $space-3; }
      .c-sidebar__user    { justify-content: flex-start; padding: $space-2 $space-2; }
      .c-sidebar__logout  { justify-content: flex-start; padding: $space-3 $space-4; gap: $space-3; }
      .c-sidebar__coins   { justify-content: flex-start; padding: $space-2 $space-3; }
    }
  }
}

// ── Coin toast (global, fora do scoped sidebar) ──────────────────
.c-coin-toast {
  position: fixed;
  bottom: $space-6;
  right: $space-6;
  z-index: $z-overlay + 10;
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  background: rgba($neutral-800, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba($brand-primary, 0.4);
  border-radius: $radius-pill;
  box-shadow: $shadow-glow-primary, $shadow-md;
  color: $neutral-0;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-display);
  pointer-events: none;

  &__icon { font-size: 1.1rem; }
  &__text { color: $brand-primary-soft; }
}

// Transition
.coin-toast-enter-active,
.coin-toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.coin-toast-enter-from,
.coin-toast-leave-to    { opacity: 0; transform: translateY(12px); }
</style>
