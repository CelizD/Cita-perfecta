# Cita Perfecta - Angular Producto Final

Aplicación web MVP desarrollada con Angular para el microproyecto **Cita Perfecta**.

Frase principal: **Conexiones reales, no coincidencias al azar.**

## Requisitos del producto final cubiertos

| Requisito del pizarrón | Dónde está implementado |
|---|---|
| Aplicación desarrollada con Angular | Proyecto Angular standalone con rutas y componentes |
| Framework de maquetación | Bootstrap 5 instalado y cargado en `angular.json` |
| Componentes con Input y Output | `src/app/shared/profile-card/profile-card.component.ts` usa `@Input()` y `@Output()` |
| Servicios | Carpeta `src/app/core/services` |
| Al menos un CRUD | `ProfileCrudService` + pantalla `/crud-perfiles` |
| Routing y navegación | `src/app/app.routes.ts` y `NavbarComponent` |
| Logout | `AuthService.logout()` y botón en Ajustes |
| App responsive | CSS/SCSS con grid, media queries y Bootstrap |
| Código organizado | `core/models`, `core/classes`, `core/utils`, `core/services`, `pages`, `shared` |

## Funciones principales

- Registro con validación de edad mínima de 18 años.
- Login y logout.
- Pacto de Respeto.
- Onboarding de perfil.
- Test de compatibilidad.
- Resultado de Aura.
- Lista de perfiles compatibles.
- Likes y cartas de conexión.
- Match simulado y chat.
- Cierre amistoso.
- Reportar y bloquear usuarios.
- Modo pausa.
- Pantalla premium simulada.
- CRUD de perfiles para demostrar Create, Read, Update y Delete.

## Instalación

Abre PowerShell dentro de la carpeta del proyecto y ejecuta:

```powershell
npm install
npm start
```

Luego abre:

```text
http://localhost:4200
```

## Comandos útiles

```powershell
npm install
npm start
npm run build
```

## Estructura principal

```text
src/app
├── core
│   ├── classes
│   ├── guards
│   ├── models
│   ├── services
│   └── utils
├── pages
│   ├── aura
│   ├── chat
│   ├── chat-list
│   ├── compatibility-test
│   ├── login
│   ├── match-list
│   ├── onboarding
│   ├── premium
│   ├── profile-crud
│   ├── profile-detail
│   ├── register
│   ├── respect-pact
│   ├── settings
│   └── welcome
└── shared
    ├── navbar
    └── profile-card
```

## Nota

Los datos se guardan en `localStorage`, por eso no necesitas backend para esta entrega.
