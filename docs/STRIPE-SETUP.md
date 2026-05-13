# Configuração do Stripe

## 1. Criar conta e obter chaves

1. Acesse https://dashboard.stripe.com/register
2. Em **Developers → API keys**, copie:
   - **Secret key** (`sk_test_…` para teste, `sk_live_…` para produção)
   - **Publishable key** (`pk_test_…` ou `pk_live_…`)

## 2. Configurar variáveis de ambiente

### Backend (`backend/.env`)
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

### Frontend (`frontend/.env`)
```
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxx
```

> ⚠️ Sem `STRIPE_SECRET_KEY` o backend roda em **modo dev sem pagamento**:
> apenas produtos gratuitos ou totalmente cobertos por moedas podem ser
> "comprados". Tentar cobrar BRL retorna erro.

## 3. Configurar Webhook

No dashboard do Stripe → **Developers → Webhooks → Add endpoint**:

- **URL**: `https://seudominio.com/api/v1/webhooks/stripe`
- **Events to send**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`

Após criar, copie o **Signing secret** (`whsec_…`) para `STRIPE_WEBHOOK_SECRET`.

### Teste local com Stripe CLI

```powershell
# Instalar: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:3003/api/v1/webhooks/stripe
```

O comando imprime um `whsec_…` temporário — use-o em `STRIPE_WEBHOOK_SECRET`.

## 4. Fluxo end-to-end

1. Aluno acessa `/checkout/:productId`.
2. Frontend chama `POST /checkout/quote` para calcular preço (com cupom + moedas).
3. Frontend chama `POST /checkout/start`:
   - Se total em BRL = 0 (free/coins), backend libera matrícula imediatamente.
   - Se total > 0, backend cria PaymentIntent no Stripe e devolve `clientSecret`.
4. Frontend monta Stripe Elements (`elements.create('payment')`) com o
   `clientSecret`.
5. Aluno confirma pagamento; Stripe redireciona para `return_url`.
6. Stripe envia webhook `payment_intent.succeeded` → backend marca order
   como `paid`, debita moedas, consome cupom e cria `Enrollment`.

## 5. Moedas internas (split BRL + coins)

Cada produto define:
- `allow_coins` — aceita moedas?
- `coins_max_percent` — máximo do preço pagável em moedas (0–100)
- `coins_rate` — quantas moedas equivalem a 1 BRL

A regra **NUNCA acumula** com cupons ou campanhas — primeiro aplica o melhor
desconto (cupom OU campanha — o **maior vence**), depois aplica moedas até
o limite, e o restante vai pro Stripe.

## 6. Testes

Cartões de teste do Stripe:
- `4242 4242 4242 4242` — sucesso
- `4000 0000 0000 9995` — falha
- Qualquer CVC, qualquer data futura.
