<template>
  <router-view v-slot="{ Component }">
    <transition name="fade-page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
// Root shell · transições e layout global ficam no main.scss
</script>

<style lang="scss">
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity $dur-base $ease-out, transform $dur-base $ease-out;
}
.fade-page-enter-from { opacity: 0; transform: translateY(8px); }
.fade-page-leave-to   { opacity: 0; transform: translateY(-4px); }
</style>
