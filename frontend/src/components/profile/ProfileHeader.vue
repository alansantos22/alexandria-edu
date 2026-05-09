<template>
  <header class="p-profile-header">
    <!-- Avatar + identidade -->
    <div class="p-profile-header__identity">
      <div class="p-profile-header__avatar-wrap">
        <img
          :src="user.avatarUrl"
          :alt="`Avatar de ${user.username}`"
          class="p-profile-header__avatar"
          loading="lazy"
        />
        <span class="p-profile-header__level">{{ user.level }}</span>
      </div>

      <div class="p-profile-header__info">
        <div class="p-profile-header__name-row">
          <h1 class="p-profile-header__username">@{{ user.username }}</h1>
          <span v-if="user.isOwnProfile" class="c-badge c-badge--gold p-profile-header__own-badge">
            Seu perfil
          </span>
        </div>

        <p class="p-profile-header__meta">
          Membro desde {{ memberSince }} · Nível {{ user.level }}
        </p>

        <!-- Barra de XP -->
        <div class="p-profile-header__xp-section">
          <div class="c-xp-bar" role="progressbar" :aria-valuenow="xpPercent" aria-valuemin="0" aria-valuemax="100">
            <div class="c-xp-bar__fill" :style="{ width: xpPercent + '%' }" />
          </div>
          <span class="p-profile-header__xp-label">
            {{ user.xpInCurrentLevel }} / {{ user.xpPerLevel }} XP
          </span>
        </div>

        <!-- Stats rápidas -->
        <div class="p-profile-header__quick-stats">
          <span class="p-profile-header__stat">
            🔥 <strong>{{ user.streakDays }}</strong> dias
          </span>
          <span class="p-profile-header__stat">
            💰 <strong>{{ user.coinsBalance.toLocaleString('pt-BR') }}</strong> moedas
          </span>
        </div>
      </div>
    </div>

    <!-- Ação do próprio perfil -->
    <div v-if="user.isOwnProfile" class="p-profile-header__actions">
      <button class="c-btn c-btn--ghost c-btn--sm" disabled title="Em breve">
        ✏️ Editar perfil
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
})

const xpPercent = computed(() =>
  Math.min(100, Math.round((props.user.xpInCurrentLevel / props.user.xpPerLevel) * 100))
)

const memberSince = computed(() => {
  const d = new Date(props.user.memberSince)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})
</script>

<style scoped lang="scss">
.p-profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-5;
  padding: $space-5 $space-6;
  border-radius: $radius-xl;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  margin-bottom: $space-5;
  flex-wrap: wrap;

  &__identity {
    display: flex;
    align-items: flex-start;
    gap: $space-5;
    flex: 1;
  }

  &__avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  &__avatar {
    width: 80px;
    height: 80px;
    border-radius: $radius-xl;
    border: 2px solid var(--color-primary);
    background: var(--bg-elevated);
    display: block;

    @include breakpoint(md) { width: 96px; height: 96px; }
  }

  &__level {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gradient-violet);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: $radius-pill;
    white-space: nowrap;
    box-shadow: $shadow-sm;
    border: 1px solid rgba(255,255,255,0.15);
  }

  &__info { flex: 1; min-width: 0; padding-top: $space-1; }

  &__name-row {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;
    margin-bottom: $space-1;
  }

  &__username {
    font-size: clamp(#{$fs-lg}, 3vw, #{$fs-2xl});
    margin: 0;
    color: var(--text-primary);
  }

  &__own-badge { font-size: 0.7rem; }

  &__meta {
    font-size: $fs-sm;
    color: var(--text-muted);
    margin-bottom: $space-3;
  }

  &__xp-section {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-3;
  }

  &__xp-label {
    font-size: $fs-xs;
    color: var(--text-muted);
    white-space: nowrap;
  }

  &__quick-stats {
    display: flex;
    gap: $space-4;
    flex-wrap: wrap;
  }

  &__stat {
    font-size: $fs-sm;
    color: var(--text-secondary);

    strong { color: var(--text-primary); }
  }

  &__actions { align-self: center; }
}
</style>
