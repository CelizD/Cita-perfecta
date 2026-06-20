# Cita Perfecta

Cita Perfecta es una aplicacion web desarrollada con Angular para crear conexiones compatibles con un enfoque de respeto, seguridad y slow dating. El proyecto incluye registro, login con Supabase, pacto de respeto, onboarding, test de compatibilidad, perfiles sugeridos, likes con comentario, cartas de conexion, chat, ajustes y panel de administracion de perfiles.

## Funcionalidades principales

- Autenticacion con Supabase Auth.
- Perfil de usuario con intereses, estilo de comunicacion, lenguaje del amor y dealbreakers.
- Pacto de respeto antes de entrar al flujo principal.
- Test de compatibilidad y resultado de aura.
- Feed de perfiles compatibles.
- Like con comentario y cartas de conexion.
- Chat basico y cierre amistoso.
- Modo pausa, centro de seguridad y premium.
- CRUD de perfiles sugeridos.
- API externa Open-Meteo para sugerir planes segun el clima.

## Tecnologias

- Angular 21
- TypeScript
- Supabase
- Bootstrap
- Vitest

## Requisitos

- Node.js compatible con Angular 21
- npm
- Cuenta/proyecto en Supabase

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea un proyecto en Supabase.

3. Copia tus claves desde `Project Settings > API`.

4. Pega los valores en:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY'
};
```

5. Ejecuta en Supabase el archivo:

```text
supabase/schema.sql
```

6. Para una demo escolar, puedes desactivar temporalmente `Confirm email` en Supabase Auth.

## Scripts

```bash
npm start
```

Ejecuta el servidor de desarrollo en `http://localhost:4200`.

```bash
npm run build
```

Genera la version de produccion en `dist/`.

```bash
npm test
```

Ejecuta las pruebas unitarias con Vitest.

## Variables

El archivo `.env.example` documenta las variables necesarias. No pegues llaves reales en ese archivo.

## Organizacion

- `src/app/core`: modelos, servicios, guards y utilidades.
- `src/app/pages`: pantallas principales de la aplicacion.
- `src/app/shared`: componentes reutilizables.
- `src/environments`: configuracion de Supabase por ambiente.
- `supabase`: SQL e instrucciones para la base de datos.

## Estado del proyecto

La aplicacion esta preparada para una entrega academica: usa Angular, componentes, servicios, routing, CRUD, responsive design, API externa y autenticacion con Supabase.
