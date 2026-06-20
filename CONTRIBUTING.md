# Contribuir a Cita Perfecta

Gracias por ayudar a mejorar Cita Perfecta.

## Flujo recomendado

1. Crea una rama desde `main`.
2. Instala dependencias con `npm install`.
3. Configura `src/environments/environment.ts` usando `src/environments/environment.example.ts`.
4. Ejecuta `npm test` antes de abrir un pull request.
5. Ejecuta `npm run build` para validar que Angular compile.

## Estilo de codigo

- Usa componentes standalone.
- Usa `inject()` en servicios y componentes nuevos.
- Maneja errores con `try/catch` y mensajes claros para el usuario.
- No subas claves reales de Supabase, Google Vision, Firebase ni Expo.

## Base de datos

Los cambios de Supabase deben ir en `supabase/migrations` con el formato:

```text
YYYYMMDDHHMMSS_descripcion.sql
```

Cada migracion debe ser idempotente cuando sea posible usando `if not exists`, `on conflict` o `drop policy if exists`.
