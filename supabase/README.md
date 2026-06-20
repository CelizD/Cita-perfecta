# Supabase para Cita Perfecta

1. Crea un proyecto en Supabase.
2. Ve a `Project Settings > API`.
3. Copia `Project URL` y `anon public key`.
4. Pegalos en:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'TU_PROJECT_URL',
  supabaseAnonKey: 'TU_ANON_KEY'
};
```

5. En Supabase, abre `SQL Editor` y ejecuta el archivo `supabase/schema.sql`.
6. En `Authentication > Providers`, deja habilitado `Email`.
7. Para una demo escolar mas rapida, puedes desactivar temporalmente `Confirm email`.

Con eso el login y registro usan Supabase Auth, y el perfil se guarda en la tabla `profiles`.
