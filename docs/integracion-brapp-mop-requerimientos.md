# Integración Botón Rojo (App) ↔ Ecosistema MoP
### Documento de requerimientos y puntos a definir

**De:** Equipo Botón Rojo App (BRAPP)
**Para:** Equipo MoP
**Fecha:** 2026-06-02
**Referencia:** `mop-docs/architecture/boton-rojo-user-flow`

---

## 1. Objetivo

Dejar acordado el contrato técnico necesario para que la **App Botón Rojo** se integre con el ecosistema MoP, según el flujo de 8 fases documentado por MoP. Este documento lista lo que necesitamos de su lado, lo que aportamos del nuestro, y las decisiones abiertas.

---

## 2. Nuestra arquitectura (contexto)

| Capa | Tecnología |
|---|---|
| Frontend / App | Next.js (App Router) + React + TypeScript |
| Backend (datos, auth, tiempo real) | Supabase (PostgreSQL + Auth + Realtime) |
| Hosting | Vercel |

Confirmamos haber recibido y revisado la arquitectura de MoP. Entendemos que:
- La App se conecta como **cliente WebSocket** a `mop-socket-server`.
- El flujo es **conversacional** (bot GoHighLevel/VF vía `mop-core-ng`).
- La orden la crea el bot (`order.create`, HMAC) y devuelve `{ id, orderNumber }`.
- La **fuente de verdad** de órdenes/presupuestos/pagos es **Firestore (MoP)**.

---

## 3. Lo que necesitamos de MoP

### 3.1. Conexión WebSocket (bloqueante)
- [ ] URL `wss://` de `mop-socket-server` — **staging** y **producción**.
- [ ] Protocolo: ¿WebSocket nativo o Socket.IO?
- [ ] Disponibilidad de un entorno **sandbox/staging** para pruebas end-to-end.

### 3.2. Autenticación de la App (bloqueante)
- [ ] Mecanismo de autenticación de **nuestra App** al abrir la conexión WS (el doc detalla HMAC y OIDC entre sistemas internos, pero no el método para el cliente App).
- [ ] Forma de emisión, ubicación (handshake / mensaje inicial) y expiración/refresh del token.

### 3.3. Schemas de mensajes (bloqueante)
- [ ] Estructura de los eventos que **envía** la App (`client_event` / `mop.client.message.inbound/v1`).
- [ ] Estructura de los eventos que **recibe** la App (`outbound-msg`: respuestas del bot, confirmaciones, quick-replies).
- [ ] Manejo de **adjuntos** (foto del problema) durante la conversación: ¿por WS, endpoint de upload o URL firmada? Formato y tamaño máximo.
- [ ] **Ubicación** y **urgencia**: ¿campos estructurados o texto libre dentro de la conversación?

### 3.4. Identidad de usuario
- [ ] Origen del `uid`: ¿lo genera MoP (contacto GoHighLevel) y lo retorna, o lo provee la App?
- [ ] Mecanismo para **mapear** nuestro usuario (Supabase) con el `uid` de MoP (endpoint de provisión/lookup).
- [ ] Cómo se resuelve el **`workspace id (wid)`** para cada usuario.

### 3.5. Seguimiento de orden (prioritario)
> En el doc, los topics `mop.order.created/assigned/completed/v1` y `mop.payment.approved/v1` figuran con consumer **"(subs futuros)"**. Hoy la App solo recibe la confirmación de creación.

- [ ] **¿Cómo recibe la App los cambios de estado posteriores** (asignación, presupuesto, pago, completado)?
- [ ] Propuesta nuestra: reutilizar la conexión **WebSocket** ya abierta para emitir esos eventos a la App. ¿Es viable? ¿Para cuándo?
- [ ] ¿Existe (o puede existir) un **endpoint de consulta** del estado de una orden bajo demanda?

### 3.6. Pagos (propuesta de la App — a implementar, no solo a evaluar)

> **Decisión de producto del lado App:** queremos un mecanismo de pago **electrónico unificado con MercadoPago**, evitando el registro manual del operador. Un mismo pago, con dos formas de entrega:
> - **In-app:** el cliente paga dentro de la App (checkout integrado).
> - **Por WhatsApp:** se genera un **link de pago** de MercadoPago y se le envía; el cliente paga desde ahí.
>
> En ambos casos, la **confirmación es automática** vía el webhook de MercadoPago (que dispararía `mop.payment.approved/v1`), eliminando el paso manual "Registrar pago del cliente".

Puntos a **acordar** con MoP para habilitarlo (involucran a ambos sistemas):
- [ ] **Titularidad de la cuenta MercadoPago**: ¿de MoP, de Botón Rojo, o una por workspace? (define dónde se acredita el dinero y de quién son las credenciales).
- [ ] **Generación del link/preferencia de pago**: ¿la genera la App o mop-admin? (preferimos un único punto que cree la preferencia por orden/presupuesto aceptado).
- [ ] **Recepción del webhook de MercadoPago**: ¿quién lo recibe y dispara `mop.payment.approved/v1`? (proponemos que lo centralice mop-admin para mantener Firestore como fuente de verdad).
- [ ] Datos necesarios para crear la preferencia (monto, `orderNumber`, referencia externa, email del cliente).

> Nota: el doc de MoP indica que hoy existen endpoints HMAC para crear orden/asignar/presupuesto pero **no** para registrar pago/payout. Este esquema con webhook automático cubre justamente ese gap.

### 3.7. Payout al proveedor
- [ ] El payout (marcado TBD en el doc): ¿impacta en la App o es 100% interno de MoP?

### 3.8. Resiliencia y versionado
- [ ] Recuperación tras desconexión (replay de conversación / estado de orden).
- [ ] Heartbeat / límites de mensajes esperados.
- [ ] Comunicación de cambios de versión de eventos (`/v1` → futuros).

---

## 4. Lo que aportamos del lado de la App

- App cliente (Next.js/React) que implementará el **cliente WebSocket** una vez recibido el contrato.
- Datos del cliente disponibles para `order.create` (a confirmar el set exacto requerido): nombre, contacto, dirección, descripción del problema, foto, fecha/urgencia.
- Backend propio (Supabase) para autenticación de usuarios y, de ser necesario, **espejado** del estado de las órdenes para la experiencia in-app.

---

## 5. Decisiones abiertas a acordar

| # | Tema | Detalle |
|---|---|---|
| 1 | **¿Qué App es "la App"?** | La fase 1 figura como "✅ funciona". Confirmar si existe una App de MoP o si **BRAPP** es la que debe implementar el cliente WS. |
| 2 | **Modelo de proveedor** | MoP define "el proveedor no es actor del sistema" (WhatsApp + payout out-of-band). BRAPP cuenta con un panel de proveedor completo. Definir si se descarta, convive, o se integra a futuro (el doc contempla "si se agrega app de proveedor, esto cambia"). |
| 3 | **Aceptación de presupuesto in-app** | Hoy es por WhatsApp. Evaluar si el cliente verá/aceptará el presupuesto dentro de la App. |
| 4 | **Fuente de verdad y sincronización** | Confirmar Firestore como autoritativo; definir si la App espeja en Supabase o lee en vivo, y la política ante discrepancias. |

---

## 6. Próximos pasos propuestos

1. MoP comparte: URL `wss://`, método de auth de la App y schemas de mensajes (con ejemplos).
2. Acordar el canal de eventos de estado hacia la App (sección 3.5).
3. Definir el mapeo de identidad (`uid` / `wid`).
4. Tomar decisiones de la sección 5.
5. Fijar fecha de seguimiento.

---

*Documento abierto a revisión conjunta.*
