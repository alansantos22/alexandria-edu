<template>
  <main class="p-auth">
    <section class="p-auth__panel a-fade-in-up">
      <header class="p-auth__brand">
        <span class="p-auth__logo"><UserPlus :size="22" /></span>
        <div>
          <p class="u-text--eyebrow">Crie sua conta</p>
          <h1 class="p-auth__title">Comece sua jornada</h1>
        </div>
      </header>

      <p class="p-auth__lead">
        Acesse trilhas guiadas, comunidade e mentorias ao vivo em
        IA, Automação, Gamificação e Web3.
      </p>

      <form class="p-auth__form l-stack" @submit.prevent="handleRegister">
        <div class="c-field">
          <label class="c-field__label" for="reg-username">
            <User :size="16" /> Usuário
          </label>
          <input
            id="reg-username"
            v-model="username"
            class="c-field__input"
            type="text"
            placeholder="seu_usuario"
            minlength="3"
            required
          />
        </div>

        <div class="c-field">
          <label class="c-field__label" for="reg-email">
            <Mail :size="16" /> Email
          </label>
          <input
            id="reg-email"
            v-model="email"
            class="c-field__input"
            type="email"
            placeholder="voce@alexandria.edu"
            required
          />
        </div>

        <div class="c-field">
          <label class="c-field__label" for="reg-password">
            <Lock :size="16" /> Senha
          </label>
          <input
            id="reg-password"
            v-model="password"
            class="c-field__input"
            type="password"
            placeholder="••••••••"
            minlength="8"
            required
          />
          <small class="c-field__hint">
            Mín. 8 caracteres, com maiúscula, minúscula e número.
          </small>
        </div>

        <button class="c-btn c-btn--secondary c-btn--block" type="submit" :disabled="loading">
          <Rocket :size="18" />
          <span>{{ loading ? 'Criando…' : 'Criar conta' }}</span>
        </button>

        <p v-if="error"   class="c-field__error">
          <CircleAlert :size="16" /> {{ error }}
        </p>
        <p v-if="success" class="c-field__success">
          <CircleCheck :size="16" /> {{ success }}
        </p>
      </form>

      <footer class="p-auth__footer">
        <span>Já tem conta?</span>
        <router-link class="p-auth__link" to="/">
          Entrar <ArrowRight :size="14" />
        </router-link>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/core/api'
import {
  UserPlus, User, Mail, Lock, Rocket,
  CircleAlert, CircleCheck, ArrowRight,
} from 'lucide-vue-next'

const username = ref('')
const email    = ref('')
const password = ref('')
const error    = ref('')
const success  = ref('')
const loading  = ref(false)
const router = useRouter()

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    })

    if (data?.success) {
      success.value = 'Cadastro realizado! Redirecionando para o login…'
      setTimeout(() => router.push('/'), 1500)
    }
  } catch (err) {
    const msg = err.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Registro falhou'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.p-auth {
  min-height: 100vh;
  display: grid; place-items: center;
  padding: $space-5 $space-4;

  &__panel {
    @include card-glass;
    width: 100%; max-width: 480px;
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
    background: var(--gradient-mint);
    box-shadow: $shadow-glow-secondary;
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
  }
}
</style>
