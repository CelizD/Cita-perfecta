# Convencion de servicios

Los servicios compartidos de Cita Perfecta viven en `src/app/core/services`.

## Responsabilidades

- `AuthService`: sesion, registro, login y usuario actual.
- `SupabaseService`: cliente unico de Supabase y configuracion base.
- `CompatibilityService`: Aura, recomendaciones y compatibilidad.
- `MatchService`: likes, matches y reglas de conexion.
- `ChatService`: conversaciones y mensajes.
- `LetterService`: cartas de conexion y cuota mensual.
- `ReportService`: reportes, bloqueos y seguridad local.
- `UploadService`: validacion y subida de imagenes.
- `ModerationService`: revision de imagenes antes de publicar.
- `NotificationService`: tokens y notificaciones push.
- `AnalyticsService`: eventos de producto y KPIs.
- `ConsentService`: terminos, privacidad y consentimiento de datos.

## Nomenclatura

- Servicios: `nombre.service.ts`
- Modelos: `nombre.model.ts`
- Componentes: `nombre.component.ts`
- Directivas: `nombre.directive.ts`
- Pipes: `nombre.pipe.ts`

## Uso recomendado

Importa desde el barrel cuando el alias ya este disponible:

```ts
import { AuthService, SupabaseService } from '@core/services';
```

Para codigo nuevo usa `inject()`:

```ts
private auth = inject(AuthService);
```

Evita crear servicios nuevos en `src/app/services`. Esa carpeta queda como compatibilidad temporal mientras se completa la consolidacion.
