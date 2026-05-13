<template>
  <span v-if="text" class="promo-badge">{{ text }}</span>
</template>

<script setup>
defineProps({ text: { type: String, default: '' } })
</script>

<style lang="scss" scoped>
.promo-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ff5e62, #ff9966);
  color: white;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
</style>
