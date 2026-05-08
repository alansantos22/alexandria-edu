# Frontend Architecture - Hell's December

**Data de Criação:** 29/10/2025  
**Stack Principal:** Vue.js 3 + TypeScript + Pinia + SCSS

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### Arquitetura Baseada em Features
- Cada feature é um módulo independente e auto-contido
- Feature flags permitem ativar/desativar funcionalidades
- Componentes reutilizáveis no design system
- Separação clara: `.vue` (template) + `.ts` (lógica) + `.scss` (estilo)

### Design System Próprio
- **ZERO dependências de UI** (sem Vuetify, Element UI, etc.)
- Todos os componentes criados internamente
- Consistência visual garantida por variáveis SCSS
- Documentação visual de todos os componentes

---

## 📦 STACK TECNOLÓGICO OBRIGATÓRIO

### Core Framework
```json
{
  "vue": "^3.4.x",
  "typescript": "^5.x",
  "vite": "^5.x"
}
```

### State Management
```json
{
  "pinia": "^2.1.x"
}
```

### Styling
```json
{
  "sass": "^1.70.x",
  "sass-loader": "^14.x"
}
```

### Routing
```json
{
  "vue-router": "^4.x"
}
```

### HTTP Client
```json
{
  "axios": "^1.6.x"
}
```

### Utilities
```json
{
  "@vueuse/core": "^10.x",  // Composables utilitários
  "vee-validate": "^4.x",   // Validação de formulários
  "yup": "^1.x"             // Schema validation
}
```

---

## 📁 ESTRUTURA DE PASTAS OBRIGATÓRIA

```
frontend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── App.vue                    # Root component
│   │
│   ├── config/                    # Configurações
│   │   ├── api.config.ts
│   │   ├── router.config.ts
│   │   └── feature-flags.config.ts
│   │
│   ├── assets/                    # Assets estáticos
│   │   ├── scss/
│   │   │   ├── main.scss         # Import principal
│   │   │   ├── _colors.scss      # ⚠️ Variáveis de cores
│   │   │   ├── _mixins.scss      # ⚠️ Mixins reutilizáveis
│   │   │   ├── _spacing.scss     # ⚠️ Sistema de espaçamento
│   │   │   ├── _typography.scss  # ⚠️ Fontes e tipografia
│   │   │   ├── _reset.scss       # CSS reset
│   │   │   └── _animations.scss  # Animações globais
│   │   │
│   │   ├── fonts/                # Web fonts
│   │   └── images/               # Imagens
│   │
│   ├── design-system/             # Design System (componentes base)
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   │   ├── Button.vue
│   │   │   │   ├── Button.ts
│   │   │   │   ├── Button.scss
│   │   │   │   └── Button.types.ts
│   │   │   │
│   │   │   ├── Input/
│   │   │   │   ├── Input.vue
│   │   │   │   ├── Input.ts
│   │   │   │   ├── Input.scss
│   │   │   │   └── Input.types.ts
│   │   │   │
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Dropdown/
│   │   │   ├── Tooltip/
│   │   │   └── ... (todos os componentes base)
│   │   │
│   │   └── index.ts              # Export de todos os componentes
│   │
│   ├── features/                  # Features modulares
│   │   │
│   │   ├── auth/                 # Feature: Autenticação
│   │   │   ├── components/       # Componentes da feature
│   │   │   │   ├── LoginForm/
│   │   │   │   │   ├── LoginForm.vue
│   │   │   │   │   ├── LoginForm.ts
│   │   │   │   │   └── LoginForm.scss
│   │   │   │   └── RegisterForm/
│   │   │   │
│   │   │   ├── composables/      # Composables da feature
│   │   │   │   └── useAuth.ts
│   │   │   │
│   │   │   ├── services/         # Services HTTP
│   │   │   │   └── auth.service.ts
│   │   │   │
│   │   │   ├── store/            # Pinia store
│   │   │   │   └── auth.store.ts
│   │   │   │
│   │   │   ├── models/           # Interfaces e types
│   │   │   │   ├── User.interface.ts
│   │   │   │   └── AuthResponse.interface.ts
│   │   │   │
│   │   │   ├── pipes/            # Filtros e transformações
│   │   │   │   └── formatUserName.pipe.ts
│   │   │   │
│   │   │   ├── validators/       # Validações específicas
│   │   │   │   └── authValidators.ts
│   │   │   │
│   │   │   ├── views/            # Views/Pages da feature
│   │   │   │   ├── LoginView.vue
│   │   │   │   └── RegisterView.vue
│   │   │   │
│   │   │   └── feature-flag.ts   # Feature flag config
│   │   │
│   │   ├── game/                 # Feature: Jogo principal
│   │   │   ├── components/
│   │   │   │   ├── GameCanvas/
│   │   │   │   ├── PlayerHUD/
│   │   │   │   └── MiniMap/
│   │   │   ├── composables/
│   │   │   │   ├── useGameLoop.ts
│   │   │   │   ├── usePlayer.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── services/
│   │   │   │   ├── game.service.ts
│   │   │   │   └── websocket.service.ts
│   │   │   ├── store/
│   │   │   │   ├── game.store.ts
│   │   │   │   └── player.store.ts
│   │   │   ├── models/
│   │   │   │   ├── Player.interface.ts
│   │   │   │   ├── Enemy.interface.ts
│   │   │   │   └── Building.interface.ts
│   │   │   └── views/
│   │   │       └── GameView.vue
│   │   │
│   │   ├── inventory/            # Feature: Inventário
│   │   ├── crafting/             # Feature: Crafting
│   │   ├── map/                  # Feature: Mapa
│   │   └── ... (outras features)
│   │
│   ├── shared/                    # Compartilhado entre features
│   │   ├── components/           # Componentes compartilhados
│   │   ├── composables/          # Composables globais
│   │   ├── services/             # Services globais
│   │   ├── utils/                # Funções utilitárias
│   │   ├── types/                # Types globais
│   │   └── constants/            # Constantes globais
│   │
│   ├── router/                    # Vue Router
│   │   ├── index.ts
│   │   ├── guards/               # Navigation guards
│   │   │   ├── auth.guard.ts
│   │   │   └── feature-flag.guard.ts
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── game.routes.ts
│   │       └── index.ts
│   │
│   └── types/                     # TypeScript global types
│       ├── env.d.ts
│       └── global.d.ts
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── .env.development              # Variáveis de desenvolvimento
├── .env.production               # Variáveis de produção
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 DESIGN SYSTEM - ESTRUTURA DE COMPONENTES

### Separação Obrigatória: .vue + .ts + .scss

**⚠️ REGRA CRÍTICA:** Componentes NUNCA devem ter tudo em um arquivo `.vue`

#### Exemplo: Button Component

```
design-system/
└── components/
    └── Button/
        ├── Button.vue       # Template apenas
        ├── Button.ts        # Lógica e setup
        ├── Button.scss      # Estilos
        └── Button.types.ts  # Tipos e interfaces
```

#### Button.vue (Template apenas)
```vue
<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script src="./Button.ts"></script>
<style src="./Button.scss" scoped lang="scss"></style>
```

#### Button.ts (Lógica)
```typescript
import { defineComponent, computed } from 'vue';
import type { ButtonProps } from './Button.types';

export default defineComponent({
  name: 'HDButton',  // HD = Hell's December prefix
  
  props: {
    variant: {
      type: String as () => ButtonProps['variant'],
      default: 'primary',
      validator: (value: string) => 
        ['primary', 'secondary', 'danger', 'ghost'].includes(value)
    },
    size: {
      type: String as () => ButtonProps['size'],
      default: 'medium',
      validator: (value: string) => 
        ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['click'],

  setup(props, { emit }) {
    const buttonClasses = computed(() => ({
      'hd-button': true,
      [`hd-button--${props.variant}`]: true,
      [`hd-button--${props.size}`]: true,
      'hd-button--disabled': props.disabled,
      'hd-button--loading': props.loading
    }));

    const handleClick = (event: MouseEvent) => {
      if (!props.disabled && !props.loading) {
        emit('click', event);
      }
    };

    return {
      buttonClasses,
      handleClick
    };
  }
});
```

#### Button.scss (Estilos)
```scss
@import '@/assets/scss/colors';
@import '@/assets/scss/mixins';
@import '@/assets/scss/spacing';

.hd-button {
  @include button-reset;
  @include transition(all);
  
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-md;
  font-weight: 600;
  cursor: pointer;
  
  // Variantes
  &--primary {
    background-color: $color-primary;
    color: $color-white;
    
    &:hover:not(.hd-button--disabled) {
      background-color: $color-primary-dark;
    }
  }
  
  &--secondary {
    background-color: $color-secondary;
    color: $color-white;
  }
  
  &--danger {
    background-color: $color-danger;
    color: $color-white;
  }
  
  &--ghost {
    background-color: transparent;
    color: $color-primary;
    border: 2px solid $color-primary;
  }
  
  // Tamanhos
  &--small {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
  }
  
  &--large {
    padding: $spacing-lg $spacing-xl;
    font-size: $font-size-lg;
  }
  
  // Estados
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--loading {
    position: relative;
    color: transparent;
    
    &::after {
      @include loading-spinner;
    }
  }
}
```

#### Button.types.ts (Tipos)
```typescript
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void;
}
```

---

## 🎨 ARQUIVOS DE CONFIGURAÇÃO SCSS

### _colors.scss
```scss
// Primary Colors
$color-primary: #FF4136;
$color-primary-light: #FF6B5E;
$color-primary-dark: #CC352B;

// Secondary Colors
$color-secondary: #0074D9;
$color-secondary-light: #339AE8;
$color-secondary-dark: #005CAD;

// Neutrals
$color-white: #FFFFFF;
$color-black: #111111;
$color-gray-100: #F7F7F7;
$color-gray-200: #E5E5E5;
$color-gray-300: #D4D4D4;
$color-gray-400: #A3A3A3;
$color-gray-500: #737373;
$color-gray-600: #525252;
$color-gray-700: #404040;
$color-gray-800: #262626;
$color-gray-900: #171717;

// Semantic Colors
$color-success: #2ECC40;
$color-warning: #FF851B;
$color-danger: #FF4136;
$color-info: #0074D9;

// Game Specific
$color-health: #2ECC40;
$color-mana: #0074D9;
$color-stamina: #FFDC00;
$color-enemy: #FF4136;
$color-npc: #01FF70;

// Backgrounds
$bg-primary: #1A1A1A;
$bg-secondary: #2A2A2A;
$bg-tertiary: #3A3A3A;

// Borders
$border-color: $color-gray-700;
$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-full: 9999px;

// Export como CSS variables também
:root {
  --color-primary: #{$color-primary};
  --color-secondary: #{$color-secondary};
  // ... todas as outras cores
}
```

### _spacing.scss
```scss
// Spacing System (8px base)
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;

// Container
$container-max-width: 1280px;
$container-padding: $spacing-lg;

// Grid
$grid-gutter: $spacing-md;
$grid-columns: 12;

// Export como CSS variables
:root {
  --spacing-xs: #{$spacing-xs};
  --spacing-sm: #{$spacing-sm};
  --spacing-md: #{$spacing-md};
  --spacing-lg: #{$spacing-lg};
  --spacing-xl: #{$spacing-xl};
  --spacing-2xl: #{$spacing-2xl};
  --spacing-3xl: #{$spacing-3xl};
}
```

### _typography.scss
```scss
// Font Families
$font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', monospace;
$font-display: 'Orbitron', sans-serif;  // Para títulos do jogo

// Font Sizes
$font-size-xs: 12px;
$font-size-sm: 14px;
$font-size-base: 16px;
$font-size-lg: 18px;
$font-size-xl: 20px;
$font-size-2xl: 24px;
$font-size-3xl: 30px;
$font-size-4xl: 36px;
$font-size-5xl: 48px;

// Font Weights
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
$font-weight-extrabold: 800;

// Line Heights
$line-height-tight: 1.2;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;

// Letter Spacing
$letter-spacing-tight: -0.025em;
$letter-spacing-normal: 0;
$letter-spacing-wide: 0.025em;

// Export
:root {
  --font-primary: #{$font-primary};
  --font-mono: #{$font-mono};
  --font-display: #{$font-display};
  --font-size-base: #{$font-size-base};
}
```

### _mixins.scss
```scss
// Flexbox
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// Reset
@mixin button-reset {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

@mixin input-reset {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  outline: none;
}

// Transitions
@mixin transition($properties...) {
  transition: $properties 0.2s ease-in-out;
}

// Loading Spinner
@mixin loading-spinner($size: 20px) {
  content: '';
  position: absolute;
  width: $size;
  height: $size;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

// Responsive
@mixin mobile {
  @media (max-width: 768px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 769px) and (max-width: 1024px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1025px) {
    @content;
  }
}

// Truncate
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin line-clamp($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Shadows
@mixin shadow-sm {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

@mixin shadow-md {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@mixin shadow-lg {
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## 🚩 FEATURE FLAGS SYSTEM

### Configuração Central

```typescript
// src/config/feature-flags.config.ts
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  releaseDate?: string;
}

export const featureFlags: Record<string, FeatureFlag> = {
  FEATURE_AUTH: {
    key: 'auth',
    enabled: true,
    description: 'Sistema de autenticação'
  },
  FEATURE_CRAFTING: {
    key: 'crafting',
    enabled: false,
    description: 'Sistema de crafting',
    releaseDate: '2025-11-15'
  },
  FEATURE_MULTIPLAYER: {
    key: 'multiplayer',
    enabled: false,
    description: 'Modo multiplayer',
    releaseDate: '2025-12-01'
  },
  FEATURE_INVENTORY: {
    key: 'inventory',
    enabled: true,
    description: 'Sistema de inventário'
  }
};

export class FeatureFlagService {
  static isEnabled(key: string): boolean {
    const flag = featureFlags[key];
    return flag ? flag.enabled : false;
  }

  static enable(key: string): void {
    if (featureFlags[key]) {
      featureFlags[key].enabled = true;
    }
  }

  static disable(key: string): void {
    if (featureFlags[key]) {
      featureFlags[key].enabled = false;
    }
  }

  static getAll(): FeatureFlag[] {
    return Object.values(featureFlags);
  }
}
```

### Composable useFeatureFlag

```typescript
// src/shared/composables/useFeatureFlag.ts
import { computed } from 'vue';
import { FeatureFlagService } from '@/config/feature-flags.config';

export function useFeatureFlag(flagKey: string) {
  const isEnabled = computed(() => FeatureFlagService.isEnabled(flagKey));

  return {
    isEnabled
  };
}
```

### Route Guard para Feature Flags

```typescript
// src/router/guards/feature-flag.guard.ts
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { FeatureFlagService } from '@/config/feature-flags.config';

export function featureFlagGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const featureFlag = to.meta.featureFlag as string;

  if (featureFlag && !FeatureFlagService.isEnabled(featureFlag)) {
    next('/coming-soon');
  } else {
    next();
  }
}
```

### Uso em Rotas

```typescript
// src/router/routes/crafting.routes.ts
export const craftingRoutes = [
  {
    path: '/crafting',
    name: 'crafting',
    component: () => import('@/features/crafting/views/CraftingView.vue'),
    meta: {
      requiresAuth: true,
      featureFlag: 'FEATURE_CRAFTING'  // ⚠️ Bloqueada se disabled
    }
  }
];
```

### Uso em Componentes

```vue
<template>
  <div>
    <h1>Inventory</h1>
    
    <!-- Só mostra se feature estiver ativa -->
    <CraftingButton v-if="isCraftingEnabled" />
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlag } from '@/shared/composables/useFeatureFlag';

const { isEnabled: isCraftingEnabled } = useFeatureFlag('FEATURE_CRAFTING');
</script>
```

---

## 🗂️ ORGANIZAÇÃO POR FEATURES

### Estrutura de uma Feature Completa

Cada feature deve ser **auto-contida** e seguir esta estrutura:

```
features/auth/
├── components/          # Componentes específicos da feature
├── composables/         # Composables (useAuth, useLogin, etc.)
├── services/            # Services HTTP (auth.service.ts)
├── store/              # Pinia store (auth.store.ts)
├── models/             # Interfaces e Types
├── pipes/              # Filtros e transformações
├── validators/         # Validações específicas
├── views/              # Views/Pages
├── feature-flag.ts     # Config da feature flag
└── index.ts            # Export público da feature
```

### Exemplo: Feature Auth

#### auth.store.ts
```typescript
// src/features/auth/store/auth.store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../models/User.interface';
import { AuthService } from '../services/auth.service';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userName = computed(() => user.value?.username || 'Guest');

  // Actions
  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const response = await AuthService.login(email, password);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  async function fetchUser() {
    if (!token.value) return;
    
    try {
      user.value = await AuthService.getProfile();
    } catch (error) {
      await logout();
    }
  }

  return {
    // State
    user,
    token,
    loading,
    // Getters
    isAuthenticated,
    userName,
    // Actions
    login,
    logout,
    fetchUser
  };
});
```

#### auth.service.ts
```typescript
// src/features/auth/services/auth.service.ts
import { apiClient } from '@/shared/services/api.service';
import type { LoginResponse, User } from '../models/User.interface';

export class AuthService {
  private static readonly BASE_URL = '/api/v1/auth';

  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${this.BASE_URL}/login`,
      { email, password }
    );
    return response.data;
  }

  static async register(email: string, password: string, username: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${this.BASE_URL}/register`,
      { email, password, username }
    );
    return response.data;
  }

  static async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${this.BASE_URL}/profile`);
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/logout`);
  }
}
```

---

## 🌍 VARIÁVEIS DE AMBIENTE

### .env.development
```env
# API
VITE_API_URL=http://localhost:3003
VITE_WS_URL=ws://localhost:3004

# Feature Flags (podem ser overridden)
VITE_FEATURE_MULTIPLAYER=false
VITE_FEATURE_CRAFTING=false

# Debug
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### .env.production
```env
# API
VITE_API_URL=https://api.hellsdecember.com
VITE_WS_URL=wss://ws.hellsdecember.com

# Feature Flags
VITE_FEATURE_MULTIPLAYER=true
VITE_FEATURE_CRAFTING=true

# Debug
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

### vite.config.ts (Build Production)
```typescript
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [vue()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    
    build: {
      target: 'esnext',
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'design-system': ['/src/design-system'],
            'three': ['three']
          }
        }
      }
    },
    
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3003',
          changeOrigin: true
        }
      }
    }
  };
});
```

---

## 🔄 GUIA DE MIGRAÇÃO: JavaScript → TypeScript

### Passo 1: Configurar TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules"]
}
```

### Passo 2: Renomear Arquivos
```bash
# .js → .ts
# .vue (com <script> → <script lang="ts">)
```

### Passo 3: Tipar Componentes Existentes

**Antes (JS):**
```javascript
export default {
  props: {
    message: String,
    count: Number
  }
}
```

**Depois (TS):**
```typescript
interface Props {
  message: string;
  count: number;
}

export default defineComponent({
  props: {
    message: {
      type: String as PropType<Props['message']>,
      required: true
    },
    count: {
      type: Number as PropType<Props['count']>,
      default: 0
    }
  }
});
```

### Passo 4: Tipar Stores Pinia

**Antes (JS):**
```javascript
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false
  }),
  actions: {
    setUser(user) {
      this.user = user;
    }
  }
});
```

**Depois (TS):**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false
  }),
  actions: {
    setUser(user: User) {
      this.user = user;
    }
  }
});
```

### Passo 5: Tipar Services

**Antes (JS):**
```javascript
export async function fetchUser(id) {
  const response = await axios.get(`/users/${id}`);
  return response.data;
}
```

**Depois (TS):**
```typescript
import type { User } from '@/models/User.interface';

export async function fetchUser(id: string): Promise<User> {
  const response = await axios.get<User>(`/users/${id}`);
  return response.data;
}
```

---

## ✅ CHECKLIST DE DESENVOLVIMENTO

### Para cada nova feature:
- [ ] Criar estrutura de pastas completa
- [ ] Separar .vue, .ts e .scss
- [ ] Criar interfaces/models
- [ ] Implementar Pinia store se necessário
- [ ] Criar services HTTP
- [ ] Adicionar feature flag
- [ ] Criar route guard se necessário
- [ ] Adicionar ao router
- [ ] Documentar no design system se for componente reutilizável

### Para cada novo componente do Design System:
- [ ] Criar pasta com nome do componente
- [ ] Separar .vue, .ts, .scss e .types.ts
- [ ] Usar prefixo HD (Hell's December)
- [ ] Documentar variants e props
- [ ] Implementar acessibilidade (ARIA)
- [ ] Testar responsividade
- [ ] Adicionar ao index.ts do design-system

### Antes de commit:
- [ ] Verificar tipos TypeScript (`npm run type-check`)
- [ ] Rodar linter (`npm run lint`)
- [ ] Verificar imports não utilizados
- [ ] Testar localmente
- [ ] Verificar performance (Lighthouse)

---

## 🚫 ANTI-PATTERNS A EVITAR

❌ **NUNCA:**
- Criar componentes .vue com tudo em um arquivo (usar separação .vue/.ts/.scss)
- Usar bibliotecas de UI externas (criar tudo interno)
- Acessar diretamente localStorage (usar stores)
- Fazer chamadas HTTP direto nos componentes (usar services)
- Hardcodar cores, espaçamentos ou fontes (usar variáveis SCSS)
- Ignorar feature flags em features experimentais
- Criar features sem seguir a estrutura de pastas
- Misturar lógica de negócio com apresentação

✅ **SEMPRE:**
- Separar .vue, .ts e .scss
- Criar componentes no design system
- Usar Pinia para state management
- Services para todas as chamadas HTTP
- Variáveis SCSS para estilos
- Feature flags para features em desenvolvimento
- TypeScript para tudo
- Composables para lógica reutilizável

---

## 📚 COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev

# Build (produção)
npm run build

# Preview build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Testes
npm run test:unit
npm run test:e2e
```

---

**Última atualização:** 29/10/2025  
**Responsável:** Arquitetura Frontend - Hell's December
