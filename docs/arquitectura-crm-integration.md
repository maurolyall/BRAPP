# Botón Rojo — Arquitectura e Integración CRM

## Stack actual

| Capa | Tecnología | Hosting |
|---|---|---|
| Frontend + API routes | Next.js (App Router) + TypeScript | Vercel |
| Base de datos + Auth | Supabase (PostgreSQL + RLS) | Supabase Cloud |
| Tiempo real interno | Supabase Realtime (WAL + WebSocket) | Supabase Cloud |
| Conector CRM | Node.js socket-server | Railway (a crear) |

---

## Objetivo de la integración

El CRM funciona como sistema operativo interno de operaciones. Botón Rojo mantiene la experiencia de usuario, autenticación, bookings y realtime frontend.

La integración se basa en una **arquitectura orientada a eventos**:

```
CRM → eventos → socket-server → Supabase → realtime → frontend
```

El frontend nunca se conecta directamente al CRM.

---

## Arquitectura general

```
┌──────────────┐         ┌─────────────────────────────────┐
│   USUARIO    │ ──────► │            VERCEL               │
│  (browser)   │ ◄────── │        Next.js App              │
└──────────────┘   HTTP  │                                 │
                         │  app/                           │
                         │  ├── (auth)/                    │
                         │  ├── dashboard/                 │
                         │  │   ├── client/                │
                         │  │   └── provider/              │
                         │  ├── admin/                     │
                         │  └── api/                       │
                         └────────────┬────────────────────┘
                                      │ lee/escribe
                                      ▼
                         ┌─────────────────────────────────┐
                         │            SUPABASE             │
                         │                                 │
                         │  PostgreSQL + RLS               │
                         │                                 │
                         │  tablas:                        │
                         │  ├── profiles                   │
                         │  ├── bookings                   │
                         │  ├── services                   │
                         │  ├── messages                   │
                         │  └── crm_events                 │
                         │                                 │
                         │  Realtime escucha WAL           │
                         │  y emite cambios vía WebSocket  │
                         └────────────┬────────────────────┘
                                      ▲
                                      │ persiste
                         ┌────────────┴────────────────────┐
                         │             RAILWAY             │
                         │     socket-server (Node.js)     │
                         │                                 │
                         │  responsabilidades:             │
                         │                                 │
                         │  - conexión persistente CRM     │
                         │  - recibe eventos realtime      │
                         │  - valida payloads              │
                         │  - normaliza eventos            │
                         │  - persiste en Supabase         │
                         │  - retry/reconnect              │
                         │  - logs y auditoría             │
                         └────────────┬────────────────────┘
                                      │ WebSocket / Socket.IO
                                      ▼
                         ┌─────────────────────────────────┐
                         │            CRM (MOP)            │
                         │                                 │
                         │  emite eventos:                 │
                         │  ├── booking_status_updated     │
                         │  ├── support_message_created    │
                         │  ├── payment_updated            │
                         │  └── operational_logs           │
                         └─────────────────────────────────┘
```

---

## Flujo de un evento (end-to-end)

1. CRM detecta un cambio operativo
2. ↓ WebSocket (`wss://`)
3. socket-server recibe el evento
4. Valida autenticación y schema
5. Normaliza el payload al formato interno
6. Guarda raw event en `crm_events`
7. Persiste cambios en `bookings` / `messages`
8. Supabase Realtime detecta cambios WAL
9. Frontend recibe actualización en tiempo real
10. UI se actualiza automáticamente

---

## Responsabilidad de cada capa

### Vercel / Next.js

Responsable de:
- UI (dashboard cliente/proveedor)
- Autenticación frontend
- Consumo realtime
- API routes internas
- Renderizado y navegación

> No mantiene conexiones persistentes con el CRM.

### Supabase

Responsable de:
- Source of truth principal (PostgreSQL)
- Autenticación y RLS
- Realtime subscriptions
- Persistencia operacional

> Funciona como capa de sincronización entre CRM y frontend.

### Railway socket-server

Responsable de:
- Conexión persistente 24/7
- Integración realtime con CRM
- Normalización de eventos
- Retry / reconnect
- Auditoría de eventos
- Traducción entre modelos externos e internos

> Debe mantenerse como **thin adapter layer** — sin lógica de negocio compleja.

---

## Por qué Railway y no Vercel para sockets

Vercel utiliza infraestructura serverless con lifecycle corto y timeouts limitados. Los WebSockets requieren:

- Conexiones persistentes
- Reconexión automática
- Listeners activos 24/7
- Heartbeat continuo

Railway permite correr un proceso Node.js permanente capaz de mantener conexiones abiertas indefinidamente.

---

## Estados de bookings

### Estados visibles para el usuario

| Estado | Descripción |
|---|---|
| `pending` | Solicitud creada |
| `confirmed` | Proveedor aceptó |
| `in_progress` | Trabajo en curso |
| `completed` | Trabajo finalizado |
| `cancelled` | Trabajo cancelado |

### Estados operativos internos (CRM)

| Estado | Descripción |
|---|---|
| `provider_viewed` | El proveedor vio la solicitud |
| `en_route` | El proveedor está en camino |
| `awaiting_confirmation` | Esperando confirmación del cliente |
| `cancellation_requested` | Solicitud de cancelación |
| `payment_pending` | Pago iniciado |
| `payment_processing` | Pago procesándose |
| `payment_failed` | Pago fallido |
| `disputed` | Disputa abierta |
| `dispute_resolved` | Disputa resuelta |

> Estos estados son internos y no necesariamente visibles para el usuario final.

### Separación de estados

Se separan intencionalmente:

| Tipo | Campo | Ejemplo |
|---|---|---|
| Estado de negocio | `bookings.status` | `completed` |
| Estado de sincronización operacional | `bookings.crm_sync_status` | `synced`, `pending_retry`, `failed` |

Esto evita mezclar lógica de negocio con estado técnico de sincronización.

---

## Cambios necesarios en DB

```sql
ALTER TABLE bookings
  ADD COLUMN internal_status text;

ALTER TABLE bookings
  ADD COLUMN internal_notes text;

ALTER TABLE bookings
  ADD COLUMN crm_sync_status text DEFAULT 'synced';

ALTER TABLE bookings
  ADD COLUMN metadata jsonb DEFAULT '{}';
```

---

## Auditoría de eventos CRM

Se recomienda persistir eventos crudos para:
- Debugging
- Replay de eventos
- Auditoría
- Recuperación ante fallos
- Inspección de payloads

```sql
CREATE TABLE crm_events (
  id         bigint generated always as identity primary key,
  event_type text,
  payload    jsonb,
  processed  boolean default false,
  received_at timestamptz default now()
);
```

---

## Resiliencia del socket-server

El conector debe tolerar desconexiones y fallos temporales. Se recomienda implementar:

- Reconnect automático exponencial
- Heartbeat / ping-pong
- Retry de escrituras fallidas
- Logs persistentes
- Manejo de duplicados
- Idempotencia básica
- Detección de eventos corruptos

---

## Lo que falta definir con el CRM

### Conexión
- [ ] URL WebSocket (`wss://...`)
- [ ] WebSocket nativo o Socket.IO
- [ ] Entorno staging / sandbox

### Autenticación
- [ ] API key / JWT / OAuth
- [ ] Ubicación del token
- [ ] Expiración y refresh

### Eventos
- [ ] Schema JSON oficial
- [ ] Ejemplos reales
- [ ] Catálogo de eventos
- [ ] Versionado de eventos
- [ ] Identificadores únicos

### Sincronización
- [ ] Endpoint REST inicial
- [ ] Replay de eventos perdidos
- [ ] Manejo offline / reconnect

### Persistencia
- [ ] Qué tablas controla el CRM
- [ ] Ownership de mensajes
- [ ] Ownership de pagos
- [ ] Ownership de disputas

### Dirección del flujo
- [ ] Integración unidireccional o bidireccional
- [ ] Qué eventos consume el CRM desde Botón Rojo
- [ ] Webhook / API de retorno

---

## Próximos pasos técnicos

### Fase 1 — Infraestructura
1. Obtener documentación oficial del CRM
2. Crear `socket-server/`
3. Configurar Railway
4. Configurar variables de entorno
5. Crear tablas y migraciones

### Fase 2 — Integración
1. Implementar conexión WebSocket
2. Validar payloads
3. Normalizar eventos
4. Persistir en Supabase
5. Conectar realtime frontend

### Fase 3 — Resiliencia
1. Retry / reconnect
2. Auditoría de eventos
3. Logging estructurado
4. Manejo de duplicados
5. Testing end-to-end

---

## Filosofía de arquitectura

La arquitectura prioriza:

- Simplicidad operacional
- Desacople entre sistemas
- Realtime nativo
- Bajo costo de infraestructura
- Escalabilidad razonable
- Mantenimiento simple

El CRM opera como sistema de eventos operacionales. Supabase funciona como **fuente central de estado** consumida por el frontend en tiempo real.
