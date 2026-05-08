<template>
  <main class="p-auth">
    <section class="p-auth__panel a-fade-in-up">
      <header class="p-auth__brand">
        <span class="p-auth__logo"><Sparkles :size="22" /></span>
        <div>
          <p class="u-text--eyebrow">Alexandria EDU</p>
          <h1 class="p-auth__title">Bem-vindo de volta</h1>
        </div>
      </header>

      <p class="p-auth__lead">
        IA · Automação · Gamificação · Web3. Continue sua jornada
        rumo ao próximo nível.
      </p>

      <form class="p-auth__form l-stack" @submit.prevent="handleLogin">
        <div class="c-field">
          <label class="c-field__label" for="login-email">
            <Mail :size="16" /> Email
          </label>
          <input
            id="login-email"
            v-model="email"
            class="c-field__input"
            type="email"
            placeholder="voce@alexandria.edu"
            autocomplete="email"
            required
          />
        </div>

        <div class="c-field">
          <label class="c-field__label" for="login-password">
            <Lock :size="16" /> Senha
          </label>
          <input
            id="login-password"
            v-model="password"
            class="c-field__input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <button class="c-btn c-btn--block" type="submit" :disabled="loading">
          <LogIn :size="18" />
          <span>{{ loading ? 'Entrando…' : 'Entrar' }}</span>
        </button>

        <p v-if="error" class="c-field__error">
          <CircleAlert :size="16" /> {{ error }}
        </p>
      </form>

      <footer class="p-auth__footer">
        <span>Ainda não tem conta?</span>
        <router-link class="p-auth__link" to="/register">
          Criar conta <ArrowRight :size="14" />
        </router-link>
      </footer>
    </section>

    <aside class="p-auth__aside">
      <div class="c-card c-card--feature p-auth__hero">
        <span class="c-badge c-badge--gold">
          <Trophy :size="12" /> XP +500
        </span>
        <h2 class="p-auth__hero-title">Domine o futuro,<br />uma missão por vez.</h2>
        <p class="p-auth__hero-lead">
          Trilhas práticas com mentorias ao vivo, projetos reais e
          comunidade ativa.
        </p>
        <ul class="p-auth__perks">
          <li><BrainCircuit :size="16" /> Cursos de IA aplicada</li>
          <li><Workflow    :size="16" /> Automação no-code &amp; código</li>
          <li><Gamepad2    :size="16" /> Gamificação &amp; rankings</li>
          <li><Wallet      :size="16" /> Web3 &amp; carteiras digitais</li>
        </ul>
      </div>
    </aside>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/core/api'
import {
  Sparkles, Mail, Lock, LogIn, CircleAlert, ArrowRight,
  Trophy, BrainCircuit, Workflow, Gamepad2, Wallet,
} from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    if (data?.success && data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'admin') router.push('/admin')
      else if (data.user.isActive)    router.push('/home')
      else                            router.push('/checkout')
    } else {
      error.value = 'Login falhou'
    }
  } catch (err) {
    const msg = err.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Login falhou'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.p-auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-6;
  padding: $space-5 $space-4;
  align-items: center;

  @include breakpoint(lg) {
    grid-template-columns: minmax(380px, 480px) 1fr;
    gap: $space-8;
    padding: $space-7 $space-8;
    max-width: 1280px;
    margin: 0 auto;
  }

  &__panel {
    @include card-glass;
    padding: $space-6;
    @include breakpoint(md) { padding: $space-7; }
  }

  &__brand {
    display: flex; align-items: center; gap: $space-3;
    margin-bottom: $space-5;
  }

  &__logo {
    width: 44px; height: 44px;
    border-radius: $radius-md;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--gradient-aurora);
    background-size: 200% 200%;
    animation: aurora-shift 8s ease-in-out infinite;
    box-shadow: $shadow-glow-primary;
    color: #fff;
  }

  &__title { font-size: $fs-2xl; margin: 0; }
  &__lead  { color: var(--text-secondary); margin-bottom: $space-5; }

  &__footer {
    margin-top: $space-5;
    display: flex; align-items: center; gap: $space-2;
    color: var(--text-muted); font-size: $fs-sm;
  }

  &__link {
    display: inline-flex; align-items: center; gap: $space-1;
    color: var(--color-secondary); font-weight: 600;
    &:hover { color: var(--color-secondary-soft); }
  }

  &__aside { display: none; @include breakpoint(lg) { display: block; } }

  &__hero { padding: $space-7; }
  &__hero-title { font-size: $fs-2xl; margin: $space-3 0; color: #fff; }
  &__hero-lead  { color: rgba(255,255,255,0.85); }

  &__perks {
    list-style: none; padding: 0; margin: $space-5 0 0;
    display: grid; gap: $space-3;
    color: rgba(255,255,255,0.92);
    font-size: $fs-sm;
    li { display: flex; align-items: center; gap: $space-3; }
  }
}
</style>
