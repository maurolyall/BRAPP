# Reunión MoP — Qué pedir y qué responder

**Nuestra app (BRAPP):** frontend en Next.js/React + backend en Supabase.
**MoP:** su sistema usa Firebase (Firestore). Los dos se conectan por WebSocket (línea en vivo).

---

## 🟥 LO QUE TENGO QUE PEDIRLES (falta de su lado)

### ⭐ Lo imprescindible (sin esto no arrancamos)
1. La **dirección de conexión** (URL `wss://`) — para prueba y para producción.
2. **Cómo se autentica nuestra app** al conectarse (qué credencial usamos, cómo la obtenemos, cada cuánto se renueva).
3. El **formato de los mensajes**: qué manda la app y qué recibe (los "schemas").
4. **Cómo le avisan a la app cuando cambia el estado del pedido** (asignan proveedor, presupuesto listo, pago registrado, completado). Hoy en su doc esto figura como "pendiente". → *Propuesta: usar la misma línea WebSocket para esos avisos.*

### Conexión
- ¿Es WebSocket nativo o Socket.IO?
- ¿Hay entorno de prueba (sandbox)?

### Chat con el bot
- Cómo se sube la **foto** del problema durante la conversación.
- La **ubicación** y la **urgencia**: ¿campos aparte o texto libre?

### Identidad de usuario
- ¿Quién crea el identificador del usuario (`uid`)? ¿Cómo conecto mi usuario con el de ellos?
- ¿Cómo se sabe el "workspace" (`wid`) de cada usuario?

### Pedidos y datos
- Confirmar que los pedidos/presupuestos/pagos viven en SU base (Firebase) y son la fuente de verdad.
- ¿Hay forma de que mi app **consulte** el estado de un pedido cuando quiera?
- Si la app pierde internet y vuelve, ¿cómo recupera la conversación y el estado?

### Pagos
- ¿El cobro será siempre por fuera (efectivo/transfer/MP manual), o planean pago dentro de la app?
- El payout al proveedor (que tienen "a definir"): ¿nos afecta o es interno de ustedes?

---

## 🟦 LO QUE ELLOS ME VAN A PEDIR / DECISIONES QUE LLEVO

1. **¿Quién es "la app"?** En su doc la fase 1 figura como "✅ funciona". Preguntar: *¿hay ya una app hecha por ustedes, o nuestra app (BRAPP) es la que se conecta?*
2. **El proveedor.** Ellos dicen "el proveedor no es actor del sistema" (le avisan por WhatsApp). Nuestra app tiene un panel de proveedor completo. → Mencionarlo y decidir si lo descartamos o lo integramos más adelante. *(Se puede definir después).*
3. **Datos del cliente:** confirmar qué datos esperan que mande nuestra app para crear el pedido (nombre, dirección, etc.).
4. **Pago dentro de la app:** avisar si lo queremos a futuro (eso requiere que ellos abran cosas de su lado).

---

## 🤝 ANTES DE CORTAR — acordar
- Quién manda qué y **para cuándo** (URL, credenciales, formato de mensajes).
- Si tienen documento técnico de los "schemas" o lo arman.
- Próxima fecha de seguimiento.

---

### 🆘 Comodín para cualquier término técnico
Si dicen algo que no entendés, preguntá:
**"¿Eso es de mi lado o del suyo? ¿Y para cuándo lo tienen?"**
