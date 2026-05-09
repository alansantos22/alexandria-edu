<template>
  <div class="l-root" :class="{ 'l-root--app': showSidebar, 'l-root--collapsed': sidebarCollapsed && showSidebar }">

    <!-- Sidebar (apenas em rotas autenticadas) -->
    <AppSidebar
      v-if="showSidebar"
      :collapsed="sidebarCollapsed"
      :mobile-open="sidebarMobileOpen"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @close-mobile="sidebarMobileOpen = false"
    />

    <!-- Conteúdo principal -->
    <div :class="showSidebar ? 'l-app__content' : ''">
      <router-view v-slot="{ Component }">
        <transition name="fade-page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- Overlay mobile (fecha ao clicar fora) -->
    <Transition name="t-overlay">
      <div
        v-if="showSidebar && sidebarMobileOpen"
        class="l-app__overlay"
        @click="sidebarMobileOpen = false"
        aria-hidden="true"
      />
    </Transition>

    <!-- FAB mobile para abrir sidebar -->
    <Transition name="t-fab">
      <button
        v-if="showSidebar"
        class="l-app__fab"
        :class="{ 'l-app__fab--open': sidebarMobileOpen }"
        @click="sidebarMobileOpen = !sidebarMobileOpen"
        aria-label="Abrir menu de navegação"
      >
        <span class="l-app__fab-icon">{{ sidebarMobileOpen ? '✕' : '☰' }}</span>
      </button>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/shared/AppSidebar.vue'

const route = useRoute()

const sidebarCollapsed  = ref(false)
const sidebarMobileOpen = ref(false)

const showSidebar = computed(() => !!route.meta.requiresAuth)
</script>

<style lang="scss">
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity $dur-base $ease-out, transform $dur-base $ease-out;
}
.fade-page-enter-from { opacity: 0; transform: translateY(8px); }
.fade-page-leave-to   { opacity: 0; transform: translateY(-4px); }

.t-overlay-enter-active,
.t-overlay-leave-active { transition: opacity $dur-base $ease-out; }
.t-overlay-enter-from,
.t-overlay-leave-to     { opacity: 0; }

.t-fab-enter-active,
.t-fab-leave-active { transition: opacity $dur-base $ease-out, transform $dur-base $ease-spring; }
.t-fab-enter-from,
.t-fab-leave-to     { opacity: 0; transform: scale(0.7); }
</style>
