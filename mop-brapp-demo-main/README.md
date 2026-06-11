# mop-brapp-demo

Cliente de referencia para integrarse al **mop-socket-server** (contrato
**BRAPP v1** — ver
[`mop-docs/decisions/2026-06-02-respuesta-brapp-integracion.md`](https://github.com/MomentOfPeople/mop-docs/blob/main/decisions/2026-06-02-respuesta-brapp-integracion.md)).

Una sola página: pegás la API key (la entrega MoP), te conectás, ves el
`hello`, emitís un `client_event`, ves los eventos que llegan (`mop.order.*`,
`mop.payment.*`, `mop.message.outbound/v1`, etc.).

## Stack

- Next.js 16 (App Router, standalone output)
- `socket.io-client@^4`
- Tailwind CSS
- Cloud Run (allow-unauthenticated, min-instances 0)

## Quickstart local

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy

GitHub Actions / Cloud Build dispara automáticamente al pushear a `main`
(ver `cloudbuild.yaml`). O manualmente:

```bash
SHORT_SHA=$(git rev-parse --short HEAD)
gcloud builds submit --config cloudbuild.yaml --substitutions=SHORT_SHA=$SHORT_SHA
```

## Env vars

| Var | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | `wss://socket.momentofpeople.com` | Override del endpoint del socket. Útil para testear contra un service de dev. |

## Cómo se ve

UI de dos columnas:

- **Izquierda**: input para la API key + botón Conectar/Desconectar; bloque
  con capabilities recibidas en el `hello` (workspaceIds, schemas); form
  para emitir un `client_event` con texto custom.
- **Derecha**: log de eventos en tiempo real con timestamps, badges por
  kind (`ok`, `hello`, `event`, `out`, `ack`, `err`, `warn`), y el JSON
  expandido de cada uno.

## Flujo conceptual

```
[ BRAPP App ]                       [ mop-socket-server ]            [ mop-core-ng ]            [ Voiceflow ]
     |                                       |                              |                          |
     |--- io.connect (auth.key) ----------> |                              |                          |
     |<-- hello (capabilities) ----------- |                              |                          |
     |                                       |                              |                          |
     |--- emit('client_event', payload) --->| (publish a Pub/Sub)         |                          |
     |<-- ack { ok, eventId } ------------ |                              |                          |
     |                                       |                              |                          |
     |                                       |  (Pub/Sub push) ----------->|                          |
     |                                       |                              |--- interactSB --------->|
     |                                       |                              |<-- text trace -----------|
     |                                       |  <-- publish 'outbound' ----|                          |
     |                                       |                              |                          |
     |<-- event(mop.message.outbound/v1) -- |                              |                          |
```

Para eventos posteriores (`mop.order.created/v1`, `mop.payment.approved/v1`)
el patrón es idéntico: alguien (mop-admin, webhook MP) publica a Pub/Sub
y el evento llega al cliente WS conectado que tenga el schema en
`allowedSchemas`.

## Estructura

```
src/app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page (server component)
├── socket-demo.tsx     # Client component con la lógica WS
└── globals.css         # Tailwind

Dockerfile              # Multi-stage Next.js 16 standalone
cloudbuild.yaml         # Build + push + deploy a Cloud Run
```

## No hay backend propio

Toda la lógica vive en el cliente (Socket.IO se conecta directo desde el
browser). No hay API routes, no hay sesión, no hay persistencia. La key
pegada en el form sólo vive en memoria del componente.

## Seguridad

- La key se loggea en plaintext **sólo en el browser** (en memoria).
  Cerrando la pestaña se borra.
- **No metas keys reales de producción** en esta app. Usá únicamente
  `boton-rojo-staging` o equivalentes de test.
- La página es pública (`allow-unauthenticated`). Cualquiera con la URL
  puede entrar pero no hace nada sin una API key válida.

## Referencias

- Contrato técnico v1: [`mop-docs/decisions/2026-06-02-respuesta-brapp-integracion.md`](https://github.com/MomentOfPeople/mop-docs/blob/main/decisions/2026-06-02-respuesta-brapp-integracion.md)
- Protocolo Socket.IO: [`mop-docs/reference/socket-client-protocol.md`](https://github.com/MomentOfPeople/mop-docs/blob/main/reference/socket-client-protocol.md)
- HMAC server-to-server (para llamadas REST): [`mop-docs/reference/hmac-server-to-server.md`](https://github.com/MomentOfPeople/mop-docs/blob/main/reference/hmac-server-to-server.md)
- Catálogo de eventos en runtime: `GET https://socket.momentofpeople.com/v1/events/catalog`
