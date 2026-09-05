# Nexa Bug Tracker

Gestor de tickets de bugs para el equipo QA de Nexa Consulting TI. Pensado
para trackear issues de varias apps (Inventra y las que vengan después), con
roles: **Admin, QA, Developer, Backend, Frontend**.

No es un JIRA completo a propósito: solo tickets de bugs (sin epics, sprints
ni tableros Kanban de features). Eso mantiene el scope acotado a lo que pidió
el equipo QA.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security) — mismo backend que usa Inventra

## Modelo de datos

- `profiles` — un perfil por usuario, con su `role`. Se crea solo al registrarse (rol `qa` por defecto).
- `projects` — las apps que se trackean (Inventra, etc.). Un ticket siempre pertenece a un proyecto.
- `tickets` — los bugs: título, descripción, pasos para reproducir, entorno, severidad, prioridad, estado, reportero, asignado, equipo destino.
- `ticket_comments` — comentarios por ticket.
- `ticket_history` — auditoría simple de cambios de estado/asignado.

Los permisos están en Postgres vía Row Level Security (ver
`supabase/migrations/0001_init.sql`), no solo en la UI:

- Cualquier usuario autenticado puede leer todo y reportar tickets/comentarios.
- Solo el reportero, el asignado o un admin pueden cambiar estado/asignado de un ticket.
- Solo un admin puede crear/borrar apps (proyectos) o cambiar el rol de otro usuario.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito
alcanza para esta fase de pruebas). Copia la URL y la `anon key` desde
Project Settings → API.

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Aplicar el esquema

En el SQL Editor de tu proyecto de Supabase, pega y ejecuta en orden:

1. `supabase/migrations/0001_init.sql`
2. (Opcional) `supabase/seed.sql` — crea el proyecto "Inventra" de ejemplo.

### 4. Instalar dependencias y correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login`.

### 5. Crear el primer usuario admin

1. En `/login`, usa "Crear cuenta nueva" para registrar tu propio correo. Esto crea tu perfil con rol `qa`.
2. En el SQL Editor de Supabase, conviértete en admin:

   ```sql
   update profiles set role = 'admin' where email = 'tu-correo@nexa.com';
   ```

3. Vuelve a iniciar sesión. Ahora verás "Admin" en el menú lateral, desde donde puedes:
   - Agregar más apps en **Admin → Apps / Proyectos** (además de Inventra).
   - Asignar el rol correcto (QA, Developer, Backend, Frontend) a cada persona del equipo en **Admin → Usuarios**.

Del resto del equipo: cada quien crea su cuenta desde `/login` y tú les
asignas el rol desde `/admin/users`.

## Estructura de carpetas

```
app/
  login/                  Inicio de sesión y registro
  (app)/                  Rutas protegidas (requieren sesión) con sidebar
    dashboard/            Lista de tickets con filtros (app, estado, "asignados a mí")
    tickets/new/          Reportar un bug
    tickets/[id]/         Detalle: estado, asignación, comentarios
    admin/projects/       Alta/baja de apps (solo admin)
    admin/users/          Asignación de roles (solo admin)
lib/
  supabase/               Clientes de Supabase (browser, server, proxy/sesión)
  auth.ts                 Helpers para leer el perfil actual y exigir rol
  types.ts                Tipos y catálogos (roles, estados, severidad, prioridad)
supabase/
  migrations/0001_init.sql Esquema + políticas RLS
  seed.sql                Datos de ejemplo opcionales
```

## Pendientes sugeridos (no implementados aún)

- Notificaciones (correo/Discord) cuando te asignan un ticket.
- Adjuntar capturas de pantalla a un ticket (Supabase Storage).
- Búsqueda de texto libre y paginación en el dashboard.
- Despliegue (Vercel + Supabase ya en la nube) cuando el equipo lo necesite fuera de local.
