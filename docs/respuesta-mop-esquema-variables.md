# Respuesta a MoP — Esquema de Variables Técnicas (App Botón Rojo)

> Fecha: 2026-07-24
> Contexto: MoP solicitó el listado de variables técnicas que usa la App para registrar usuarios, con el objetivo de alinearlas con el Workspace (CRM/Bot).

---

## 1. Resumen de Tareas Realizadas (24/07/2026)

| # | Tarea | Archivos modificados |
|---|---|---|
| 1 | **Indicator de "pensando" en chat de soporte** — Se agregó una burbuja animada con 3 puntos que aparece cuando el bot está procesando una respuesta. | `components/dashboard/SupportChatDrawer.tsx`, `app/globals.css` |
| 2 | **Fix: bot dejaba de responder** — MoP rechazaba el payload porque el teléfono no estaba en formato E.164. Se agregó función `toE164()` para normalizar el teléfono antes de enviarlo. | `app/api/support/message/route.ts` |
| 3 | **Fix: mensajes duplicados del bot** — MoP podía reenviar el mismo evento por reconexión/retries. Se agregó dedup server-side por `userId:content` con ventana de 5 segundos. | `lib/mop-socket.ts` |
| 4 | **Fix: formato de mensajes del bot** — Se agregó `remarkGfm` a ReactMarkdown y se mejoraron los componentes (listas numeradas, código, links, saltos de línea). | `components/dashboard/SupportChatDrawer.tsx` |

---

## 2. Variables Técnicas que Enviamos a MoP

Cuando un usuario envía un mensaje en el chat de soporte, la App emite un evento `mop.client.message.inbound/v1` al Workspace con el siguiente payload:

### Payload enviado (App → MoP)

```json
{
  "schema": "mop.client.message.inbound/v1",
  "idempotencyKey": "<uuid-v4>",
  "payload": {
    "externalUserId": "<uuid-supabase>",
    "user": {
      "name": "<full_name>",
      "phone": "<telefono-e164>"
    },
    "text": "<mensaje-del-usuario>"
  }
}
```

### Variables exactas y su origen

| Variable en payload | Tipo | Origen en Supabase | Descripción |
|---|---|---|---|
| `externalUserId` | `uuid` | `auth.users.id` (= `profiles.id`) | ID único del usuario en Supabase. Es la PK de todo nuestro sistema. Se envía como string UUID. |
| `user.name` | `text` | `profiles.full_name` | Nombre completo del usuario. Fallback: `"Usuario"` si es null. |
| `user.phone` | `text` (E.164) | `profiles.phone` | Teléfono normalizado a formato E.164 (`+54XXXXXXXXX`). Si el teléfono no es válido, se envía `+5400000000000` como fallback. |
| `text` | `text` | input del usuario | Texto del mensaje, recortado (trim). |

### Respuesta recibida (MoP → App)

MoP responde con el schema `mop.message.outbound/v1`. La App busca el texto en este orden de prioridad:

```json
{
  "schema": "mop.message.outbound/v1",
  "payload": {
    "externalUserId": "<mismo-uuid>",
    "text": "<respuesta-del-bot>",
    "messages": [{ "type": "text", "text": "..." }],
    "blocks": [{ "type": "text", "text": "..." }]
  }
}
```

La App extrae el texto con esta prioridad:
1. `payload.text`
2. `payload.messages[].text` (primer mensaje de tipo `"text"`)
3. `payload.blocks[].text` (primer block de tipo `"text"`)

Si `externalUserId` no es un UUID válido, el evento se descarta.

---

## 3. Esquema Completo de la Tabla `profiles` (Supabase)

Esta es la tabla de usuarios completa. Las variables que **ya existen** y se usan actualmente están marcadas con ✅. Las que **faltan** para una integración completa con MoP están con ❌.

| Columna | Tipo | Nullable | Descripción | Estado integración |
|---|---|---|---|---|
| `id` | `uuid` (PK) | No | ID de `auth.users`. Se envía como `externalUserId`. | ✅ Se envía a MoP |
| `email` | `text` | No | Email del usuario (Supabase Auth). | ❌ No se envía a MoP |
| `full_name` | `text` | Sí | Nombre completo. Se envía como `user.name`. | ✅ Se envía a MoP |
| `role` | `text` | No | `"user"` / `"provider"` / `"admin"`. Default: `"user"`. | ❌ No se envía a MoP |
| `avatar_url` | `text` | Sí | URL del avatar (Supabase Storage). | ❌ No se envía a MoP |
| `phone` | `text` | Sí | Teléfono. Se normaliza a E.164 antes de enviar. | ✅ Se envía a MoP |
| `date_of_birth` | `date` | Sí | Fecha de nacimiento. | ❌ No se envía a MoP |
| `dni` | `text` | Sí | DNI del usuario. | ❌ No se envía a MoP |
| `cuit` | `text` | Sí | CUIT (solo proveedores). | ❌ No se envía a MoP |
| `business_name` | `text` | Sí | Nombre del negocio (solo proveedores). | ❌ No se envía a MoP |
| `city` | `text` | Sí | Ciudad. | ❌ No se envía a MoP |
| `address` | `text` | Sí | Dirección. | ❌ No se envía a MoP |
| `floor_apt` | `text` | Sí | Piso/Departamento. | ❌ No se envía a MoP |
| `lot` | `text` | Sí | Lote. | ❌ No se envía a MoP |
| `created_at` | `timestamptz` | No | Fecha de creación del perfil. | ❌ No se envía a MoP |
| `updated_at` | `timestamptz` | No | Última actualización del perfil. | ❌ No se envía a MoP |

### Campos que recomendamos agregar para la integración completa

| Campo sugerido | Tipo | Descripción |
|---|---|---|
| `mop_user_id` | `text` | UID del usuario en mop-core-ng (para sincronizar identidad). |
| `mop_sync_status` | `text` | Estado de sincronización: `pending` / `synced` / `error`. |
| `mop_synced_at` | `timestamptz` | Última vez que se sincronizó con MoP. |

---

## 4. Otras Tablas Relevantes

### `support_messages` (chat con el bot)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` (PK) | ID del mensaje. |
| `user_id` | `uuid` (FK → profiles) | Usuario dueño del chat. |
| `sender_id` | `uuid` (FK → profiles) | Quién envió el mensaje (el usuario o el bot). |
| `content` | `text` | Texto del mensaje. |
| `is_bot` | `boolean` | `true` si el mensaje es del bot (MoP), `false` si es del usuario. |
| `created_at` | `timestamptz` | Timestamp del mensaje. |

> Realtime habilitado: la App recibe mensajes del bot en tiempo real vía Supabase Realtime.

### `services` (servicios del proveedor)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` (PK) | ID del servicio. |
| `user_id` | `uuid` (FK → profiles) | Proveedor dueño del servicio. |
| `title` | `text` | Nombre del servicio. |
| `description` | `text` | Descripción. |
| `price` | `numeric(10,2)` | Precio. |
| `category` | `text` | Categoría (legacy, ver `provider_categories`). |
| `active` | `boolean` | Si está visible. |

### `bookings` (solicitudes/órdenes)

Este es el equivalente en Supabase a una "orden" de MoP. **Actualmente la App crea bookings directamente en Supabase sin pasar por MoP.** La integración de `order.create` con MoP está pendiente.

| Columna | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | `uuid` (PK) | No | ID del booking. Sería el link con `orderId` de MoP. |
| `user_id` | `uuid` (FK → profiles) | No | Cliente que solicita (= `externalUserId`). |
| `service_id` | `uuid` (FK → services) | No | Servicio solicitado. |
| `provider_id` | `uuid` (FK → profiles) | Sí | Proveedor asignado (se asigna después, vía MoP operador). |
| `status` | `text` | No | Estado actual de la orden (ver mapeo abajo). |
| `date` | `timestamptz` | No | Fecha/hora del servicio. |
| `notes` | `text` | Sí | Notas o descripción del problema del cliente. |
| `created_at` | `timestamptz` | No | Fecha de creación. |
| `updated_at` | `timestamptz` | No | Última actualización. |

#### Estados actuales vs. estados MoP

| Estado en App (`bookings.status`) | Estado MoP (propuesto) | Descripción |
|---|---|---|
| `pending` | `new` | Cliente creó la solicitud, esperando procesamiento. |
| — | `assigned` | Operador MoP asignó un proveedor. **No existe aún en la App.** |
| — | `quote_pending` | Presupuesto enviado al cliente. **No existe aún.** |
| — | `quote_accepted` | Cliente aceptó el presupuesto. |
| — | `payment_pending` | Esperando pago. |
| — | `approved` | Pago aprobado. |
| `confirmed` | — | Proveedor confirmó (flujo actual, sin MoP). |
| `completed` | `completed` | Trabajo finalizado. |
| `cancelled` | `cancelled` | Orden cancelada. |

#### Campos que necesitamos agregar para integrar con MoP

| Campo nuevo | Tipo | Descripción |
|---|---|---|
| `mop_order_id` | `text` | ID de la orden en MoP (`orderId` retornado por `order.create`). |
| `mop_order_number` | `text` | Número de orden legible (`orderNumber` de MoP). |
| `mop_status` | `text` | Estado operativo en MoP (separado del `status` de negocio de la App). |
| `crm_sync_status` | `text` | `pending` / `synced` / `error` — estado de sincronización con MoP. |
| `metadata` | `jsonb` | Datos adicionales del Workspace (monto estimado, tipo de proveedor, etc.). |

#### Payload propuesto para `order.create` (App → MoP)

```json
{
  "schema": "mop.order.create/v1",
  "idempotencyKey": "<uuid-v4>",
  "payload": {
    "externalUserId": "<profiles.id>",
    "user": {
      "name": "<profiles.full_name>",
      "phone": "<profiles.phone (E.164)>",
      "email": "<profiles.email>"
    },
    "serviceRequest": {
      "title": "<services.title>",
      "description": "<bookings.notes>",
      "category": "<service_categories.name>",
      "scheduledDate": "<bookings.date (ISO 8601)>",
      "address": "<profiles.address>",
      "city": "<profiles.city>",
      "paymentMethod": "<coordinate | prepaid>"
    }
  }
}
```

#### Respuesta esperada de MoP (`order.create`)

```json
{
  "orderId": "abc123",
  "orderNumber": "BR-00123"
}
```

Estos valores se guardarían en `bookings.mop_order_id` y `bookings.mop_order_number`.

### `provider_categories` (rubros del proveedor)

| Columna | Tipo | Descripción |
|---|---|---|
| `provider_id` | `uuid` (FK → profiles) | Proveedor. |
| `category_id` | `uuid` (FK → service_categories) | Rubro. |
| `professional_description` | `text` | Descripción profesional. |
| `visit_price` | `numeric(10,2)` | Precio de visita (mínimo $30.000). |
| `labor_warranty` | `text` | `30_dias` / `60_dias` / `90_dias` / `180_dias` / `1_año`. |
| `years_experience` | `text` | `1_año` / `1_a_3_años` / `3_a_5_años` / `5_a_10_años` / `mas_de_10_años`. |

---

## 5. Flujo Actual de Datos

```
App (Next.js)                    Supabase                         MoP (Workspace)
     │                              │                                 │
     │  1. Usuario envía mensaje    │                                 │
     │  ──── INSERT ──────────────► │ support_messages                │
     │                              │                                 │
     │  2. App emite evento WS      │                                 │
     │  ──── client_event ──────────────────────────────────────────► │
     │     (externalUserId,         │                                 │
     │      user.name,              │                           Bot procesa
     │      user.phone,             │                           y responde
     │      text)                   │                                 │
     │                              │                                 │
     │                              │  3. Bot responde                │
     │  ◄─── WS emit ─────────────────────────────────────────────── │
     │     (mop.message.outbound)   │                                 │
     │                              │                                 │
     │  4. App guarda respuesta     │                                 │
     │  ──── INSERT ──────────────► │ support_messages (is_bot=true)  │
     │                              │                                 │
     │  5. Realtime notifica UI     │                                 │
     │  ◄─── postgres_changes ───── │                                 │
```

---

## 6. Mapeo de Nombres: App → Workspace

Para que el bot pueda leer/escribir correctamente, proponemos este mapeo directo:

| Campo en la App (Supabase) | Campo en el Workspace (MoP) | Notas |
|---|---|---|
| `profiles.id` | `externalUserId` | UUID de Supabase. Es el identificador único que usamos en todos los eventos. |
| `profiles.full_name` | `user.name` | Nombre completo. |
| `profiles.email` | `user.email` | **Pendiente de agregar al payload.** |
| `profiles.phone` | `user.phone` | Normalizado a E.164 (`+54XXXXXXXXX`). |
| `profiles.role` | *(pendiente)* | `user` / `provider` / `admin`. |
| `profiles.city` | `serviceRequest.city` | **Pendiente de agregar al payload.** |
| `profiles.address` | `serviceRequest.address` | **Pendiente de agregar al payload.** |
| `provider_categories.category_id` | `serviceRequest.category` | Rubro del proveedor. |
| `bookings.id` | *(link con orderId)* | Sería el link entre la orden MoP y el booking en Supabase. |
| `bookings.mop_order_id` | `orderId` | **Campo nuevo.** ID retornado por MoP al crear la orden. |
| `bookings.mop_order_number` | `orderNumber` | **Campo nuevo.** Número legible de la orden. |
| `bookings.mop_status` | `status` | **Campo nuevo.** Estado operativo en el Workspace. |
| `bookings.notes` | `serviceRequest.description` | Descripción del problema/servicio. |
| `bookings.date` | `serviceRequest.scheduledDate` | Fecha programada del servicio. |

---

## 7. Preguntas para MoP

Para completar la alineación, necesitamos que MoP nos confirme:

1. **¿Qué variables adicionales necesitan para el chat?** Actualmente solo enviamos `name`, `phone` y `externalUserId`. Si necesitan `email`, `city`, `role`, etc., podemos agregarlas al payload.
2. **¿Cuál es el formato exacto del `externalUserId` que esperan?** Nosotros enviamos un UUID v4 de Supabase. ¿Lo usan como ID primario en su sistema?
3. **¿Necesitan un endpoint de registro/sync de usuarios?** Actualmente no registramos al usuario en MoP — solo le enviamos datos en cada mensaje. Si necesitan un `upsertContact` initial, podemos crearlo.
4. **¿Cómo queremos manejar la creación de órdenes?** Hoy la App crea bookings directo en Supabase. Necesitamos definir: (a) ¿cuándo se dispara `order.create` hacia MoP?, (b) ¿el bot conversacional es quien genera la orden o la App?, (c) ¿cuál es el payload exacto de `order.create` que espera MoP?
5. **¿Qué variables del Workspace deberíamos guardar en Supabase?** Por ejemplo, si el bot genera un `orderId` o `quoteId`, ¿lo devolvemos en el `outbound` y lo guardamos en Supabase?
