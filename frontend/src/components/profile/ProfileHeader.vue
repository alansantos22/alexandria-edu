<template>
  <header class="p-profile-header">
    <!-- Avatar + identidade -->
    <div class="p-profile-header__identity">
      <div class="p-profile-header__avatar-wrap" :style="frameStyle">
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

        <!-- Bio do usuário -->
        <p v-if="bio" class="p-profile-header__bio">{{ bio }}</p>

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
      <button class="c-btn c-btn--ghost c-btn--sm" @click="$emit('edit')">
        ✏️ Editar perfil
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user:          { type: Object, required: true },
  customization: { type: Object, default: () => ({}) },
})

defineEmits(['edit'])

// ─── Frame CSS mapeado por preset-key ────────────────────────────────────────

const FRAME_CSS = {
  // ── Originais ──────────────────────────────────────────────────────────────
  'glow-gold': {
    border:    '3px solid #FFD166',
    boxShadow: '0 0 0 2px rgba(255,209,102,0.15), 0 0 20px rgba(255,209,102,0.7), 0 0 40px rgba(255,209,102,0.3)',
  },
  'neon-blue': {
    border:    '3px solid #29E0FF',
    boxShadow: '0 0 0 2px rgba(41,224,255,0.15), 0 0 20px rgba(41,224,255,0.7), 0 0 40px rgba(41,224,255,0.3)',
  },
  'fire': {
    border:    '3px solid #FF4D6D',
    boxShadow: '0 0 0 2px rgba(255,77,109,0.15), 0 0 20px rgba(255,77,109,0.7), 0 0 40px rgba(255,77,109,0.3)',
  },
  'rainbow': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, linear-gradient(135deg, #6C5CE7, #00D9C0, #FF6B9D, #FFD166) border-box',
    boxShadow:  '0 0 24px rgba(108,92,231,0.5)',
  },
  'aurora': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, linear-gradient(135deg, #6C5CE7, #00D9C0) border-box',
    boxShadow:  '0 0 20px rgba(0,217,192,0.6)',
  },
  'cyber-green': {
    border:    '3px solid #00ff88',
    boxShadow: '0 0 0 2px rgba(0,255,136,0.15), 0 0 20px rgba(0,255,136,0.7), 0 0 40px rgba(0,255,136,0.3)',
  },
  // ── Novos efeitos ──────────────────────────────────────────────────────────
  'lightning': {
    border:    '3px solid #FFE033',
    boxShadow: '0 0 8px 2px #FFE033, 0 0 24px 4px #00A8FF, 0 0 48px 8px rgba(255,224,51,0.25)',
    animation: 'frame-lightning 0.18s steps(1) infinite',
  },
  'led-red': {
    border:    '3px solid #FF1744',
    boxShadow: '0 0 6px 2px #FF1744, 0 0 18px 4px rgba(255,23,68,0.6), 0 0 36px 6px rgba(255,23,68,0.2)',
    animation: 'frame-led-pulse 1.2s ease-in-out infinite',
  },
  'led-green': {
    border:    '3px solid #00E676',
    boxShadow: '0 0 6px 2px #00E676, 0 0 18px 4px rgba(0,230,118,0.6), 0 0 36px 6px rgba(0,230,118,0.2)',
    animation: 'frame-led-pulse 1.2s ease-in-out infinite',
  },
  'holographic': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, conic-gradient(from 0deg, #FF6B9D, #FFD166, #00D9C0, #6C5CE7, #FF6B9D) border-box',
    boxShadow:  '0 0 20px rgba(108,92,231,0.4)',
    animation:  'frame-holo-spin 3s linear infinite',
  },
  'glitch': {
    border:    '3px solid #FF00FF',
    boxShadow: '2px 0 0 0 #00FFFF, -2px 0 0 0 #FF00FF, 0 0 20px rgba(255,0,255,0.6)',
    animation: 'frame-glitch 2.5s steps(1) infinite',
  },
  'stardust': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, linear-gradient(135deg, #FFD700, #FFF8DC, #FFD700, #DAA520, #FFFACD) border-box',
    boxShadow:  '0 0 16px rgba(255,215,0,0.7), 0 0 32px rgba(255,215,0,0.3)',
    animation:  'frame-stardust 2s ease-in-out infinite',
  },
  'plasma': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, linear-gradient(135deg, #BF00FF, #00FFFF, #FF007F, #BF00FF) border-box',
    boxShadow:  '0 0 20px rgba(191,0,255,0.5), 0 0 40px rgba(0,255,255,0.3)',
    animation:  'frame-plasma 4s linear infinite',
  },
  'ice': {
    border:     '3px solid transparent',
    background: 'linear-gradient(#181C30, #181C30) padding-box, linear-gradient(135deg, #A8E6FF, #FFFFFF, #87CEEB, #E0F7FF) border-box',
    boxShadow:  '0 0 16px rgba(168,230,255,0.6), 0 0 32px rgba(135,206,235,0.3)',
    animation:  'frame-ice-shimmer 3s ease-in-out infinite',
  },
}

const frameStyle = computed(() => {
  const frameItem = props.customization?.frame
  if (!frameItem?.imageUrl?.startsWith('frame:')) return {}
  const key = frameItem.imageUrl.slice(6)
  return FRAME_CSS[key] || {}
})

const bio = computed(() => props.customization?.bio || null)

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
    border-radius: $radius-xl;
    border: 2px solid var(--color-primary);
    transition: border-color $dur-base, box-shadow $dur-base;
  }

  &__avatar {
    width: 80px;
    height: 80px;
    border-radius: $radius-lg;
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
    margin-bottom: $space-2;
  }

  &__bio {
    font-size: $fs-sm;
    color: var(--text-secondary);
    margin-bottom: $space-3;
    line-height: 1.55;
    font-style: italic;
    opacity: 0.85;
    max-width: 560px;
    white-space: pre-wrap;
    word-break: break-word;
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
