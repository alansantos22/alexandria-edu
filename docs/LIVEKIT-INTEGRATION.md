# Integração com LiveKit — Roadmap

> **Status:** Preparado mas não ativado. Requer instalação manual do SDK e
> configuração de credenciais quando você quiser adotar.

## Visão geral

O backend já registra `provider: 'livekit'` como provedor válido em
`live_classes`. Quando uma aula tem esse provedor, o endpoint
`POST /live-classes/:id/join-token` retorna um `joinUrl` no formato:

```
${LIVEKIT_URL}?access_token=<JWT_LIVEKIT>
```

Hoje o JWT é assinado com `LIVE_CLASS_JWT_SECRET` (token interno do sistema).
Para LiveKit real, será necessário **trocar** esse JWT por um token assinado
com `LIVEKIT_API_SECRET` (algoritmo HS256, claims específicos do LiveKit).

## Passos para ativação

1. **Instalar SDK do servidor**
   ```powershell
   cd backend
   npm install livekit-server-sdk
   ```

2. **Definir env vars** (`.env`):
   ```
   LIVEKIT_URL=wss://yourdomain.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxxxx
   LIVEKIT_API_SECRET=xxxxxxxxxxxx
   ```

3. **Substituir geração de JWT** em
   `backend/src/modules/live-classes/live-class.service.ts → generateJoinToken()`
   pela API do SDK:
   ```ts
   import { AccessToken } from 'livekit-server-sdk';

   const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
     identity: userId,
     ttl: 60 * 90, // 90 min
   });
   at.addGrant({ room: liveClass.roomId || liveClass.id, roomJoin: true, canPublish: true, canSubscribe: true });
   const token = await at.toJwt();
   ```

4. **Frontend (futuro):** criar componente que recebe `joinUrl` e usa o SDK
   `livekit-client` para conectar diretamente — ou apenas abrir o `joinUrl`
   se você usar uma sala embed do LiveKit Meet.

## Gravações

LiveKit permite gravar automaticamente via Egress API. Recomendação:

1. Disparar gravação ao iniciar a aula (status `live`) via webhook ou cron.
2. Quando o webhook `egress.finished` chegar, persistir `recordingUrl` em
   `live_classes` e atualizar `status='ended'`.

Endpoint admin já existe: `POST /admin/live-classes/:id/recording { url }`.

## Observações de segurança

- O `external_url` da aula **nunca** é retornado pela API. Mesmo após esta
  integração, o frontend nunca verá o secret do LiveKit — apenas o `joinUrl`
  já assinado (válido por ~90 min) é entregue.
- A janela de entrada permanece controlada no backend: 15 min antes do
  `startsAt` até 30 min após o fim.
