<template>
  <Teleport to="body">
    <div class="c-modal-overlay c-profile-customize-overlay" @click.self="$emit('close')">
      <div class="c-modal c-profile-customize" role="dialog" aria-modal="true" aria-label="Personalizar perfil">

        <!-- Cabeçalho -->
        <div class="c-profile-customize__header">
          <h2 class="c-profile-customize__title">
            🎨 Personalizar Perfil
          </h2>
          <button
            class="c-profile-customize__close c-btn c-btn--ghost c-btn--icon"
            @click="$emit('close')"
            aria-label="Fechar"
          >✕</button>
        </div>

        <!-- Loading do inventário -->
        <div v-if="loading" class="c-profile-customize__loading">
          <div class="c-profile-customize__spinner" />
          <span>Carregando seu inventário…</span>
        </div>

        <!-- Conteúdo -->
        <template v-else>
          <!-- Abas -->
          <div class="c-profile-customize__tabs" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :id="`tab-${tab.id}`"
              :aria-selected="activeTab === tab.id"
              :class="['c-profile-customize__tab', { 'is-active': activeTab === tab.id }]"
              role="tab"
              @click="activeTab = tab.id"
            >
              <span class="c-profile-customize__tab-icon">{{ tab.icon }}</span>
              <span class="c-profile-customize__tab-label">{{ tab.label }}</span>
              <span v-if="tab.count > 0" class="c-profile-customize__tab-badge">{{ tab.count }}</span>
            </button>
          </div>

          <!-- Painel de abas -->
          <div class="c-profile-customize__panel">

            <!-- ─── Wallpaper ─────────────────────────────────── -->
            <div v-if="activeTab === 'wallpaper'" class="c-profile-customize__section">
              <p class="c-profile-customize__hint">
                Escolha um fundo para o seu perfil. Itens são comprados no
                <router-link to="/marketplace" @click="$emit('close')" class="c-profile-customize__link">
                  Marketplace
                </router-link>.
              </p>

              <div class="c-profile-customize__grid">
                <!-- Opção padrão -->
                <button
                  :class="['c-customize-item', { 'is-active': !equippedIds.wallpaper }]"
                  @click="unequip('wallpaper')"
                  title="Padrão (sem wallpaper)"
                >
                  <div class="c-customize-item__preview c-customize-item__preview--default">
                    <span>Padrão</span>
                  </div>
                  <span class="c-customize-item__name">Padrão</span>
                  <span v-if="!equippedIds.wallpaper" class="c-customize-item__equipped">✓ Equipado</span>
                </button>

                <!-- Itens do inventário -->
                <button
                  v-for="item in wallpaperItems"
                  :key="item.id"
                  :class="['c-customize-item', { 'is-active': equippedIds.wallpaper === item.id }]"
                  :title="item.name"
                  @click="equip(item)"
                >
                  <div
                    class="c-customize-item__preview"
                    :style="getWallpaperPreviewStyle(item.imageUrl)"
                  ></div>
                  <span class="c-customize-item__name">{{ item.name }}</span>
                  <span :class="['c-customize-item__rarity', `c-customize-item__rarity--${item.rarity}`]">
                    {{ rarityLabel[item.rarity] }}
                  </span>
                  <span v-if="equippedIds.wallpaper === item.id" class="c-customize-item__equipped">✓ Equipado</span>
                </button>
              </div>

              <div v-if="!wallpaperItems.length" class="c-profile-customize__empty">
                <span>🛍️</span>
                <p>Você não tem wallpapers no inventário.</p>
                <router-link to="/marketplace" @click="$emit('close')" class="c-btn c-btn--sm">
                  Ir ao Marketplace
                </router-link>
              </div>
            </div>

            <!-- ─── Frame do Avatar ────────────────────────────── -->
            <div v-if="activeTab === 'frame'" class="c-profile-customize__section">
              <p class="c-profile-customize__hint">
                Adicione uma moldura ao seu avatar para se destacar.
              </p>

              <!-- Preview ao vivo -->
              <div class="c-profile-customize__frame-preview">
                <div class="c-profile-customize__avatar-wrap" :style="previewFrameStyle">
                  <img
                    :src="avatarUrl"
                    alt="Preview do avatar"
                    class="c-profile-customize__avatar-img"
                  />
                </div>
                <span class="c-profile-customize__preview-label">Preview</span>
              </div>

              <div class="c-profile-customize__grid">
                <!-- Padrão -->
                <button
                  :class="['c-customize-item', { 'is-active': !equippedIds.frame }]"
                  @click="unequip('frame')"
                >
                  <div class="c-customize-item__frame-swatch c-customize-item__frame-swatch--default" />
                  <span class="c-customize-item__name">Padrão</span>
                  <span v-if="!equippedIds.frame" class="c-customize-item__equipped">✓ Equipado</span>
                </button>

                <button
                  v-for="item in frameItems"
                  :key="item.id"
                  :class="['c-customize-item', { 'is-active': equippedIds.frame === item.id }]"
                  :title="item.name"
                  @click="equip(item); previewFrameItemId = item.id"
                  @mouseenter="previewFrameItemId = item.id"
                  @mouseleave="previewFrameItemId = equippedIds.frame || null"
                >
                  <div
                    class="c-customize-item__frame-swatch"
                    :style="getFrameSwatchStyle(item.imageUrl)"
                  />
                  <span class="c-customize-item__name">{{ item.name }}</span>
                  <span :class="['c-customize-item__rarity', `c-customize-item__rarity--${item.rarity}`]">
                    {{ rarityLabel[item.rarity] }}
                  </span>
                  <span v-if="equippedIds.frame === item.id" class="c-customize-item__equipped">✓ Equipado</span>
                </button>
              </div>

              <div v-if="!frameItems.length" class="c-profile-customize__empty">
                <span>🛍️</span>
                <p>Você não tem frames no inventário.</p>
                <router-link to="/marketplace" @click="$emit('close')" class="c-btn c-btn--sm">
                  Ir ao Marketplace
                </router-link>
              </div>
            </div>

            <!-- ─── Bio ───────────────────────────────────────── -->
            <div v-if="activeTab === 'bio'" class="c-profile-customize__section">
              <p class="c-profile-customize__hint">
                Escreva uma breve apresentação para os outros usuários. Máx. 200 caracteres.
              </p>

              <div class="c-profile-customize__bio-field">
                <textarea
                  v-model="bioText"
                  class="c-profile-customize__bio-textarea"
                  maxlength="200"
                  rows="4"
                  placeholder="Fale sobre você, seus interesses, sua jornada de aprendizado…"
                />
                <div class="c-profile-customize__bio-footer">
                  <span class="c-profile-customize__bio-count">
                    {{ bioText?.length ?? 0 }}/200
                  </span>
                  <button
                    class="c-btn c-btn--sm c-btn--primary"
                    :disabled="savingBio"
                    @click="saveBio"
                  >
                    <span v-if="savingBio">Salvando…</span>
                    <span v-else>Salvar Bio</span>
                  </button>
                </div>
                <p v-if="bioSaved" class="c-profile-customize__bio-success">
                  ✅ Bio salva com sucesso!
                </p>
              </div>
            </div>

          </div><!-- /panel -->
        </template>

      </div><!-- /modal -->
    </div><!-- /overlay -->
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { marketplaceService } from '@/core/services/marketplace.service.js'
import { updateBio }          from '@/core/services/profile.service.js'

const props = defineProps({
  /** Perfil atual retornado pelo GET /profile */
  profile:   { type: Object, required: true },
  /** URL do avatar exibida no preview do frame */
  avatarUrl: { type: String, required: true },
})

const emit = defineEmits(['close', 'updated'])

// ─── Estado ──────────────────────────────────────────────────────────────────

const loading    = ref(true)
const allItems   = ref([])
const equippedIds = ref({ wallpaper: null, frame: null, badge: null, avatar: null })

const activeTab        = ref('wallpaper')
const previewFrameItemId = ref(null)

const bioText   = ref('')
const savingBio = ref(false)
const bioSaved  = ref(false)

// ─── Mapeamento de estilos CSS para frames ────────────────────────────────────

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

// ─── Helpers de estilo ───────────────────────────────────────────────────────

function getFrameStyle(imageUrl) {
  if (!imageUrl?.startsWith('frame:')) return {}
  const key = imageUrl.slice(6)
  return FRAME_CSS[key] || {}
}

function getFrameSwatchStyle(imageUrl) {
  if (!imageUrl?.startsWith('frame:')) return {}
  const key = imageUrl.slice(6)
  const css = FRAME_CSS[key] || {}
  return {
    ...css,
    borderRadius: '50%',
    width: '100%',
    height: '100%',
  }
}

function getWallpaperPreviewStyle(imageUrl) {
  if (!imageUrl) return { background: 'var(--bg-base)' }
  if (imageUrl.startsWith('css:')) return { background: imageUrl.slice(4) }
  return { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' }
}

// ─── Preview do frame em tempo real ─────────────────────────────────────────

const previewFrameStyle = computed(() => {
  if (!previewFrameItemId.value) return {}
  const item = allItems.value.find(i => i.id === previewFrameItemId.value)
  if (!item) return {}
  return getFrameStyle(item.imageUrl)
})

// ─── Itens filtrados por tipo ─────────────────────────────────────────────────

const wallpaperItems = computed(() => allItems.value.filter(i => i.type === 'wallpaper'))
const frameItems     = computed(() => allItems.value.filter(i => i.type === 'frame'))

// ─── Configuração das abas com contadores ────────────────────────────────────

const tabs = computed(() => [
  { id: 'wallpaper', icon: '🖼️', label: 'Wallpaper',   count: wallpaperItems.value.length },
  { id: 'frame',     icon: '✨', label: 'Frame Avatar', count: frameItems.value.length },
  { id: 'bio',       icon: '📝', label: 'Bio',          count: 0 },
])

const rarityLabel = {
  common:    'Comum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
}

// ─── Inicialização ────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const { items, profile: customProfile } = await marketplaceService.getInventory()
    allItems.value = items

    // Sincronizar equipados do inventário com o perfil recebido via props
    const c = props.profile?.customization
    equippedIds.value = {
      wallpaper: c?.wallpaper?.id ?? null,
      frame:     c?.frame?.id     ?? null,
      badge:     c?.badge?.id     ?? null,
      avatar:    c?.avatar?.id    ?? null,
    }

    // Se o backend retornou profile do marketplace, usar como fallback
    if (customProfile) {
      if (!equippedIds.value.wallpaper) equippedIds.value.wallpaper = customProfile.activeWallpaperItemId
      if (!equippedIds.value.frame)     equippedIds.value.frame     = customProfile.activeFrameItemId
    }

    previewFrameItemId.value = equippedIds.value.frame

    // Bio
    bioText.value = props.profile?.customization?.bio ?? ''
  } finally {
    loading.value = false
  }
})

// ─── Ações ────────────────────────────────────────────────────────────────────

async function equip(item) {
  try {
    await marketplaceService.equipItem(item.id)
    equippedIds.value[item.type] = item.id
    if (item.type === 'frame') previewFrameItemId.value = item.id
    emit('updated', { type: item.type, item })
  } catch (err) {
    console.error('Erro ao equipar item:', err)
  }
}

async function unequip(type) {
  try {
    await marketplaceService.equipItem(null, type)
    equippedIds.value[type] = null
    if (type === 'frame') previewFrameItemId.value = null
    emit('updated', { type, item: null })
  } catch (err) {
    console.error('Erro ao desequipar:', err)
  }
}

async function saveBio() {
  savingBio.value = true
  bioSaved.value  = false
  try {
    await updateBio(bioText.value || null)
    bioSaved.value = true
    emit('updated', { type: 'bio', value: bioText.value })
    setTimeout(() => { bioSaved.value = false }, 3000)
  } catch (err) {
    console.error('Erro ao salvar bio:', err)
  } finally {
    savingBio.value = false
  }
}
</script>

<style scoped lang="scss">
// ─── Overlay e Modal ─────────────────────────────────────────────────────────

.c-profile-customize-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  animation: fadeIn $dur-base $ease-out both;
}

.c-profile-customize {
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: $radius-xl;
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: $shadow-lg;
  animation: slideUp $dur-slow $ease-spring both;

  // ─── Header ──────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-5 $space-6;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  &__title {
    font-size: $fs-lg;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  &__close {
    opacity: 0.6;
    transition: opacity $dur-fast;
    &:hover { opacity: 1; }
  }

  // ─── Loading ──────────────────────────────────────────────
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    padding: $space-8;
    color: var(--text-muted);
    font-size: $fs-sm;
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  // ─── Abas ─────────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: $space-1;
    padding: $space-3 $space-5;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    border-radius: $radius-pill;
    font-size: $fs-sm;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all $dur-fast;

    &:hover {
      background: var(--glass-bg);
      color: var(--text-primary);
    }

    &.is-active {
      background: rgba(108, 92, 231, 0.15);
      border-color: rgba(108, 92, 231, 0.4);
      color: var(--color-primary);
    }
  }

  &__tab-icon { font-size: 1rem; }
  &__tab-label { font-size: $fs-sm; }

  &__tab-badge {
    background: var(--color-primary);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: $radius-pill;
    min-width: 18px;
    text-align: center;
  }

  // ─── Painel ───────────────────────────────────────────────
  &__panel {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
  }

  &__section {
    padding: $space-5 $space-6;
  }

  &__hint {
    font-size: $fs-sm;
    color: var(--text-muted);
    margin-bottom: $space-4;
    line-height: 1.5;
  }

  &__link {
    color: var(--color-primary);
    text-decoration: underline;
    &:hover { opacity: 0.8; }
  }

  // ─── Grid de itens ────────────────────────────────────────
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: $space-3;
  }

  // ─── Empty state ──────────────────────────────────────────
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-3;
    padding: $space-7 $space-5;
    text-align: center;
    color: var(--text-muted);

    span { font-size: 2.5rem; }
    p    { font-size: $fs-sm; margin: 0; }
  }

  // ─── Preview do frame ─────────────────────────────────────
  &__frame-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-5;
  }

  &__avatar-wrap {
    width: 80px;
    height: 80px;
    border-radius: $radius-lg;
    border: 2px solid var(--color-primary);
    transition: all $dur-base $ease-out;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__preview-label {
    font-size: $fs-xs;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // ─── Bio ──────────────────────────────────────────────────
  &__bio-field { display: flex; flex-direction: column; gap: $space-3; }

  &__bio-textarea {
    width: 100%;
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    color: var(--text-primary);
    font-size: $fs-sm;
    padding: $space-3 $space-4;
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
    transition: border-color $dur-fast;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    &::placeholder { color: var(--text-muted); }
  }

  &__bio-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  &__bio-count {
    font-size: $fs-xs;
    color: var(--text-muted);
  }

  &__bio-success {
    font-size: $fs-sm;
    color: #2ECC71;
    margin: 0;
  }
}

// ─── Item de customização ────────────────────────────────────────────────────

.c-customize-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  border: 2px solid transparent;
  background: var(--glass-bg);
  cursor: pointer;
  transition: all $dur-base $ease-out;
  text-align: center;
  position: relative;

  &:hover {
    border-color: rgba(108, 92, 231, 0.4);
    transform: translateY(-2px);
  }

  &.is-active {
    border-color: var(--color-primary);
    background: rgba(108, 92, 231, 0.1);
  }

  &__preview {
    width: 100%;
    height: 64px;
    border-radius: $radius-sm;
    border: 1px solid var(--border-subtle);

    &--default {
      background: var(--gradient-night);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $fs-xs;
      color: var(--text-muted);
    }
  }

  &__frame-swatch {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--color-primary);

    &--default { border-color: var(--color-primary); opacity: 0.5; }
  }

  &__name {
    font-size: $fs-xs;
    color: var(--text-secondary);
    font-weight: 500;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  &__rarity {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: $radius-pill;

    &--common    { background: rgba(90,90,90,0.3);  color: #aaa; }
    &--rare      { background: rgba(41,224,255,0.2); color: #29E0FF; }
    &--epic      { background: rgba(108,92,231,0.2); color: #8E7DF0; }
    &--legendary { background: rgba(255,209,102,0.2); color: #FFD166; }
  }

  &__equipped {
    font-size: 0.6rem;
    color: #2ECC71;
    font-weight: 600;
    position: absolute;
    top: $space-2;
    right: $space-2;
    background: rgba(46,204,113,0.15);
    padding: 1px 5px;
    border-radius: $radius-pill;
  }
}

// ─── Animações ───────────────────────────────────────────────────────────────

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
