<template>
  <main class="p-checkout">
    <section class="c-card p-checkout__panel a-fade-in-up">
      <span class="p-checkout__icon">
        <Lock :size="28" />
      </span>
      <p class="u-text--eyebrow">Acesso restrito</p>
      <h1 class="p-checkout__title">Ative sua conta para continuar</h1>
      <p class="p-checkout__lead">
        Você está a um passo de desbloquear todas as mentorias, trilhas
        e a comunidade Alexandria. Conclua sua matrícula para liberar o
        conteúdo completo.
      </p>

      <ul class="p-checkout__perks">
        <li><CircleCheck :size="16" /> Mentorias ao vivo semanais</li>
        <li><CircleCheck :size="16" /> Trilhas de IA, Automação, Web3</li>
        <li><CircleCheck :size="16" /> Sistema de XP e conquistas</li>
        <li><CircleCheck :size="16" /> Comunidade ativa &amp; networking</li>
      </ul>

      <div class="p-checkout__actions">
        <button class="c-btn c-btn--accent c-btn--lg" type="button">
          <CreditCard :size="18" />
          <span>Ativar matrícula</span>
        </button>
        <router-link to="/" class="c-btn c-btn--ghost">
          <ArrowLeft :size="16" /> Voltar
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { Lock, CircleCheck, CreditCard, ArrowLeft } from 'lucide-vue-next'
</script>

<style scoped lang="scss">
.p-checkout {
  min-height: 100vh;
  display: grid; place-items: center;
  padding: $space-5 $space-4;

  &__panel {
    width: 100%; max-width: 560px;
    padding: $space-7;
    text-align: center;
  }

  &__icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 72px; height: 72px;
    border-radius: $radius-xl;
    background: var(--gradient-sunset);
    box-shadow: $shadow-glow-accent;
    color: #fff;
    margin-bottom: $space-4;
  }

  &__title { font-size: $fs-2xl; margin-bottom: $space-3; }
  &__lead  { color: var(--text-secondary); margin-bottom: $space-5; }

  &__perks {
    list-style: none; padding: 0; margin: 0 0 $space-6;
    display: grid; gap: $space-2;
    text-align: left;
    color: var(--text-secondary); font-size: $fs-sm;

    li { display: flex; align-items: center; gap: $space-3; color: var(--text-primary); }
    svg { color: var(--color-secondary); flex-shrink: 0; }
  }

  &__actions {
    display: flex; flex-wrap: wrap; gap: $space-3; justify-content: center;
  }
}
</style>
