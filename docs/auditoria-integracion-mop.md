# Auditoría de Integración WebApp/App ↔ Ecosistema MoP (Botón Rojo)

> Fecha: 2026-06-02 · Basado en el código real del repositorio (no en la documentación de intención).
> Leyenda: ✅ implementado · 🟡 parcial · ❌ no existe

---

# ⚠️ ACTUALIZACIÓN 2026-06-02 — Contrato real de MoP recibido

MoP envió su documento oficial de arquitectura (`mop-docs/architecture/boton-rojo-user-flow`). Esta sección **supersede** las suposiciones previas. El resto del documento (abajo) sigue siendo válido para el estado del código BRAPP, pero la integración debe leerse a la luz de lo siguiente.

## Arquitectura REAL de MoP (no la que diseñamos)

```
Propietario → Botón Rojo App ──WS directo──► mop-socket-server
                                                   │  publish/push
                                                   ▼
                                            Pub/Sub (GCP)
                                                   │
                                                   ▼
                                            mop-core-ng ──► PanelCRM / GoHighLevel (bot "VF")
                                                   │            (computa monto estimado + tipoProveedor)
                                                   │ custom_action order.create (HMAC)
                                                   ▼
                                            mop-admin API ──► Firestore (orders/quotes/payments)
                                                   ▲
                                            Operador BR (humano o AI) asigna proveedor + arma presupuesto
```

**Diferencias clave con nuestro diseño previo:**
- La app **se conecta directo por WebSocket** a `mop-socket-server` (nuestro doc decía "el frontend nunca se conecta directo al CRM" — **era incorrecto**).
- La **fuente de verdad de órdenes/presupuestos/pagos es Firestore (MoP)**, no Supabase.
- El flujo es **conversacional con un bot** (GoHighLevel + VF), no formulario de categorías.
- La orden la crea **el bot** (`order.create`), no la app.
- **El proveedor NO es actor del sistema** en MoP (recibe presupuesto por WhatsApp; payout out-of-band).

## Las 8 fases de MoP y su estado (según ellos)

| Fase | Quién | Sistema | Estado MoP |
|---|---|---|---|
| 1. Pedido | Propietario | Botón Rojo app + socket | ✅ funciona |
| 2. Orden | PanelCRM (auto) | mop-core-ng → mop-admin (HMAC) | ✅ funciona |
| 3. Asignación | Operador BR (humano/AI) | mop-admin | ✅ funciona |
| 4. Aceptación | Propietario (out-of-band) | WhatsApp | manual |
| 5. Cobro | Propietario (out-of-band) | Efectivo / transfer / MP | manual |
| 6. Registro | Operador BR | mop-admin | ✅ funciona (PR18+19) |
| 7. Payout | Operador BR | mecanismo **TBD** | ❓ a definir |
| 8. Cierre | Operador BR | mop-admin | ✅ funciona |

## Catálogo de eventos Pub/Sub (confirmado por MoP)

| Topic | Publisher | Consumer | Cuándo |
|---|---|---|---|
| `client-inbound` | mop-socket-server | mop-core-ng (`/client-inbound/push`) | cada `client_event` desde la app |
| `outbound-msg` | mop-core-ng | mop-socket-server (push) | respuesta del bot (VF) al cliente |
| `mop.order.created/v1` | mop-admin | **(subs futuros)** | orden creada |
| `mop.order.assigned/v1` | mop-admin | **(subs futuros)** | operador asigna proveedor |
| `mop.order.completed/v1` | mop-admin | **(subs futuros)** | operador marca completada |
| `mop.payment.approved/v1` | mop-admin | **(subs futuros)** | pago manual registrado o webhook MP |

> ⚠️ **"(subs futuros)" = nadie consume esos eventos todavía.** Hoy la app solo recibe el `WS emit` de confirmación al crear la orden (`{id, orderNumber}`). **El seguimiento en tiempo real (asignado/presupuesto/pago/completado) NO es posible hasta que MoP cree el canal hacia la app.**

## Secuencia técnica resumida (sequence diagram MoP)

1. Toca botón → `WS connect + client_event` → socket-server → `publish client-inbound` → push OIDC → core-ng → GoHighLevel (`upsertContact`, `PATCH /state/user/{uid}/variables`, `POST /interact`) → `publish outbound-msg` → push → `WS emit (texto del bot)` → app.
2. Loop conversacional hasta que **VF computa `monto estimado` + `tipoProveedor`**.
3. `custom_action order.create (customer + serviceRequest)` → `POST /api/v1/workspaces/{wid}/orders` (HMAC) → Firestore `orders/{oid}` (status=new) → `publish mop.order.created/v1` → devuelve `{id, orderNumber}` → `WS emit (confirmación)`.
4. Operador ve `/workspaces/{wid}/orders` → asigna proveedor (filtra por rubro) → `mop.order.assigned/v1` → crea presupuesto `orders/{oid}/quotes/{qid}` (status=pending) → **envía al proveedor por WhatsApp (out-of-band)**.
5. Cliente acepta (por WA/llamada) → `quote.status=accepted`. Paga (efectivo/transfer/MP) → operador "Registrar pago" → `payment_links/{plid}` (status=approved) → `orders/{oid}.payment { commissionAmount, providerPayoutAmount, status=approved, providerPayoutStatus=pending }`. `commissionPct = order.commissionPercent ?? workspace.commissionPercent ?? 15`. → `mop.payment.approved/v1`.
6. Payout (`/payouts`): lista órdenes `approved + payoutStatus=pending` agrupadas por proveedor → paga por **mecanismo TBD** → "Marcar pagado" → `providerPayoutStatus=paid`.
7. Visibilidad global en `/payments` del workspace (config MP + historial).

## Conflictos críticos a resolver (decisiones, no solo datos)

1. **Modelo proveedor** — MoP: "el proveedor no es actor del sistema"; BRAPP tiene dashboard de proveedor completo + `booking_offers`. → **PENDIENTE DE DECISIÓN** (el usuario optó por decidirlo más adelante, tras armar las preguntas a MoP).
2. **Socket directo vs adapter→Supabase** — la conversación va por WS directo a MoP; nuestro modelo Supabase-Realtime no aplica al chat con el bot.
3. **Fuente de verdad** — órdenes/presupuestos/pagos viven en Firestore (MoP). Definir si BRAPP espeja en Supabase o lee en vivo, y por qué canal.
4. **Bot reemplaza el formulario** — la grilla de categorías + `BookingRequestForm` se reemplazan por el chat conversacional.

## Datos que TODAVÍA faltan de MoP

Ver listado accionable en [preguntas-mop.md](preguntas-mop.md). Resumen: URL `wss://` (staging/prod), auth de la conexión WS de la app, schema de `client_event` y del `WS emit`, establecimiento/mapeo del `uid` y resolución del `wid`, canal de updates post-creación (resolver "subs futuros"), payload de `order.create`, subida de foto en la conversación, y si ya existe una "Botón Rojo App" (fase 1 figura "✅ funciona").

---

## Conclusión de entrada

**La integración con MoP NO está implementada en absoluto a nivel de código.** No existe `socket-server`, no hay conexión WebSocket, no hay `order.create`, no hay tablas `crm_events` / `orders` / `quotes` / `payments`, no hay bot conversacional ni chat con IA. Todo lo relativo a MoP vive únicamente como **plan de diseño** en [arquitectura-crm-integration.md](arquitectura-crm-integration.md).

Lo que sí existe es una **WebApp Next.js + Supabase autónoma y funcional** con su propio modelo de marketplace (cliente solicita → proveedores ofertan → cliente acepta → proveedor confirma → chat). Ese modelo **no coincide 1:1** con el flujo MoP (bot → orden → operador asigna → presupuesto → pago → payout), por lo que la integración requiere tanto piezas nuevas como una **reconciliación del modelo de datos**.

---

# CHECKLIST DE INTEGRACIÓN

## 1. Identidad y Autenticación

| Item | Estado |
|---|---|
| Login de usuario | ✅ |
| Registro de usuario | ✅ (multistep cliente/proveedor) |
| Recuperación de contraseña | ❌ |
| Sesión persistente | ✅ (cookies SSR vía `@supabase/ssr`) |
| Integración con usuarios de MoP | ❌ |
| Sincronización de UID con mop-core-ng | ❌ |

**¿Cómo se autentica el usuario?** Supabase Auth con email + contraseña (`services/auth.ts`: `login`, `register`, `logout`, `getSession`). El registro pasa `full_name` y `role` en `raw_user_meta_data`; un trigger `handle_new_user` crea la fila en `profiles`. El middleware (`middleware.ts`) protege `/dashboard/**` y redirige `/login`,`/register` si ya hay sesión.

**¿Qué identificador usa?** El **UUID de `auth.users`** de Supabase (`profiles.id`). Es la PK de todo el sistema. No hay ningún `mop_uid`, `external_id` ni mapping a usuarios de mop-core-ng.

**¿Campo requerido para integrar con MoP?** Sí, faltan todos:
- `profiles.mop_user_id` (UID en mop-core-ng)
- `profiles.mop_sync_status` / `mop_synced_at`
- Mecanismo de provisión: al crear un usuario BR, registrarlo en mop-core-ng y guardar el UID retornado.

**Qué falta:** recuperación de contraseña (Supabase ya lo soporta con `resetPasswordForEmail`, solo falta UI + ruta `/reset`), verificación de teléfono (campo existe, lógica no), y todo el puente de identidad con MoP.

---

## 2. Botón Rojo

| Item | Estado |
|---|---|
| Pantalla "Botón Rojo" | ❌ (no existe como tal) |
| Flujo conversacional | ❌ |
| Conexión websocket | ❌ |
| Conexión con mop-socket-server | ❌ |
| Manejo de reconexión | ❌ |
| Persistencia de conversación | 🟡 (existe chat persistido, pero no de bot) |

**¿Qué funciona hoy?** No hay una "pantalla Botón Rojo" de emergencia/disparo ni un flujo conversacional con bot. El equivalente funcional actual es: grilla de categorías (`ServiceCategoryGrid`) → formulario de solicitud (`BookingRequestForm`) → inserción directa en la tabla `bookings`. Es un flujo de **formulario**, no de **conversación**.

> Nota: el doc [estado-del-proyecto.md §17](estado-del-proyecto.md) describe una futura app nativa (React Native/Expo) con "Botón Rojo" de pánico (GPS, botones físicos, background). Eso es roadmap, no está implementado.

**¿Qué endpoints consume?** Ninguno hacia MoP. Solo el SDK de Supabase (insert/select sobre Postgres) y rutas internas (`/api/...`).

**¿Qué eventos websocket usa?** Solo **Supabase Realtime** (Postgres changes) sobre `messages` y `support_messages`. **No** hay conexión a `mop-socket-server`.

**¿Qué falta?** Todo: pantalla del botón, capa conversacional, cliente WebSocket (o consumo de Supabase Realtime alimentado por el socket-server), reconexión exponencial, heartbeat y persistencia de la conversación bot↔usuario.

---

## 3. Chat con IA

| Item | Estado |
|---|---|
| Enviar mensajes | 🟡 (chat humano, no IA) |
| Adjuntar imágenes | 🟡 (solo en el alta del booking, no en el chat) |
| Enviar ubicación | ❌ |
| Indicar urgencia | 🟡 (`scheduled_date` = `today`/`coordinate`, no urgencia real) |
| Recibir respuestas del bot | ❌ |

**Estructura de mensajes actual** (`messages`): `{ id, sender_id, receiver_id, content, read, booking_id, created_at }`. Es 1:1 humano↔humano (cliente↔proveedor). Soporte: `support_messages` `{ id, user_id, sender_id, content, created_at }`.

**Payload enviado:** texto plano (`content`) vía `supabase.from('messages').insert(...)`. **No** soporta tipos de mensaje, adjuntos en el chat, ubicación, metadata ni roles de bot.

**Payload recibido:** evento Realtime `postgres_changes INSERT` con la fila nueva.

**Validaciones que faltan:** tipado de mensajes (`text`/`image`/`location`/`system`/`bot`), tamaño/formato de adjuntos, sanitización, rate limiting, y todo el contrato con el bot/IA de MoP (no existe `sender` de tipo bot ni endpoint de IA).

---

## 4. Creación de Orden (`custom_action order.create`)

| Item | Estado |
|---|---|
| La App dispara creación de orden | ❌ |
| Callback de confirmación | ❌ |
| Se almacena `orderId` | ❌ |
| Se almacena `orderNumber` | ❌ |

**¿Cómo se genera la orden hoy?** No se genera una "orden MoP". Se hace un `INSERT` directo en `bookings` desde el cliente (`BookingRequestForm.tsx`) con: `user_id, category_id, description, image_url, scheduled_date, coordinated_dates, payment_method, address, status='searching'`.

**¿Qué vuelve?** Solo el `id` (uuid) del booking en Supabase. No hay `orderId`/`orderNumber` de mop-admin ni callback de confirmación.

**Qué falta:** disparar `order.create` hacia mop-admin (vía socket-server o REST), recibir y persistir `mop_order_id` + `mop_order_number`, y un estado de sincronización (`crm_sync_status`).

---

## 5. Seguimiento de Orden

| Item | Estado |
|---|---|
| Ver órdenes | ✅ (bookings: activity / detalle) |
| Ver estado actual | ✅ (badge contextual) |
| Actualizaciones en tiempo real | ❌ (Realtime **no** está habilitado en `bookings`) |
| Reabrir conversación | ✅ (chat por booking) |

**Estados que existen** (`bookings.status`): `searching`, `pending`, `confirmed`, `completed`, `cancelled`.

**Estados esperados por MoP vs. actuales:**

| MoP | Existe en BR | Mapeo sugerido |
|---|---|---|
| `new` | 🟡 | `searching` |
| `assigned` | ❌ | nuevo / `confirmed` (operador asigna proveedor) |
| `quote_pending` | ❌ | nuevo |
| `quote_accepted` | 🟡 | `booking_offers.status='accepted'` (aprox.) |
| `payment_pending` | ❌ | nuevo |
| `approved` | ❌ | nuevo |
| `payout_pending` | ❌ | nuevo |
| `paid` | ❌ | nuevo |
| `completed` | ✅ | `completed` |
| `cancelled` | ✅ | `cancelled` |

**Cómo sincronizar:** introducir un campo separado `bookings.mop_status` (estado operativo MoP) distinto de `bookings.status` (estado de negocio visible), como ya recomienda el doc de arquitectura. El socket-server traduce eventos MoP → escribe en Supabase → **habilitar Realtime en `bookings`** para que el frontend reciba cambios en vivo (hoy NO está).

---

## 6. Presupuesto

| Item | Estado |
|---|---|
| Recibir presupuesto | ❌ (no hay presupuesto formal) |
| Visualizar ítems | ❌ |
| Visualizar monto total | 🟡 (existe precio único de oferta) |
| Aceptar | 🟡 (`acceptOffer`) |
| Rechazar | 🟡 (`rejectOffer`) |

**¿Existe UI?** Existe el sistema de **ofertas** (`booking_offers`: precio único por proveedor) con UI de aceptar/confirmar/rechazar (`OfferForm`, `AcceptOfferButton`, `app/actions/bookings.ts`). **No** es un presupuesto itemizado: no hay líneas (`items`), ni desglose, ni mano de obra/materiales, ni impuestos.

**¿Existe integración?** No con MoP. Las ofertas viven solo en Supabase.

**Qué falta:** tabla `quotes` + `quote_items` (descripción, cantidad, precio unitario, subtotal, total), evento MoP `quote.created`/`quote.updated`, UI de visualización itemizada y acciones aceptar/rechazar que notifiquen a MoP.

---

## 7. Pago

| Item | Estado |
|---|---|
| Pantalla de pago | ❌ |
| Integración Mercado Pago | ❌ (solo stub que lanza error) |
| Registro de pago manual | ❌ |
| Visualización de estado | ❌ |

**¿Cómo está resuelto hoy?** No está resuelto. `services/payments.ts` es un stub: `createPaymentPreference` lanza `Error('MercadoPago not configured')` y `handleWebhook` solo hace `console.log`. El `payment_method` del booking (`coordinate`/`prepaid`) es solo una preferencia declarada al pedir, sin ningún cobro real.

**Qué falta:** todo. Tabla `payments`, pantalla de pago, integración MercadoPago real (SDK + endpoint de preferencia + webhook firmado), registro de pago manual (para el flujo "pagos manuales" de MoP) y visualización de estado de pago + payout.

---

## 8. Estados en Tiempo Real

| Evento | Estado |
|---|---|
| Orden creada | ❌ |
| Orden asignada | ❌ |
| Presupuesto disponible | ❌ |
| Presupuesto aceptado | 🟡 (cambio local de `booking_offers`, sin evento MoP) |
| Pago registrado | ❌ |
| Orden completada | 🟡 (cambio local de `bookings.status`, sin Realtime) |

**¿Qué eventos llegan desde MoP?** Ninguno — no hay conexión. El doc de arquitectura **planifica** estos: `booking_status_updated`, `support_message_created`, `payment_updated`, `operational_logs`.

**¿Qué eventos deberían agregarse?** Catálogo mínimo sugerido: `order.created`, `order.assigned`, `quote.created`, `quote.accepted`, `quote.rejected`, `payment.pending`, `payment.approved`, `payout.pending`, `payout.paid`, `order.completed`, `order.cancelled`, `bot.message`. Además **habilitar Supabase Realtime en `bookings`, `quotes`, `payments`** (hoy solo está en `messages` y `support_messages`).

---

## 9. Notificaciones

| Canal | Estado |
|---|---|
| Push | ❌ |
| Email | 🟡 (solo emails transaccionales por defecto de Supabase Auth, sin uso de negocio) |
| SMS | ❌ |
| WhatsApp | ❌ |

**¿Qué existe?** Nada de negocio. No hay FCM/APNs, ni proveedor de email transaccional, ni SMS, ni WhatsApp. La "notificación" actual es solo el badge en pantalla cuando el usuario está dentro de la app.

**Qué falta:** servicio de notificaciones (push para la futura app nativa con Expo/FCM, email transaccional p.ej. Resend, WhatsApp Business API), disparado por los eventos MoP (asignación, presupuesto, pago, etc.).

---

## 10. Archivos y Multimedia

| Tipo | Estado |
|---|---|
| Fotos | ✅ (1 imagen por booking; avatares; ads; stories) |
| Videos | ❌ |
| Documentos | ❌ |
| Audio | ❌ |

**Soporte actual:** buckets de Supabase Storage **públicos**: `advertisements`, `stories`, `booking-images`, avatares. Solo imágenes. Una imagen por solicitud, subida en el alta (no en el chat).

**Qué requiere MoP (probable):** múltiples adjuntos por orden, adjuntos en el chat (foto del problema, comprobantes), posiblemente documentos (presupuesto PDF, comprobante de pago) y audio. Requiere buckets **privados** con URLs firmadas (ver §13).

---

## 11. Modelo de Datos

### Usuarios (`profiles`)
**Existen:** `id (uuid auth.users)`, `email`, `full_name`, `role (user/provider/admin)`, `avatar_url`, `phone`, `date_of_birth`, `dni`, `cuit`, `business_name`, `city`, `address`, `floor_apt`, `lot`, `created_at`, `updated_at`.
**Faltan:** `mop_user_id`, `mop_sync_status`, `phone_verified`, `lat`/`lng` (geo), `push_token`.

### Conversaciones (`messages` + `support_messages`)
**Existen:** `messages {id, sender_id, receiver_id, content, read, booking_id, created_at}`; `support_messages {id, user_id, sender_id, content, created_at}`.
**Faltan:** `type` (text/image/location/system/bot), `attachments` (jsonb), `sender_kind` (user/provider/bot/operator), `mop_message_id`, `conversation_id` (hilo de bot), `metadata`.

### Órdenes (`bookings`)
**Existen:** `id`, `user_id`, `provider_id`, `category_id`, `status (searching/pending/confirmed/completed/cancelled)`, `description`, `image_url`, `scheduled_date`, `coordinated_dates[]`, `coordinated_date`, `payment_method`, `address`, `created_at`, `updated_at`.
**Faltan:** `mop_order_id`, `mop_order_number`, `mop_status` (estado operativo), `internal_notes`, `crm_sync_status`, `metadata jsonb`, `lat`/`lng`, `urgency`, `assigned_at`, `completed_at`.

### Pagos (`payments`)
**Existen:** **ninguno** (la tabla no existe; `bookings.payment_method` es solo preferencia).
**Faltan (toda la tabla):** `id`, `booking_id`, `mop_payment_id`, `amount`, `currency`, `method (mercadopago/manual)`, `status (pending/approved/failed/refunded)`, `mp_preference_id`, `mp_payment_id`, `paid_at`, `payout_status`, `payout_at`, `created_at`.

### Presupuestos (`quotes`)
**Existen:** solo `booking_offers {id, booking_id, provider_id, price, status (pending/accepted/rejected), created_at}` — proxy primitivo, sin ítems.
**Faltan:** tabla `quotes {id, booking_id, mop_quote_id, total, currency, status, valid_until, created_at}` y `quote_items {id, quote_id, description, qty, unit_price, subtotal}`.

---

## 12. Integraciones Externas

> **Todas las siguientes están a nivel de diseño; ninguna existe en el código.**

### mop-socket-server
- **Endpoints:** ❌ no definidos. Falta URL `wss://`, protocolo (WebSocket nativo vs Socket.IO), entorno staging.
- **Eventos:** planificados `booking_status_updated`, `support_message_created`, `payment_updated`, `operational_logs`. Sin schema oficial.
- **Payloads:** ❌ sin contrato JSON definido.

### mop-core-ng
- **Endpoints:** ❌ no definidos (provisión/sync de usuarios, obtención de UID).
- **Payloads:** ❌ sin definir.

### mop-admin
- **Endpoints:** ❌ no definidos (`order.create`, asignación de proveedor, generación de presupuesto, registro de pago/payout).
- **Payloads:** ❌ sin definir.

### Pub/Sub
- **Topics usados:** ninguno.
- **Topics faltantes:** todo el bus de eventos (p.ej. `br.orders`, `br.payments`, `br.quotes`, `br.chat`). Sin definir si MoP usa Pub/Sub real o solo WebSocket.

---

## 13. Seguridad

| Control | Estado |
|---|---|
| JWT | ✅ (Supabase access token JWT) |
| Refresh tokens | ✅ (gestionados por `@supabase/ssr`) |
| Rate limiting | ❌ (solo defaults de Supabase; sin rate limit propio en API routes) |
| Protección websocket | ❌ (no hay ws propio; el de Supabase Realtime usa RLS) |
| Validación de payloads | 🟡 (validación client-side; API routes validan mínimamente) |
| Protección de archivos | ❌ (buckets **públicos** — cualquiera con la URL lee imágenes de bookings) |

**Riesgos detectados:**
1. **Buckets públicos**: `booking-images` es público → fotos del problema (potencialmente sensibles, con direcciones) accesibles por URL sin auth. **Alto**.
2. **Server Actions sin verificación de propiedad**: `acceptOffer`/`confirmOffer`/`rejectOffer` (`app/actions/bookings.ts`) usan `createAdminClient()` (bypass RLS) y **no verifican** que el caller sea el dueño del booking/oferta. Cualquier usuario autenticado podría invocarlas con IDs ajenos. **Alto**.
3. **Sin rate limiting** en endpoints de tracking de ads (`/api/ads/click`,`/impression`) ni en chat → spam/inflado de métricas. **Medio**.
4. **`SUPABASE_SERVICE_ROLE_KEY`** correctamente solo server-side ✅, pero hay que asegurar que nunca se filtre a bundles cliente.

**Mejoras recomendadas:** mover `booking-images` (y futuros adjuntos) a bucket **privado** con signed URLs; agregar checks de ownership en las server actions (o moverlas a operar con RLS del usuario en vez de admin client); rate limiting (Upstash/Vercel); validación de schema (zod) en todas las API routes; firmar y validar el webhook de MercadoPago; autenticar el socket-server contra MoP con token rotado.

---

# GAPS DETECTADOS

### Gap 1 — No existe ninguna integración con MoP
**Impacto:** Alto · **Complejidad:** Alta · **Dependencias:** mop-socket-server, mop-core-ng, mop-admin.
**Solución:** Crear `socket-server` (Node en Railway) como thin adapter: conexión persistente a MoP, normaliza eventos y persiste en Supabase; el frontend consume vía Supabase Realtime. Requiere primero el contrato (URL, auth, schema de eventos) de MoP.

### Gap 2 — Modelo de datos no alineado con el flujo MoP (orden/presupuesto/pago/payout)
**Impacto:** Alto · **Complejidad:** Media · **Dependencias:** mop-admin.
**Solución:** Migraciones: agregar a `bookings` (`mop_order_id`, `mop_order_number`, `mop_status`, `crm_sync_status`, `internal_notes`, `metadata`); crear `quotes`+`quote_items`, `payments`, `crm_events`. Separar estado de negocio del estado operativo MoP.

### Gap 3 — Sin pantalla "Botón Rojo" ni chat conversacional/bot
**Impacto:** Alto · **Complejidad:** Alta · **Dependencias:** mop bot/IA, mop-socket-server.
**Solución:** Nueva pantalla + UI de chat con tipos de mensaje (text/image/location/system/bot); modelo `conversations`; ingestión de mensajes de bot vía socket-server.

### Gap 4 — Realtime no habilitado en `bookings`/`quotes`/`payments`
**Impacto:** Alto · **Complejidad:** Baja · **Dependencias:** Supabase.
**Solución:** `alter publication supabase_realtime add table bookings, quotes, payments;` + subscripciones en frontend.

### Gap 5 — Pagos inexistentes (MercadoPago solo stub)
**Impacto:** Alto · **Complejidad:** Media · **Dependencias:** MercadoPago, mop-admin (registro de pago/payout).
**Solución:** Implementar SDK, endpoint de preferencia, webhook firmado, tabla `payments`, UI de pago + estado, y flujo de pago manual.

### Gap 6 — Buckets públicos / Server Actions sin ownership
**Impacto:** Alto · **Complejidad:** Baja · **Dependencias:** Supabase.
**Solución:** Buckets privados con signed URLs; checks de autorización en server actions.

### Gap 7 — Sin notificaciones (push/email/SMS/WhatsApp)
**Impacto:** Medio · **Complejidad:** Media · **Dependencias:** FCM/Expo, Resend, WhatsApp API.
**Solución:** Servicio de notificaciones disparado por eventos MoP.

### Gap 8 — Sin recuperación de contraseña ni verificación de teléfono
**Impacto:** Medio · **Complejidad:** Baja · **Dependencias:** Supabase / proveedor SMS.
**Solución:** `resetPasswordForEmail` + ruta `/reset`; OTP de teléfono.

### Gap 9 — Sin sincronización de identidad con mop-core-ng
**Impacto:** Medio · **Complejidad:** Media · **Dependencias:** mop-core-ng.
**Solución:** `profiles.mop_user_id`; provisión de usuario al registrarse.

### Gap 10 — Multimedia limitada (solo 1 imagen, sin adjuntos en chat)
**Impacto:** Bajo · **Complejidad:** Baja · **Dependencias:** Supabase Storage.
**Solución:** Adjuntos múltiples + adjuntos en chat (jsonb `attachments`).

---

# Roadmap Final

| Prioridad | Tarea | Sistema | Complejidad |
|---|---|---|---|
| 1 | Definir contrato con MoP (URL wss, auth, schema de eventos, ownership) | MoP (todos) | — (bloqueante) |
| 2 | Migraciones de modelo de datos (mop_order_id, mop_status, quotes, payments, crm_events) | Supabase | Media |
| 3 | Crear `socket-server` (adapter MoP ↔ Supabase) en Railway | socket-server | Alta |
| 4 | `order.create` + persistir orderId/orderNumber + callback | mop-admin / socket-server | Media |
| 5 | Habilitar Realtime en bookings/quotes/payments + subscripciones frontend | Supabase | Baja |
| 6 | Mapeo de estados MoP → UI de seguimiento de orden | mop-admin | Media |
| 7 | Seguridad: buckets privados + ownership en server actions | Supabase | Baja |
| 8 | Presupuestos itemizados (quotes/quote_items + UI) | mop-admin | Media |
| 9 | Pantalla Botón Rojo + chat conversacional/bot | mop bot / socket-server | Alta |
| 10 | Integración MercadoPago + pago manual + UI | MercadoPago / mop-admin | Media |
| 11 | Sincronización de identidad con mop-core-ng | mop-core-ng | Media |
| 12 | Notificaciones (push/email/WhatsApp) | FCM / Resend / WhatsApp | Media |
| 13 | Recuperación de contraseña + verificación de teléfono | Supabase / SMS | Baja |
| 14 | Multimedia ampliada (adjuntos en chat, video/doc/audio) | Supabase Storage | Baja |

---

# Resumen Ejecutivo

**Estado real de integración con MoP: 0% en código.** No existe ninguna línea que conecte la WebApp con el ecosistema MoP (sin socket-server, sin WebSocket, sin `order.create`, sin tablas de orden/presupuesto/pago, sin bot). La totalidad de la integración está en estado de **diseño** ([arquitectura-crm-integration.md](arquitectura-crm-integration.md)).

**Lo que sí está construido (~70% de una app autónoma):** auth Supabase con roles, registro multistep, dashboards de cliente/proveedor/admin, flujo de marketplace (solicitud → ofertas → confirmación), chat humano en tiempo real (Supabase Realtime sobre `messages`), chat de soporte, stories, ads con tracking, y panel admin completo. Es una base sólida pero con un **modelo de dominio distinto** al de MoP.

**Avance estimado hacia "integrado con MoP": ~15%** — la infraestructura base (Supabase, auth, Realtime, UI de bookings/chat) es reutilizable, pero ninguna pieza de integración real está hecha.

**Bloqueadores actuales (críticos):**
1. **Falta el contrato técnico de MoP**: URL `wss://`, método de auth, schema/catálogo de eventos, ownership de datos, dirección del flujo (uni/bidireccional). Sin esto no se puede empezar el socket-server.
2. El **modelo de datos** no contempla órdenes MoP, presupuestos itemizados ni pagos.
3. **No hay capa de pagos** real.

**Próximos pasos recomendados:** (1) cerrar el contrato con MoP; (2) migraciones de datos (estados/órdenes/quotes/payments/crm_events); (3) construir el socket-server como thin adapter; (4) habilitar Realtime en `bookings`; (5) implementar el flujo orden→presupuesto→pago→payout sobre el modelo nuevo.

**Riesgos de salida a producción (NO apto hoy):**
- **Seguridad:** buckets de imágenes públicos con datos sensibles; server actions con `service_role` sin verificación de ownership; sin rate limiting.
- **Pagos no implementados** (stub que lanza error).
- **Sin sincronización en tiempo real de órdenes** (Realtime no está en `bookings`).
- **Sin notificaciones** fuera de la app.

**Arquitectura final sugerida** (alineada al doc existente):
```
App (Next.js/React Native) ──HTTP──► Supabase (Postgres + RLS + Realtime)
            ▲ Realtime                          ▲ persiste
            └───────────────────────────────────┤
                                       socket-server (Railway, thin adapter)
                                                 ▲ wss / REST
                                                 └── MoP (mop-admin / mop-core-ng / mop-socket-server)
```
El frontend nunca habla directo con MoP; Supabase es la fuente de verdad y el socket-server el único puente.

**Flujo completo App → MoP → Operador → Proveedor → Cliente:**
1. Cliente abre Botón Rojo y conversa con el bot (mensajes vía socket-server ↔ Supabase).
2. La app/bot dispara `order.create` → mop-admin genera la orden → retorna `orderId`/`orderNumber` → se persiste en `bookings`.
3. Operador BR (humano/IA) asigna proveedor → evento `order.assigned` → Supabase → Realtime → UI.
4. Se genera presupuesto en MoP → evento `quote.created` → `quotes`/`quote_items` → UI.
5. Cliente acepta → `quote.accepted` → MoP.
6. Cliente paga (MercadoPago o manual) → `payment.pending`/`payment.approved` → `payments`.
7. Se registra el pago → estado `paid`.
8. Payout al proveedor → `payout.pending`/`payout.paid`.
9. Orden se cierra → `order.completed` → `bookings.status='completed'`.
