# Cita Perfecta

Cita Perfecta es una aplicacion Angular + Supabase para conexiones compatibles con enfoque de respeto, seguridad y slow dating.

## Funcionalidades

- Autenticacion con Supabase Auth.
- Onboarding, pacto de respeto, test de compatibilidad y Aura.
- Perfil editable con subida de foto a Supabase Storage.
- Moderacion de imagenes mediante Supabase Edge Function.
- Exploracion de perfiles, likes con comentario, match mutuo y chat en tiempo real.
- Cartas de conexion con limite mensual por plan.
- Reportes, bloqueos, modo pausa, premium y RLS en Supabase.

## Stack

- Angular 21 standalone components
- TypeScript
- Supabase Auth, Database, Storage, Realtime y Edge Functions
- Bootstrap 5
- Vitest

## Configuracion local

Instala dependencias:

```bash
npm install
```

Copia el ejemplo de entorno:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

Edita `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  supabase: {
    url: 'TU_URL_AQUI',
    anonKey: 'TU_ANON_KEY_AQUI'
  }
};
```

Usa la `anon public key`, nunca la `service_role secret`.

## Supabase

Ejecuta las migraciones en `supabase/migrations` desde Supabase SQL Editor.

Si es una base nueva, ejecuta primero la migracion inicial `20260620000000_init_cita_perfecta_schema.sql` y despues las migraciones de funcionalidades. Si tu base ya tiene tablas, ejecuta solo las migraciones de funcionalidades que te falten.

Migraciones principales:

- `20260620000000_init_cita_perfecta_schema.sql`
- `20260620065000_add_match_chat_tables.sql`
- `20250620120000_add_storage_buckets.sql`
- `20250620130000_add_moderation_tables.sql`
- `20250620140000_add_letters_counter.sql`
- `20250620150000_add_indexes_performance.sql`
- `20260620170000_security_privacy_ci_hardening.sql`

La migracion `20260620170000_security_privacy_ci_hardening.sql` debe ejecutarse al final. Cierra rutas/consultas sensibles, deja `profiles` para el dueno/admin, usa `public_profiles` para el feed, hace privadas las fotos y crea `vulnerability_reports`.

Para dar permisos de admin a tu usuario, ve a Supabase Dashboard > Authentication > Users > tu usuario > Raw App Meta Data y agrega:

```json
{
  "app_role": "admin"
}
```

Para moderacion de imagenes, despliega la Edge Function:

```bash
supabase functions deploy moderate-image
```

Si quieres moderacion automatica con Google Vision, configura el secreto:

```bash
supabase secrets set GOOGLE_VISION_API_KEY=tu_api_key
```

Si no configuras `GOOGLE_VISION_API_KEY`, la app no bloquea la subida: valida formato/tamano localmente y deja constancia en la respuesta de la funcion.

## Vercel

Variables necesarias en Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NODE_VERSION=20.x`

El script `npm run vercel-build` ejecuta `scripts/write-env.mjs` para escribir `environment.prod.ts` con las variables de Vercel antes del build.

## Scripts

```bash
npm start
npm run build
npm test
npm run lint
npm run e2e:ci
```

## Pruebas E2E

Hay un flujo Playwright base en `e2e/cita-perfecta-flow.playwright.ts`. Para usarlo instala Playwright y configura usuarios/datos reales de prueba.

## Capturas y demo

Agrega aqui capturas reales de tu entrega y el enlace de Vercel cuando este publicado.

- Demo: pendiente
- Capturas: pendiente

## Organizacion

- `src/app/core`: modelos, servicios, guards y utilidades.
- `src/app/pages`: pantallas principales.
- `src/app/shared`: componentes reutilizables.
- `src/environments`: configuracion por ambiente.
- `supabase/migrations`: SQL de base de datos.
- `supabase/functions`: Edge Functions.
