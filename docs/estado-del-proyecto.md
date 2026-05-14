# Botón Rojo — Estado del Proyecto

> Documento técnico completo. Describe todo lo implementado y funcional a la fecha.

---

## Índice

1. [Identidad y stack tecnológico](#1-identidad-y-stack-tecnológico)
2. [Espacio de trabajo (infraestructura)](#2-espacio-de-trabajo-infraestructura)
3. [Base de datos](#3-base-de-datos)
4. [Arquitectura del proyecto](#4-arquitectura-del-proyecto)
5. [Diseño y estilos](#5-diseño-y-estilos)
6. [Autenticación y roles](#6-autenticación-y-roles)
7. [Páginas públicas (landing, login, registro)](#7-páginas-públicas)
8. [Panel del Cliente](#8-panel-del-cliente)
9. [Panel del Proveedor](#9-panel-del-proveedor)
10. [Panel de Administración](#10-panel-de-administración)
11. [Stories (Instagram-style)](#11-stories)
12. [Publicidades / Ads](#12-publicidades--ads)
13. [Chat en tiempo real](#13-chat-en-tiempo-real)
14. [Componentes UI reutilizables](#14-componentes-ui-reutilizables)
15. [API Routes y Server Actions](#15-api-routes-y-server-actions)
16. [Pendiente / Próximos pasos](#16-pendiente--próximos-pasos)
17. [App Nativa (React Native) - Plan de Acción](#17-app-nativa-react-native---plan-de-acción)

---

## 1. Identidad y stack tecnológico

| Propiedad | Detalle |
|-----------|---------|
| **Nombre** | Botón Rojo |
| **Slogan** | Conectando vecinos con proveedores de servicios del hogar |
| **Copyright** | © 2026 Botón Rojo - Todos los derechos reservados |

### Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework frontend | Next.js (App Router) | 16.2.1 |
| UI library | React | 19.2.4 |
| Lenguaje | TypeScript | — |
| Estilos | Tailwind CSS | 3.4.1 |
| Backend / Auth / DB | Supabase | — |
| Base de datos | PostgreSQL (vía Supabase) | — |
| Gráficos | Recharts | 3.8.1 |
| Recorte de imágenes | react-easy-crop | — |
| Pagos | MercadoPago | (pendiente integración) |

---

## 2. Espacio de trabajo (infraestructura)

### Supabase

El proyecto utiliza **Supabase** como backend completo:

- **Auth**: manejo de sesiones, registro/login con email y contraseña, trigger automático que crea el perfil al registrarse.
- **Base de datos**: PostgreSQL con Row Level Security (RLS) en todas las tablas.
- **Storage**: dos buckets públicos creados y operativos:
  - `advertisements` — imágenes de publicidades
  - `stories` — imágenes de stories
- **Realtime**: activado en la tabla `messages` para el chat en tiempo real.
- **RPC Functions**: función `increment_ad_clicks(ad_id)` para trackeo de clics en publicidades.

### Clientes Supabase (3 instancias)

| Archivo | Uso |
|---------|-----|
| `lib/supabaseClient.ts` | Componentes client-side (browser) |
| `lib/supabaseServer.ts` | Server Components y Server Actions |
| `lib/supabaseAdmin.ts` | Operaciones admin que bypasan RLS |

### Middleware de rutas

`middleware.ts` protege todas las rutas automáticamente:

- `/dashboard/**` → redirige a `/login` si no hay sesión activa
- `/login`, `/register` → redirige a `/dashboard` si ya hay sesión

---

## 3. Base de datos

La base de datos está definida en `database/schema.sql` + 14 migraciones (`migration_003.sql` a `migration_016.sql`).

### Tablas

#### `profiles`
Extiende la tabla de usuarios de Supabase Auth.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | FK a auth.users |
| email | text | Correo del usuario |
| full_name | text | Nombre completo |
| role | enum | `user` / `provider` / `admin` |
| avatar_url | text | URL de foto de perfil |
| phone | text | Teléfono |
| date_of_birth | date | Fecha de nacimiento |
| dni | text | DNI |
| cuit | text | CUIT (para proveedores) |
| business_name | text | Nombre comercial |
| city | text | Ciudad |
| address | text | Dirección |
| floor_apt | text | Piso/depto |
| lot | text | Lote |
| created_at / updated_at | timestamp | — |

#### `service_categories`
Categorías de servicios disponibles en la plataforma.

| Campo | Descripción |
|-------|-------------|
| id | UUID |
| name | Nombre único (Albañil, Cerrajero, Cocinero, Electricista) |
| icon_url | Ícono SVG |
| active | Si está visible en el app |

**4 categorías pre-cargadas**: Albañil, Cerrajero, Cocinero, Electricista.

#### `provider_categories`
Relación M2M entre proveedores y las categorías en que operan.

| Campo | Descripción |
|-------|-------------|
| provider_id | FK a profiles |
| category_id | FK a service_categories |
| professional_description | Descripción profesional |
| visit_price | Precio de visita (mínimo $30.000 ARS) |
| labor_warranty | Garantía (30/60/90/180 días, 1 año) |
| years_experience | Experiencia (1 año / 1-3 / 3-5 / 5-10 / +10 años) |

#### `bookings`
Solicitudes de servicio generadas por clientes.

| Campo | Descripción |
|-------|-------------|
| id | UUID |
| user_id | FK a profiles (cliente) |
| service_id | FK a services |
| provider_id | FK a profiles (proveedor asignado) |
| status | `pending` / `confirmed` / `completed` / `cancelled` |
| date | Fecha pactada |
| notes | Descripción del problema |
| image_url | Foto del problema |
| scheduled_date | `today` / `coordinate` |
| payment_method | `coordinate` / `prepaid` |
| address | Domicilio del servicio |
| created_at / updated_at | — |

#### `messages`
Mensajes del chat. **Realtime habilitado.**

| Campo | Descripción |
|-------|-------------|
| sender_id | FK a profiles |
| receiver_id | FK a profiles |
| content | Texto del mensaje |
| read | Booleano de lectura |

#### `advertisements`
Publicidades gestionadas por el admin.

| Campo | Descripción |
|-------|-------------|
| title | Título |
| image_url | Imagen en Storage |
| link_url | URL de destino (opcional) |
| target | `client` / `provider` |
| sort_order | Orden en el carrusel |
| active | Si está visible |
| start_date / end_date | Rango de fechas de publicación |

#### `stories`
Stories al estilo Instagram, gestionadas por el admin.

| Campo | Descripción |
|-------|-------------|
| title | Título |
| image_url | Imagen en Storage |
| link_url | URL de destino (opcional) |
| sort_order | Orden de aparición |
| created_by | FK a profiles (admin) |

#### `story_views`
Registro de qué usuario vio qué story (para marcar como vistas).

### Índices optimizados

- `provider_categories(provider_id, category_id)`
- `services(user_id)`
- `bookings(user_id)`, `bookings(provider_id)`
- `messages(sender_id, receiver_id, created_at DESC)`
- `advertisements(sort_order)`

### Constantes de negocio (`lib/bookingConstants.ts`)

- `ACTIVE_STATUSES`: `['searching', 'pending', 'confirmed']`
- `STATUS_LABEL`: mapeo de estados a etiquetas en español
- `DATE_LABEL`: mapeo de `today`/`coordinate`
- `ROADMAP_STEPS`: 4 pasos del proceso (Buscando → Pendiente → Confirmado → Completado)

---

## 4. Arquitectura del proyecto

```
BRAPP/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── actions/            # Server Actions
│   │   └── bookings.ts
│   ├── admin/              # Panel administrador
│   ├── api/                # API Routes
│   │   ├── admin/
│   │   └── ads/
│   ├── dashboard/          # Dashboard autenticado
│   │   ├── client/         # Panel cliente
│   │   └── provider/       # Panel proveedor
│   ├── layout.tsx          # Layout raíz
│   ├── page.tsx            # Landing page
│   └── globals.css
├── components/
│   ├── admin/              # Componentes del admin
│   ├── dashboard/          # Componentes del dashboard
│   │   ├── client/
│   │   ├── provider/
│   │   └── stories/
│   ├── layout/             # Header público, MobileViewport
│   └── ui/                 # Componentes UI base
├── database/               # SQL: schema + 16 migraciones
├── hooks/                  # useUser.ts
├── lib/                    # Clientes Supabase + constantes
├── services/               # auth.ts, payments.ts
├── types/                  # index.ts (interfaces TypeScript)
├── public/
│   ├── logo.svg
│   ├── icons/              # 12 íconos SVG
│   └── services/           # 4 íconos de categorías
└── middleware.ts
```

---

## 5. Diseño y estilos

### Variables CSS globales (`globals.css`)

```css
--primary-red:  #E60611   /* Rojo principal */
--bg-body:      #F3F3F3   /* Fondo general */
--bg-cards:     #ffffff   /* Fondo de tarjetas */
--text-dark:    #020205   /* Texto principal */
--text-muted:   #6c757d   /* Texto secundario */
```

### Tipografía
- **Fuente**: Comfortaa (Google Fonts), aplicada globalmente.

### Principios de diseño
- **Mobile-first**: diseñado como app nativa móvil, adaptable a desktop.
- **Ancho máximo de viewport**: 430px (con `MobileViewport` wrapper).
- **Formularios simples**: `max-w-sm` / `max-w-md`, centrados con `mx-auto`.
- Animaciones: `fade-in` (300ms), `scale-in` (400ms).
- Sombras y bordes redondeados (`xl`, `2xl`, `3xl`, `4xl`).

### Íconos ilustrativos (`/public/icons/`)

| Archivo | Uso |
|---------|-----|
| `boton-happy.svg` | Pantallas de éxito |
| `DUDA.svg` / `DUDA-2.svg` | Selección de tipo de usuario |
| `CLIENTE.svg` | Registro cliente |
| `PROVEEDOR.svg` | Registro proveedor |
| `ENCONTRADO.svg` / `ENCONTRADO-2.svg` | Paso del formulario de registro |
| `proveedor-creado.svg` | Éxito registro proveedor |
| `check.svg` | Confirmaciones |
| `index-icon.svg` | Landing page |
| `leer.svg` | — |
| `chat.svg` | Chat |

---

## 6. Autenticación y roles

### Roles

| Rol | Descripción |
|-----|-------------|
| `user` | Cliente (solicita servicios) |
| `provider` | Proveedor (ofrece servicios) |
| `admin` | Administrador (gestiona la plataforma) |

### Flujo de autenticación

1. El usuario se registra con email, contraseña y rol.
2. Supabase Auth crea el usuario en `auth.users`.
3. Un **trigger automático** (`handle_new_user`) lee los metadatos (`full_name`, `role`) y crea la fila en `profiles`.
4. El middleware detecta la sesión y redirige al dashboard correspondiente.

### Funciones (`services/auth.ts`)

- `login(email, password)` — `signInWithPassword`
- `register(email, password, fullName, role)` — `signUp` con metadatos
- `logout()` — `signOut`
- `getSession()` — `getUser`

---

## 7. Páginas públicas

### Landing (`/`)
- Pantalla de bienvenida con logo y slogan.
- Mensaje: *"Estás a un botón de solucionar tus problemas"*.
- Botones: **Iniciar sesión** / **Registrarse**.

### Login (`/login`)
- Formulario email + contraseña.
- Mensajes de error en línea.
- Link a registro.
- Redirige automáticamente si ya hay sesión.

### Registro (`/register`) — Flujo multi-step

**Paso 1 — Selección de rol:**
- Dos tarjetas lado a lado: CLIENTE / PROVEEDOR.
- Íconos `CLIENTE.svg` / `PROVEEDOR.svg` dentro de las tarjetas.
- Labels debajo de cada tarjeta.

**Flujo Cliente (3 pasos):**

| Paso | Contenido |
|------|-----------|
| 2 | Ícono `ENCONTRADO.png` + formulario: nombre, email, contraseña |
| 3 | Pantalla de éxito con `boton-happy.svg` + botón "Ingresar" → `/dashboard` |

**Flujo Proveedor (6 pasos):**

| Paso | Contenido |
|------|-----------|
| 1 | Email + contraseña |
| 2 | Nombre completo, fecha de nacimiento, ciudad, dirección, piso/depto, lote |
| 3 | Teléfono (con prefijo +54) |
| 4 | Selección de categorías de servicio (multi-select con búsqueda) |
| 5 | Términos y condiciones (debe hacer scroll para habilitar el botón) |
| Éxito | Pantalla con `proveedor-creado.svg` |

---

## 8. Panel del Cliente

### Navegación (bottom nav móvil)

| Tab | Ícono | Ruta |
|-----|-------|------|
| Inicio | Casa | `/dashboard/client` |
| Servicios | Grilla | `/dashboard/client/services` |
| Actividad | Calendario | `/dashboard/client/activity` |
| Perfil | Persona | `/dashboard/client/profile` |

La barra de navegación inferior es fija en todas las pantallas del dashboard del cliente.

---

### Home del cliente (`/dashboard/client`)

**Datos cargados al renderizar:**
- Perfil del usuario (para obtener el primer nombre).
- Último booking activo (`searching`, `pending` o `confirmed`).
- Cantidad de ofertas recibidas en ese booking.

**Contenido visible:**

1. **Saludo personalizado**: "Hola, [Nombre] 👋" con animación `fade-in`.
2. **Ad Slider**: carrusel de publicidades filtradas por target `client`.
3. **Tarjeta de servicio actual** (visible solo si hay un booking activo):
   - Nombre de la categoría.
   - Badge de estado con lógica contextual:
     - "En curso" (rojo) → status `confirmed`
     - "Esperando proveedor" (gris) → status `pending`
     - "Oferta recibida" (verde) → `searching` con ofertas
     - "Activa" (rojo) → `searching` sin ofertas
   - Texto descriptivo debajo del badge.
   - Fecha con ícono de calendario (si tiene `scheduled_date`).
   - La tarjeta entera es clickeable → lleva al detalle del booking.
4. **Roadmap de estado** (card con visual de pasos):
   - 4 pasos: Buscando → Pendiente → Confirmado → Completado.
   - Puntos y líneas en rojo para pasos completados/actuales, gris para los siguientes.
   - Ícono ilustrativo a la derecha que cambia según el estado:
     - `confirmed` → `check.svg`
     - Tiene ofertas → `ENCONTRADO-2.svg`
     - Sin ofertas → `DUDA-2.svg`
5. **Estado vacío**: si no hay booking activo, solo muestra el saludo y el carrusel de ads.

---

### Explorar servicios (`/dashboard/client/services`)

**Datos cargados al renderizar:**
- Categorías activas (ordenadas por nombre).
- Stories activas (no expiradas, ordenadas por `sort_order`).
- IDs de stories ya vistas por el usuario actual.

**Contenido visible:**

1. **Stories Row** (si hay stories disponibles):
   - Fila horizontal de historias tipo Instagram.
   - Anillo rojo si hay no vistas, gris si todas fueron vistas.
2. **Grilla de categorías** (`ServiceCategoryGrid`):
   - Grid de tarjetas con ícono SVG y nombre de cada categoría.
   - Solo muestra categorías activas.
   - Al tocar una categoría → va a `/dashboard/client/services/[categoryId]`.

---

### Solicitar servicio (`/dashboard/client/services/[categoryId]`)

**Datos cargados al renderizar:**
- Datos de la categoría (nombre).
- Dirección del perfil del usuario (para pre-completar el campo).

**Contenido visible:**

- Título con el nombre de la categoría.
- **Formulario de solicitud** (`BookingRequestForm`):
  - **Descripción** del problema (textarea, obligatorio).
  - **Foto del problema** (upload de imagen a Supabase Storage, opcional).
  - **Cuándo** (selector): "Hoy" / "A coordinar".
  - **Método de pago** (selector): "A coordinar" / "Prepago".
  - **Dirección** (texto, pre-completado con la dirección del perfil si existe).
  - Botón "Solicitar servicio" con estado de carga.
  - Al crear el booking, redirige a `/dashboard/client/bookings/[id]?new=1`.

---

### Detalle del booking (`/dashboard/client/bookings/[bookingId]`)

**Datos cargados al renderizar:**
- Booking completo con categoría y perfil del proveedor asignado (si aplica).
- Todas las ofertas recibidas con perfil de cada proveedor.
- Para cada proveedor ofertante: `professional_description` y `visit_price` de `provider_categories`.
- Cantidad de trabajos completados del proveedor confirmado.

**Contenido visible:**

1. **Banner de confirmación** (solo en `?new=1` al crear):
   - Ícono `boton-happy.svg` grande con animación.
   - Texto: "¡Solicitud generada! Ya estamos buscando proveedores para vos."

2. **Card resumen del booking**:
   - Nombre de la categoría + badge de estado contextual.
   - Dirección del servicio con ícono de mapa.
   - Descripción del problema.
   - Fecha programada.

3. **Foto del problema** (si existe):
   - Imagen expandible en lightbox (`BookingImageModal`).

4. **Botones de acción** (solo si no está confirmado):
   - "Editar" (borde rojo, outline).
   - "Cancelar" (rojo).

5. **Card de estado / Roadmap**:
   - Misma lógica visual que el home: 4 pasos con puntos/líneas.
   - Ícono ilustrativo según estado.

6. **Sección "Proveedor"** (si status = `confirmed`):
   - Avatar o iniciales del proveedor (en círculo rojo).
   - Nombre completo.
   - Cantidad de trabajos completados.
   - Ciudad.
   - Botón verde **"Abrir chat"** → `/dashboard/client/chat/[bookingId]`.

7. **Sección "Ofertas"** (si status ≠ `confirmed`):
   - Si no hay ofertas: ícono reloj + "Sin ofertas todavía".
   - Por cada oferta:
     - Avatar o iniciales del proveedor.
     - Nombre del proveedor.
     - Descripción profesional del proveedor para esa categoría.
     - Precio de la oferta (en rojo).
     - Precio de visita del proveedor (en gris).
     - Botón **"Aceptar oferta"** (`AcceptOfferButton`) — visible solo si la oferta está `pending` y el booking en `searching`.
     - Mensaje "Esperando confirmación del proveedor" si el booking ya está en `pending`.

---

### Actividad del cliente (`/dashboard/client/activity`)

**Datos cargados al renderizar:**
- Todos los bookings del usuario (ordenados por fecha descendente).
- Cantidad de ofertas por booking.

**Contenido visible:**

**Filtros tipo pill/tabs** (`BookingList`):
- **Todas** | **Activas** | **Completadas**
- Tabs con fondo rojo cuando están activos.

**Lista de bookings** (cada item es una card clickeable):
- Nombre de la categoría.
- Badge de estado contextual (igual lógica que el home):
  - "En curso" / "Esperando proveedor" / "Oferta recibida" / "Activa" / "Completada".
- Texto secundario descriptivo del estado.
- Fecha programada con ícono de calendario.
- Al tocar → va al detalle del booking.

**Estado vacío**: mensaje "No hay solicitudes." si no hay resultados.

---

### Perfil del cliente (`/dashboard/client/profile`)

**Datos cargados al renderizar:**
- Perfil: nombre, ciudad, avatar, fecha de creación.
- Cantidad total de bookings (como métrica "Conexiones").

**Contenido visible:**

1. **Card de perfil** (clickeable → va a editar):
   - Avatar circular (foto o ícono genérico si no tiene).
   - Nombre completo.
   - Ciudad.
   - Flecha →.

2. **Sección "Estadísticas"** (grid de 3 columnas):
   - **Miembro desde**: año de creación de la cuenta.
   - **Conexiones**: cantidad total de bookings generados.
   - **Plan actual**: "Gratuito".

3. **Sección "Configuración"** (`ProfileSettings`):
   Menú de opciones con íconos SVG:
   - Documentación obligatoria
   - Actividad y solicitudes pasadas
   - Privacidad y seguridad
   - Medios de pago
   - Información legal
   - Soporte técnico
   - **Cerrar sesión** (en rojo, llama a `supabase.auth.signOut()` y redirige a `/login`).

---

### Editar perfil del cliente (`/dashboard/client/profile/edit`)

**Datos cargados al renderizar:**
- Perfil completo del usuario.

**Contenido visible:**

1. **Upload de avatar** (`AvatarUpload`):
   - Foto de perfil con opción de recorte circular (react-easy-crop).
   - Sube la imagen a Supabase Storage.
   - Actualiza `avatar_url` en `profiles`.

2. **Formulario de perfil** (`ClientProfileForm`):
   Campos editables:
   - Nombre completo
   - Teléfono
   - Fecha de nacimiento
   - Ciudad
   - Dirección
   - Piso/depto
   - Lote
   - Botón "Guardar cambios" con estado de carga y feedback de éxito/error.

---

### Chat cliente-proveedor (`/dashboard/client/chat/[bookingId]`)

**Datos cargados al renderizar:**
- Booking verificado (el usuario debe ser el cliente del booking).
- Perfil del proveedor (nombre, avatar).
- Historial completo de mensajes del chat ordenados por fecha.

**Contenido visible** (`ChatWindow`):

1. **Header del chat**:
   - Botón "← volver" al detalle del booking.
   - Avatar del proveedor (o iniciales en círculo rojo).
   - Nombre del proveedor.
   - Nombre de la categoría.

2. **Área de mensajes**:
   - Mensajes propios alineados a la derecha (burbuja roja).
   - Mensajes del otro usuario a la izquierda (burbuja blanca).
   - Hora de cada mensaje (renderizada solo en cliente para evitar errores de hidratación).
   - Estado vacío: "Iniciá la conversación" si no hay mensajes.
   - Auto-scroll al último mensaje.

3. **Input de mensaje**:
   - Campo de texto con placeholder "Escribí un mensaje...".
   - Botón enviar (flecha, se activa en rojo cuando hay texto).
   - Envío con Enter o click en el botón.
   - Deshabilitado mientras envía.

4. **Tiempo real** (Supabase Realtime):
   - Subscripción al canal `chat:[bookingId]`.
   - Los mensajes nuevos aparecen instantáneamente sin recargar.
   - Previene mensajes duplicados.
   - Se desuscribe al desmontar el componente.

---

## 9. Panel del Proveedor

### Navegación (bottom nav móvil)

| Tab | Ícono | Ruta |
|-----|-------|------|
| Inicio | Casa | `/dashboard/provider` |
| Solicitudes | Bandeja | `/dashboard/provider/requests` |
| Actividad | Calendario | `/dashboard/provider/activity` |
| Perfil | Persona | `/dashboard/provider/profile` |

La barra de navegación inferior es fija en todas las pantallas del dashboard del proveedor.

---

### Home del proveedor (`/dashboard/provider`)

**Datos cargados al renderizar:**
- Perfil del proveedor (primer nombre).
- Último booking en estado `pending` (esperando confirmación del proveedor).
- Último booking `confirmed` asignado al proveedor.
- Cantidad de trabajos completados del cliente del booking confirmado.

**Contenido visible:**

1. **Saludo personalizado**: "Hola, [Nombre] 👋".
2. **Ad Slider**: carrusel de publicidades filtradas por target `provider`.
3. **Banner promocional**:
   - Texto: "¡Muchas solicitudes! Hay más solicitudes de lo habitual. ¡Aprovéchalas!"
   - Ícono ilustrativo `proveedor-creado.svg` alineado a la derecha.
4. **"Pendiente de tu confirmación"** (visible si hay un booking `pending` para el proveedor):
   - Nombre de la categoría + badge "Confirmar" (verde).
   - Nombre del cliente.
   - Fecha programada con ícono de calendario.
   - Toda la tarjeta es clickeable → va al detalle de la solicitud.
5. **"Trabajo en curso"** (visible si hay un booking `confirmed` asignado):
   - Avatar o iniciales del cliente.
   - Nombre del cliente + cantidad de trabajos completados.
   - Badge "En curso" (rojo).
   - Nombre de la categoría + ciudad del cliente.
   - Toda la tarjeta es clickeable → va al detalle de actividad.
6. **Estado vacío** (si no hay pendiente ni confirmado):
   - Ícono `DUDA-2.svg`.
   - "Sin actividad por ahora" + descripción.
   - Botón rojo "Ver solicitudes" → `/dashboard/provider/requests`.

---

### Solicitudes (`/dashboard/provider/requests`)

**Datos cargados al renderizar:**
- Categorías del proveedor (las que tiene configuradas en `provider_categories`).
- Si no tiene categorías: pantalla de estado vacío con link al perfil.
- Bookings en estado `searching` cuya categoría coincide con alguna del proveedor.
- Bookings en estado `pending` donde el proveedor ya envió oferta y fue aceptada por el cliente.
- Cantidad de trabajos completados por cada cliente.
- IDs de bookings donde el proveedor ya envió oferta (`alreadyOffered`).

**Contenido visible:**

1. **Banner promo** (igual al del home).

2. **Sección "Pendiente de tu confirmación"** (si hay bookings aceptados esperando confirmación):
   - Lista de cards clickeables con nombre del cliente, categoría y badge "Confirmar" (verde).

3. **Filtros interactivos** (`ProviderRequestsList`):
   - **Filtro por fecha** (pills tipo radio): Todas / Hoy / A coordinar.
   - **Filtro por categoría** (select dropdown, visible solo si el proveedor opera en más de 1 categoría):
     - Opción "Todos los servicios" + una opción por cada categoría.
   - Los filtros se combinan: se pueden usar fecha y categoría al mismo tiempo.
   - Estado vacío filtrado: "No hay solicitudes que coincidan con los filtros seleccionados."

4. **Lista de solicitudes** (cada item es un `RequestCard` clickeable):
   - Avatar o iniciales del cliente en círculo rojo.
   - Nombre del cliente.
   - Cantidad de trabajos completados del cliente ("Sin conexiones" o "N trabajos completados").
   - Badge "Oferta enviada" (verde) o "Nueva" (rojo).
   - Descripción breve del problema (truncada a 2 líneas).
   - Fecha: "Hoy" (en rojo con ícono de reloj) o "A coordinar".
   - Ciudad del cliente con ícono de pin.
   - Click → va a `/dashboard/provider/requests/[bookingId]`.

5. **Estado vacío** (si no hay solicitudes disponibles): ícono de bandeja + mensaje explicativo.

---

### Detalle de solicitud (`/dashboard/provider/requests/[bookingId]`)

**Datos cargados al renderizar:**
- Booking con categoría y perfil del cliente (solo `searching` o `pending`).
- Oferta existente del proveedor para ese booking (si ya envió una).
- Verificación de seguridad: el proveedor debe operar en la categoría del booking (`provider_categories`).
- Cantidad de trabajos completados del cliente.

**Contenido visible:**

1. **Badge de categoría** (pill gris con el nombre).

2. **Card del cliente**:
   - Avatar o iniciales del cliente.
   - Nombre completo.
   - Cantidad de trabajos completados.
   - Badge "Oferta enviada" (verde) o "Nueva" (rojo).
   - Descripción del problema.
   - Indicador de fecha: "Hoy" en rojo si es urgente, "A coordinar" si no.
   - Ciudad del cliente.

3. **Foto del problema** (si existe):
   - Imagen a ratio 16:9.

4. **Sección de oferta**:
   - Título: "Tu oferta" si ya existe, "Enviar oferta" si no.

   **Si no hay oferta previa** → muestra el formulario (`OfferForm`):
   - Campo de precio (número, con `$` como prefijo, opcional).
   - Botón rojo "Enviar oferta" con estado de carga.
   - Toast de éxito/error al enviar.
   - Al enviar, inserta en `booking_offers` con `status = 'pending'`.

   **Si ya envió oferta** → muestra el estado de la oferta:
   - Badge de estado: "Enviada — esperando respuesta" / "Aceptada" / "Rechazada".
   - Precio ofertado.
   - Si la oferta fue **aceptada** por el cliente → aparecen dos botones:
     - **"Rechazar"** (outline rojo): llama a `rejectOffer()` → booking vuelve a `searching`.
     - **"Confirmar"** (verde): llama a `confirmOffer()` → booking pasa a `confirmed`, otras ofertas se rechazan automáticamente. Redirige a `/dashboard/provider/activity/[bookingId]`.

---

### Actividad del proveedor (`/dashboard/provider/activity`)

**Datos cargados al renderizar:**
- Bookings donde el proveedor está asignado con estado `confirmed`, `completed` o `cancelled`.
- Bookings `pending` donde el proveedor tiene oferta aceptada (pendientes de confirmar).
- Cantidad de trabajos completados por cada cliente.

**Contenido visible** (`ProviderActivityList`):

- Lista unificada ordenada: primero los pendientes de confirmación, luego el resto.
- Cada item muestra:
  - Avatar o iniciales del cliente.
  - Nombre del cliente.
  - Cantidad de trabajos completados.
  - Categoría del servicio.
  - Ciudad del cliente.
  - Badge de estado:
    - "Confirmar" (verde) → `pending_confirmation`
    - "En curso" (rojo) → `confirmed`
    - "Completado" (gris) → `completed`
    - "Cancelado" (gris) → `cancelled`
- Click en cada item → va a `/dashboard/provider/activity/[bookingId]`.
- Estado vacío si no hay actividad.

---

### Detalle de trabajo (`/dashboard/provider/activity/[bookingId]`)

**Datos cargados al renderizar:**
- Booking completo con categoría y perfil del cliente (nombre, email, teléfono, avatar, ciudad).
- Verificación: el proveedor debe ser el asignado al booking.
- Cantidad de trabajos completados del cliente.

**Contenido visible:**

1. **Card resumen del booking**:
   - Categoría + badge de estado ("En curso" / "Completado" / "Cancelado").
   - Nombre del cliente.
   - Dirección del servicio.
   - Descripción del problema.
   - Fecha programada.

2. **Foto del problema** (si existe) — expandible con `BookingImageModal`.

3. **Roadmap de estado**:
   - Misma visualización de 4 pasos con puntos/líneas.
   - Ícono ilustrativo: `check.svg` si confirmado, `ENCONTRADO-2.svg` en otros casos.

4. **Sección "Contacto"**:
   - Avatar o iniciales del cliente.
   - Nombre completo.
   - Cantidad de trabajos completados.
   - Ciudad.
   - Botón verde **"Abrir chat"** → `/dashboard/provider/chat/[bookingId]`.

---

### Chat proveedor-cliente (`/dashboard/provider/chat/[bookingId]`)

Mismo componente `ChatWindow` que el del cliente. Mismas funcionalidades:
- Header con datos del cliente.
- Mensajes en tiempo real vía Supabase Realtime.
- Burbujas propias (rojo) y del otro usuario (blanco).
- Envío con Enter o botón.
- Auto-scroll al último mensaje.
- Botón "← volver" al detalle del trabajo.

---

### Perfil del proveedor (`/dashboard/provider/profile`)

**Datos cargados al renderizar:**
- Perfil completo (10 campos evaluados para el porcentaje de completitud).
- Categorías configuradas con sus íconos.

**Contenido visible:**

1. **Indicador de completitud del perfil** (`ProfileCompletionCard`):
   - Barra de progreso visual.
   - Porcentaje calculado sobre 10 campos: nombre, teléfono, fecha de nacimiento, DNI, CUIT, nombre comercial, ciudad, dirección, piso/depto, lote.

2. **Acceso rápido a Configuración** (`MenuCard` con ícono de engranaje).

3. **Tabs segmentados** (control visual tipo pill):
   - **"Mis servicios"** (activo por defecto):
     - Grid de 2 columnas con cada categoría configurada.
     - Cada card muestra ícono + nombre de la categoría.
     - Click → va a `/dashboard/provider/services/[categoryId]` para configurar.
     - Estado vacío: "Todavía no tenés servicios configurados."
   - **"Mi perfil"**:
     - Upload de avatar con recorte circular (`AvatarUpload`).
     - Formulario completo (`ProfileForm`) con campos:
       - Nombre completo, teléfono, fecha de nacimiento
       - DNI, CUIT, nombre comercial
       - Ciudad, dirección, piso/depto, lote
       - Botón "Guardar cambios" con feedback.

---

### Configurar servicio por categoría (`/dashboard/provider/services/[categoryId]`)

**Datos cargados al renderizar:**
- Datos actuales de `provider_categories` para esa categoría.
- Nombre e ícono de la categoría.

**Contenido visible:**

- Header con botón "← volver" + ícono y nombre de la categoría.
- Formulario (`ServiceConfigForm`) dentro de una card:
  - **Descripción profesional** (textarea): qué hace el proveedor en esa categoría.
  - **Precio de visita** (número, mínimo $30.000 ARS).
  - **Garantía de mano de obra** (select): 30 días / 60 días / 90 días / 180 días / 1 año.
  - **Años de experiencia** (select): 1 año / 1 a 3 años / 3 a 5 años / 5 a 10 años / Más de 10 años.
  - Botón "Guardar" con estado de carga y toast de confirmación.

---

### Configuración del proveedor (`/dashboard/provider/settings`)

**Contenido visible:**

Menú de opciones con íconos SVG (`MenuCard`):
- Documentación obligatoria
- Privacidad y seguridad
- Medios de pago
- Información legal
- Soporte técnico
- **Cerrar sesión** (en rojo, llama a `supabase.auth.signOut()` y redirige a `/login`).

---

## 10. Panel de Administración

> Accesible desde `/admin`. Solo para usuarios con `role = 'admin'`.

### Sidebar de navegación (`AdminSidebar`)

7 secciones con íconos:
1. Inicio
2. Usuarios
3. Bookings
4. Categorías
5. Estadísticas
6. Publicidades
7. Stories

### Dashboard admin (`/admin`)

- 6 tarjetas de métricas:
  - Total clientes
  - Total proveedores
  - Total bookings
  - Bookings pendientes
  - Bookings completados
  - Bookings cancelados
- Accesos rápidos a Usuarios, Bookings y Categorías.

### Gestión de usuarios (`/admin/users`)

- Listado completo de usuarios.
- Filtros por rol: todos / clientes / proveedores / admins.
- Botón **"Cambiar rol"** por usuario (modal de confirmación).
- Vista detalle por usuario (`/admin/users/[id]`).

### Gestión de bookings (`/admin/bookings`)

- Listado completo de todos los bookings.
- Filtros por estado.
- Vista detalle por booking (`/admin/bookings/[id]`).

### Gestión de categorías (`/admin/categories`)

- Lista de todas las categorías.
- Toggle activo/inactivo por categoría.
- Formulario para **agregar nueva categoría** (nombre + ícono).

### Estadísticas (`/admin/stats`)

4 gráficos con Recharts:

| Gráfico | Tipo |
|---------|------|
| Bookings por mes | Área / Línea |
| Bookings por categoría | Barras |
| Bookings por estado | Torta |
| Usuarios registrados por mes | Línea |

### Gestión de publicidades (`/admin/advertisements`)

- Listado de publicidades activas e inactivas.
- **Crear / editar** publicidad (`AdForm` modal):
  - Subida de imagen (preview en tiempo real, dashed border)
  - Título (requerido)
  - Target: `cliente` o `proveedor`
  - Orden en el carrusel
  - Fecha de inicio y fin (opcional)
  - URL de destino (opcional)
  - Toggle activo/inactivo
- **Eliminar** publicidad (con confirmación).
- **Lightbox** para ver imagen en tamaño completo.
- Gráfico de performance de cada ad (`AdStatsChart`).

### Gestión de stories (`/admin/stories`)

- Listado de stories publicadas.
- **Crear story** (`StoryForm` modal):
  - Subida de imagen (recomendado 9:16)
  - Título (requerido)
  - URL de destino (opcional)
  - Orden de aparición
- Upload a bucket `stories` de Supabase Storage.

---

## 11. Stories

Sistema de stories al estilo Instagram implementado de forma completa.

### Componentes

#### `StoriesRow` (fila horizontal de stories)

- Muestra los avatares/miniaturas de las stories disponibles.
- **Anillo rojo degradado** = hay stories no vistas.
- **Anillo gris** = todas las stories ya fueron vistas.
- Al hacer click: abre el visor.
- Registra las vistas en la tabla `story_views`.

#### `StoriesViewer` (visor a pantalla completa)

- Ancho máximo 430px, fondo oscuro.
- **Barra de progreso** en la parte superior (una por story).
- Auto-avance cada **5 segundos**.
- Botón de pausa/reproducción.
- Botón de cierre.
- **Zonas táctiles**:
  - Tap izquierdo → story anterior
  - Tap centro → pausar/reanudar
  - Tap derecho → story siguiente
- **Teclado**: Escape (cerrar), ← → (navegar).
- Botón **"Ver más"** en la parte inferior si la story tiene link.
- Contador: "2 / 5", tiempo transcurrido desde creación.

---

## 12. Publicidades / Ads

### Funcionamiento

- Las publicidades se muestran en un **carrusel (`AdSlider`)** dentro del home del cliente y del proveedor.
- Cada publicidad puede ser segmentada: visible solo para clientes, solo para proveedores, o ambos.
- Si tiene `link_url`, al hacer click redirige a la URL destino.
- El sistema registra **impresiones** y **clics** para analytics.

### Tracking (`/api/ads/`)

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/ads/impression` | Registra una impresión del ad |
| `POST /api/ads/click` | Registra un clic — llama a RPC `increment_ad_clicks` |

---

## 13. Chat en tiempo real

### Tecnología
- **Supabase Realtime** sobre la tabla `messages`.
- Subscripción automática a nuevos mensajes entre los participantes del booking.

### Componente `ChatWindow`

- Muestra el historial de mensajes.
- Indicador de mensaje leído/no leído.
- Envío de nuevos mensajes.
- Actualización en tiempo real (sin recargar la página).

### Rutas de chat

| Ruta | Acceso |
|------|--------|
| `/dashboard/client/chat/[bookingId]` | Cliente ↔ Proveedor |
| `/dashboard/provider/chat/[bookingId]` | Proveedor ↔ Cliente |

### Chat de soporte (`SupportChatDrawer`)
- Drawer lateral accesible desde cualquier pantalla del dashboard.
- Botón flotante en esquina inferior.

---

## 14. Componentes UI reutilizables

Ubicados en `components/ui/`:

| Componente | Descripción |
|-----------|-------------|
| `Button` | Variantes: `primary` / `secondary` / `ghost`. Prop `loading` para spinner. |
| `Input` | Con label y mensaje de error integrado. |
| `Select` | Dropdown estilizado. |
| `Textarea` | Área de texto con label. |
| `Card` | Contenedor con fondo blanco, border-radius, sombra suave. |
| `Modal` | Cierre con Escape y click en backdrop. |
| `MenuCard` | Tarjeta de opción de menú. |
| `BackButton` | Botón de navegación hacia atrás. |
| `ToastProvider` | Sistema de notificaciones tipo toast. |

---

## 15. API Routes y Server Actions

### API Routes (`app/api/`)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/admin/categories/create` | POST | Crea una nueva categoría de servicio |
| `/api/admin/categories/toggle` | POST | Activa o desactiva una categoría |
| `/api/admin/users/role` | POST | Cambia el rol de un usuario |
| `/api/ads/impression` | POST | Registra una impresión de publicidad |
| `/api/ads/click` | POST | Registra un clic en publicidad |

### Server Actions (`app/actions/bookings.ts`)

| Función | Descripción |
|---------|-------------|
| `acceptOffer(offerId, bookingId)` | Cliente acepta la oferta de un proveedor; actualiza estado del booking |
| `confirmOffer(offerId, bookingId, providerId)` | Proveedor confirma el trabajo; rechaza las demás ofertas automáticamente |
| `rejectOffer(offerId, bookingId)` | Proveedor rechaza la solicitud; booking vuelve a `searching` |

---

## 16. Pendiente / Próximos pasos

| # | Feature | Estado | Notas |
|---|---------|--------|-------|
| 1 | **Sistema de presupuestos** | Pendiente | Flujo de cotización formal antes de la orden: el proveedor genera un presupuesto detallado que el cliente aprueba o rechaza antes de confirmar el trabajo. |
| 2 | **Recontratar servicio o proveedor** | Pendiente | Desde la actividad del cliente, poder reutilizar un proveedor o categoría de un trabajo anterior para generar una nueva solicitud pre-completada. |
| 3 | **Integración API / CRM (MOP)** | Pendiente — en diseño | Ver arquitectura completa en `docs/arquitectura-crm-integration.md`. Resumen: |
| | | | • **CRM (MOP)** pushea eventos vía WebSocket al servidor intermediario. |
| | | | • **socket-server** en Railway (Node.js): conexión persistente, traduce y escribe en Supabase. |
| | | | • **Supabase Realtime** propaga los cambios al frontend automáticamente. |
| | | | • Se necesita: URL del WebSocket, protocolo, método de auth, schema de payloads. |
| | | | • DB requiere: `ALTER TABLE bookings ADD COLUMN internal_status`, `internal_notes`, `metadata`. |
| | | | • Estados internos del CRM (no visibles al usuario): `provider_viewed`, `en_route`, `awaiting_confirmation`, `payment_pending`, `payment_processing`, `payment_failed`, `disputed`, `dispute_resolved`. |
| 4 | **Subir todo a producción** | Pendiente | Deploy en Vercel (frontend + API routes) + Supabase Cloud (ya configurado). Requiere: variables de entorno de producción, dominio, desactivar modo dev de Supabase Auth. |
| 5 | **Integración MercadoPago** | Pendiente | `services/payments.ts` tiene los stubs listos. Falta instalar SDK, crear endpoint de preferencia y configurar webhook. |
| 6 | **Verificación de teléfono** | Pendiente | Campo visible en registro, lógica no implementada. |
| 7 | **Notificaciones push** | No iniciado | — |
| 8 | **Valoraciones / reviews** | No iniciado | — |
| 9 | **Geolocalización** | No iniciado | — |

---

*Última actualización: Mayo 2026*
---

## 17. App Nativa (React Native) - Plan de Acción

Este apartado detalla la estrategia para transformar la experiencia de **Botón Rojo** en una aplicación nativa real, optimizando la confiabilidad y el acceso a hardware.

### 17.1. ¿Por qué React Native + Expo?
Hemos decidido utilizar **React Native con Expo** porque nos permite mantener un solo código base para iOS y Android, con un rendimiento nativo y acceso simplificado a APIs críticas como el GPS y las notificaciones en segundo plano.

### 17.2. Funcionamiento y Características "Botón Rojo"
Una app nativa nos permite implementar funciones de seguridad que la web no alcanza:
-   **Alerta en Segundo Plano:** El usuario puede disparar la alerta aunque la app no esté abierta en pantalla.
-   **Uso de Botones Físicos:** Posibilidad de configurar disparadores mediante combinaciones de botones de volumen o encendido (especialmente en Android).
-   **Geolocalización Persistente:** Envío de la ubicación exacta en tiempo real durante la emergencia, incluso si el móvil entra en modo ahorro de batería.
-   **Notificaciones Críticas:** Alertas que ignoran el modo "No molestar" para casos de pánico confirmados.

### 17.3. Lo que vamos a Reutilizar (El "Avance")
No empezamos de cero. El 70% de la inteligencia del sistema ya está construida:
-   **Supabase (Backend):** Toda la base de datos de perfiles, categorías y el sistema de chat funciona exactamente igual.
-   **Lógica de TypeScript:** Los tipos de datos, validaciones y servicios de autenticación son 100% portables.
-   **Flujo de Negocio:** El proceso de "Solicitud -> Oferta -> Confirmación" ya está validado y solo requiere un cambio de "piel".
-   **Tokens de Diseño:** Usaremos **NativeWind** para aplicar los mismos colores y espaciados de Tailwind CSS en la app nativa.

### 17.4. Proceso de Desarrollo (Fases)
1.  **Fase 1 (Semana 1):** Configuración de Expo, migración de Auth/Supabase y desarrollo del núcleo del **Botón Rojo** (GPS y disparadores).
2.  **Fase 2 (Semana 2):** Migración de los paneles de Cliente/Proveedor (UI) y pruebas intensivas de confiabilidad antes del envío a tiendas.

### 17.5. Tiempos Estimados
*   **Desarrollo (MVP Funcional):** 2 semanas (gracias a la alta reutilización del código actual).
*   **Proceso de Revisión (Stores):**
    *   **Google Play:** 3-7 días (promedio).
    *   **App Store:** 7-15 días (según revisión actual).
*   **Total estimado:** ~4 semanas para estar en manos de los usuarios finales (incluyendo revisión).

> [!TIP]
> Al ser una aplicación de seguridad, el foco principal durante estas semanas será la **resiliencia**: asegurar que el mensaje de alerta llegue al servidor de Supabase pase lo que pase con la conexión del usuario.
