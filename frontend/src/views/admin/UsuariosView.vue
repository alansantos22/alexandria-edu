<template>
  <section class="p-admin__empty a-fade-in-up">
    <Users :size="40" class="p-admin__empty-icon" />
    <h2>Gestão de Usuários</h2>
    <p>Papéis, permissões e histórico de alunos — em breve.</p>
  </section>
</template>

<script setup>
import { Users } from 'lucide-vue-next'
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-admin__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: $space-9 $space-4;
  gap: $space-3;
  color: var(--text-muted);

  h2 { color: var(--text-secondary); font-size: $fs-lg; }
  p  { font-size: $fs-sm; max-width: 360px; }
}

.p-admin__empty-icon { opacity: 0.3; }
</style>
