# Botón Rojo — Arquitectura e Integración CRM

## Stack actual

| Capa | Tecnología | Hosting |
|------|-----------|---------|
| Frontend + API routes | Next.js (App Router) + TypeScript | Vercel |
| Base de datos + Auth | Supabase (PostgreSQL + RLS) | Supabase Cloud |
| Tiempo real interno | Supabase Realtime (WebSocket) | Supabase Cloud |
| Conector CRM | Node.js socket-server | Railway *(a crear)* |

---

## Diagrama de arquitectura

```
┌──────────────┐         ┌─────────────────────────────────┐
│   USUARIO    │ ──────► │         VERCEL                  │
│  (browser)   │ ◄────── │   Next.js App                   │
└──────────────┘   HTTP  │                                 │
                         │  app/                           │
                         │  ├── (auth)/login, register     │
                         │  ├── dashboard/                 │
                         │  │   ├── client/                │
                         │  │   └── provider/              │
                         │  ├── admin/                     │
                         │  └── api/                       │
                         │      ├── ads/                   │
                         │      └── admin/categories/      │
                         └────────────┬────────────────────┘
                                      │ lee/escribe
                                      ▼
                         ┌─────────────────────────────────┐
                         │          SUPABASE               │
                         │                                 │
                         │  tablas:                        │
                         │  ├── profiles                   │
                         │  ├── bookings  ◄── estados      │
                         │  ├── services                   │
                         │  └── messages  ◄── realtime     │
                         │                                 │
                         │  Realtime (WebSocket interno)   │
                         └────────────┬────────────────────┘
                                      ▲
                                      │ escribe
                         ┌────────────┴────────────────────┐
                         │          RAILWAY                │
                         │   socket-server (Node.js)       │
                         │                                 │
                         │  - Conexión persistente al CRM  │
                         │  - Recibe eventos en tiempo real│
                         │  - Traduce y escribe en Supabase│
                         └────────────┬────────────────────┘
                                      │ WebSocket / Socket.IO
                                      ▼
                         ┌─────────────────────────────────┐
                         │       CRM (MOP)     │
                         │                                 │
                         │  pushea:                        │
                         │  ├── cambios de estado bookings │
                         │  ├── chats de soporte           │
                         │  └── registros / logs           │
                         └─────────────────────────────────┘
```

---

## Flujo de un evento (end-to-end)

```
1. CRM detecta cambio de estado en una solicitud
       ↓ WebSocket (wss://)
2. Railway socket-server recibe el evento JSON
       ↓ valida y transforma el payload
3. Escribe en Supabase (tabla bookings o messages)
       ↓ Supabase Realtime dispara automáticamente
4. Frontend en Vercel recibe el cambio via Supabase Realtime
       ↓
5. UI se actualiza sin que el usuario recargue
```

---

## Por qué Railway y no Vercel para el socket

Vercel ejecuta funciones serverless con timeout de 10-30 segundos. Un WebSocket necesita una conexión persistente 24/7. Railway corre un proceso Node.js continuo que puede mantener esa conexión abierta indefinidamente.

---

## Estados de bookings

### Estados visibles en la app (lo que ve el usuario)

| Estado | Descripción |
|--------|-------------|
| `pending` | Solicitud creada, esperando respuesta del proveedor |
| `confirmed` | Proveedor aceptó |
| `in_progress` | Trabajo en curso |
| `completed` | Trabajo finalizado y confirmado |
| `cancelled` | Cancelado por cualquiera de las partes |

### Estados operativos manejados desde el CRM

| Estado | Descripción |
|--------|-------------|
| `provider_viewed` | El proveedor vio la solicitud |
| `en_route` | El proveedor está en camino |
| `awaiting_confirmation` | Proveedor marcó terminado, cliente aún no confirmó |
| `cancellation_requested` | Una parte solicitó cancelar |
| `payment_pending` | Pago iniciado |
| `payment_processing` | Pago en proceso |
| `payment_failed` | Pago fallido |
| `disputed` | Cliente o proveedor abrió una disputa |
| `dispute_resolved` | Disputa resuelta por el equipo |

Estos estados no se exponen en la UI del usuario final. Los maneja el equipo de operaciones desde el CRM.

### Cambios necesarios en la DB para soportar esto

```sql
ALTER TABLE bookings ADD COLUMN internal_status text;
ALTER TABLE bookings ADD COLUMN internal_notes text;
ALTER TABLE bookings ADD COLUMN metadata jsonb default '{}';
```

---

## Lo que falta definir con el CRM

### Conexión

- [ ] URL del WebSocket (`wss://...`)
- [ ] Protocolo: WebSocket nativo o Socket.IO
- [ ] Entorno: ¿hay una URL de staging para pruebas?

### Autenticación

- [ ] Método: API key, JWT, OAuth 2.0, otro
- [ ] Dónde se envía: header, query param, mensaje inicial
- [ ] Renovación de tokens: ¿expiran? ¿cómo se renuevan?

### Formato de mensajes

- [ ] Schema JSON de cada tipo de evento
- [ ] Ejemplos reales de payloads
- [ ] Tipos de eventos disponibles (lista completa)
- [ ] Cómo identificar a qué booking/usuario corresponde cada evento

### Sincronización inicial

- [ ] ¿El CRM provee un endpoint REST para traer el estado inicial antes de conectar el socket?
- [ ] ¿Qué pasa con los eventos que ocurrieron mientras el socket estaba desconectado?

### Datos que el CRM va a manejar

- [ ] ¿El CRM también escribe perfiles de usuarios o solo estados de bookings?
- [ ] ¿Los chats de soporte reemplazan o complementan la tabla `messages` de Supabase?
- [ ] ¿Registros/logs van a una tabla nueva o a `metadata`?

### Dirección del flujo

- [ ] ¿Es unidireccional (CRM → Botón Rojo) o bidireccional?
- [ ] Si es bidireccional: ¿qué datos necesita recibir el CRM desde nuestra app?

---

## Próximos pasos técnicos

1. **Obtener documentación del CRM** — sin esto no se puede arrancar
2. **Crear `socket-server/`** — nuevo proyecto Node.js + TypeScript
3. **Deploy en Railway** — configurar variables de entorno
4. **Migración de DB** — agregar columnas `internal_status`, `metadata`
5. **Testear flujo completo** — evento CRM → Supabase → UI actualizada
