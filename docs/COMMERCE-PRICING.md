# Comércio — regras de preço

## Entidades

- **Product** — item à venda (curso, webinar, live_pack, bundle).
- **Cohort (turma)** — opcional; quando o produto tem turmas, o aluno escolhe
  uma. Cohort define capacidade, datas e timezone próprios.
- **LiveClass** — aula ao vivo dentro de uma cohort.
- **Enrollment** — matrícula que dá acesso (única por user+product). Gerada
  ao pagar, resgatar convite ou comissão admin.
- **Campaign** — desconto promocional auto-aplicado, com slug público
  (`/promo/:slug`).
- **Voucher (invite/cupom)** — código de uso individual com escopo:
  - `kind=access` libera matrícula direta sem pagamento.
  - `kind=discount` é cupom usado no checkout.

## Regra de desconto (CRÍTICA)

**Cupom OU campanha — o MAIOR vence. Nunca acumula.**

Implementado em `PricingService.resolvePrice()`:

1. Calcula desconto da campanha ativa (se houver).
2. Calcula desconto do cupom (se fornecido e válido).
3. Aplica apenas **um** dos dois — o que produz o **maior** desconto em R$.

## Cálculo do total

```
preço_efetivo = max(0, preço_lista − desconto)
maxCoinsValueBrl = preço_efetivo × (coins_max_percent / 100)   # 0 se !allow_coins

coins_valor_brl = min(coins_solicitadas / coins_rate, maxCoinsValueBrl)
brl_a_pagar = max(0, preço_efetivo − coins_valor_brl)
```

Se `brl_a_pagar ≤ 0.005`:
- Não cria PaymentIntent.
- Debita moedas, marca order `paid`, libera enrollment.

Se `brl_a_pagar > 0`:
- Cria PaymentIntent no Stripe.
- Frontend confirma pagamento.
- Webhook libera enrollment + debita moedas (se aplicável).

## Validações no quote

- `coins_to_use > 0` e `!product.allow_coins` → erro.
- `coins_to_use > saldo do usuário` → erro.
- `coins_valor_brl > maxCoinsValueBrl + 0.005` → erro.

## Acesso

`Enrollment` é único por `(user_id, product_id)`. Resgates repetidos apenas
estendem `expires_at` (se a nova janela é maior).

Para liberar uma **aula específica** (escopo `live_class`), o sistema cria um
enrollment para o produto-pai com `lessonsQuota=1` — assim o aluno consome
apenas aquela aula sem ter acesso ilimitado.

## Convites com escopo

| Escopo       | scope_id          | Efeito                                    |
| ------------ | ----------------- | ----------------------------------------- |
| `global`     | (vazio)           | Acesso legado (compatibilidade vouchers)  |
| `product`    | id do produto     | Matrícula completa no produto             |
| `cohort`     | id da turma       | Matrícula na turma específica             |
| `live_class` | id da aula        | Matrícula com `lessonsQuota=1`            |

## Campanha — slug público

Cada campanha pode ter `public_slug` e `banner_url`. Esse slug gera uma
landing page em `/promo/:slug` que lista os produtos beneficiados com badge
e preço já com desconto aplicado.

## Cobrança de comissão / split

**Fora de escopo desta fase.** O Stripe Connect pode ser adicionado depois
para repasses a parceiros — não requer mudanças no modelo de dados.
