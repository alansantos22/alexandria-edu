<template>
  <div class="a-fade-in-up">
    <!-- ── Sub-tabs ─────────────────────────────────────────────────── -->
    <nav class="p-edificios__subtabs">
      <button
        :class="['p-edificios__subtab', { 'is-active': mode === 'material' }]"
        @click="mode = 'material'"
      >
        <Palette :size="15" />
        Novo Material
      </button>
      <button
        :class="['p-edificios__subtab', { 'is-active': mode === 'edificio' }]"
        @click="mode = 'edificio'"
      >
        <Box :size="15" />
        Novo Edifício
      </button>
    </nav>

    <!-- ── Conteúdo ──────────────────────────────────────────────────── -->
    <div v-if="mode === 'material'" class="p-edificios__panel">
      <AdminCreateMaterial @created="onMaterialCreated" />
    </div>

    <div v-else class="p-edificios__panel">
      <AdminCreateBuilding ref="buildingRef" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Palette, Box } from 'lucide-vue-next'
import AdminCreateMaterial from '@/components/admin/AdminCreateMaterial.vue'
import AdminCreateBuilding from '@/components/admin/AdminCreateBuilding.vue'

const mode = ref('material')
const buildingRef = ref(null)

function onMaterialCreated() {
  mode.value = 'edificio'
  setTimeout(() => buildingRef.value?.loadMaterials(), 50)
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.p-edificios__subtabs {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-5;
}

.p-edificios__subtab {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-5;
  border-radius: $radius-lg;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-muted);
  font-size: $fs-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all $dur-fast $ease-out;

  &:hover:not(.is-active) {
    border-color: var(--color-primary);
    color: var(--text-secondary);
  }

  &.is-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 10px rgba(108, 92, 231, 0.35);
  }
}

.p-edificios__panel {
  display: flex;
  justify-content: center;

  > * { max-width: 640px; width: 100%; }
}
</style>
