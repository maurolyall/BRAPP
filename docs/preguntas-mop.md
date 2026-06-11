# Preguntas y decisiones para el equipo MoP

> Contexto: recibimos `boton-rojo-user-flow` (arquitectura de 8 fases + sequence + Pub/Sub). Resuelve gran parte del contrato. Quedan los puntos de abajo para poder implementar el cliente WebSocket en la app **Botón Rojo (BRAPP)**.

---

## A. Conexión WebSocket (bloqueante)

1. **URL `wss://` de `mop-socket-server`** para **staging** y **producción**.
2. ¿WebSocket **nativo** o **Socket.IO**? (define la librería del cliente).
3. ¿Hay un **entorno sandbox/staging** donde podamos probar end-to-end sin afectar producción?

## B. Autenticación de la app (bloqueante)

4. **¿Cómo autentica la APP la conexión WS?** El doc detalla HMAC (`X-Internal-Token`) entre core-ng↔admin y OIDC en los push de Pub/Sub, pero **no** cómo se autentica nuestra app cliente.
   - ¿Token en el handshake? ¿query param? ¿primer mensaje `auth`?
   - ¿Cómo se **emite** ese token y cuál es su **expiración / refresh**?
5. ¿La conexión WS está atada a un `uid` y/o `wid`? ¿Cómo se los pasamos en el connect?

## C. Identidad de usuario (`uid` / `wid`)

6. El sequence usa `uid` (`PATCH /state/user/{uid}/variables`) y `wid` (`/workspaces/{wid}/orders`).
   - **¿Quién genera el `uid`?** ¿Lo crea MoP (GoHighLevel contact) y nos lo devuelve, o lo provee la app?
   - ¿Cómo **mapeamos** nuestro usuario de Supabase (UUID) con el `uid` de MoP? ¿Hay un endpoint de provisión/lookup?
   - **¿Cómo se resuelve el `wid` (workspace)** para un usuario dado? ¿Es fijo, por región, por algo más?

## D. Schemas de mensajes (bloqueante para el chat)

7. **Schema de lo que envía la app** → `client_event` / `mop.client.message.inbound/v1`:
   - estructura JSON, tipos de evento (texto/intent), campos obligatorios.
8. **Schema de lo que recibe la app** → `WS emit` (`outbound-msg`):
   - texto del bot, mensajes de sistema, confirmaciones, quick-replies/botones si los hay.
9. **Subida de foto** durante la conversación (el flujo menciona "foto"):
   - ¿va por WS (base64)? ¿endpoint de upload aparte? ¿URL firmada? formato/tamaño máximo.
10. **Ubicación/urgencia**: ¿se mandan como campos estructurados o como texto libre dentro de la conversación?

## E. Creación y seguimiento de orden

11. **Payload de `order.create`** (`customer` + `serviceRequest`): estructura completa, para poder mostrar el resumen del pedido en la app tras la confirmación.
12. Confirmación de creación: además de `{ id, orderNumber }`, ¿qué más llega en el `WS emit (confirmación)`?
13. **CRÍTICO — canal de updates post-creación.** Los topics `mop.order.assigned/v1`, `mop.order.completed/v1`, `mop.payment.approved/v1` figuran con consumer **"(subs futuros)"**.
    - **¿Cómo recibe la app el estado de la orden después de crearla?** (asignado → presupuesto → pago → completado).
    - Opciones: que `socket-server` nos los emita por WS, o suscribirnos al Pub/Sub. ¿Cuál prefieren y para cuándo?
14. **Presupuesto en la app:** hoy se envía al proveedor por WhatsApp (out-of-band). ¿El **cliente** verá/aceptará el presupuesto **dentro de la app** en algún momento, o seguirá siendo 100% WhatsApp?

## F. Pago y payout

15. ¿El **cobro al cliente** será siempre out-of-band (efectivo/transfer/MP manual registrado por el Operador), o se planea un **checkout MercadoPago in-app**? (tenemos el stub listo).
16. **Webhook MP:** cuando se use MP, ¿el webhook lo maneja mop-admin y emite `mop.payment.approved/v1`, o esperan que lo manejemos nosotros?
17. **Payout (fase 7, TBD):** ¿afecta a la app en algo, o es 100% interno de MoP? (entendemos que el proveedor no es actor; si hay app de proveedor a futuro, cambia).

## G. Decisiones de producto / arquitectura

18. **Modelo de proveedor.** El doc dice "el proveedor no es actor del sistema" y contempla "si en el futuro se agrega una app del proveedor, esto cambia". BRAPP **ya tiene** un dashboard de proveedor completo (ofertas, aceptar/confirmar, chat).
    - ¿Descartamos el lado proveedor de BRAPP y nos alineamos al modelo concierge?
    - ¿O MoP planea soportar app de proveedor y conviene integrarlo a `orders` (no a nuestro `booking_offers`)?
19. **¿Existe ya una "Botón Rojo App"?** En la tabla de fases, la fase 1 figura como **"✅ funciona"**. ¿Es un prototipo de MoP, o **BRAPP es la app que debe implementar el cliente WS**? (Necesitamos saber si partimos de algo existente).
20. **Fuente de verdad:** confirmamos que órdenes/presupuestos/pagos viven en **Firestore (MoP)**. ¿Esperan que BRAPP **espeje** ese estado en su Supabase, o que **lea en vivo** vía los eventos? ¿Hay alguna API REST de lectura de órdenes para la app?

## H. Resiliencia / operación

21. **Replay / reconexión:** si la app pierde la conexión WS, ¿cómo recupera la conversación y el estado de la orden? ¿Hay endpoint de historial?
22. **Rate limits / heartbeat:** ¿ping/pong esperado? ¿límites de mensajes?
23. **Versionado:** los eventos usan `/v1`. ¿Cómo nos comunican breaking changes?
