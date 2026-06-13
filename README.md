# Cita Perfecta

**Cita Perfecta** es una aplicación web desarrollada con **Angular** que busca ayudar a las personas a crear conexiones reales, sanas y compatibles. La plataforma se enfoca en la compatibilidad, los intereses, los valores, la comunicación y el respeto, evitando que las conexiones dependan únicamente de la apariencia física.

## Frase principal

**Cita Perfecta — Conexiones reales, no coincidencias al azar.**

## Descripción del proyecto

Cita Perfecta es un microproyecto académico desarrollado para la materia **Desarrollo de Software Frontend II**.  
El proyecto consiste en una aplicación web tipo MVP donde los usuarios pueden registrarse, iniciar sesión, crear su perfil, responder un test de compatibilidad, visualizar perfiles sugeridos, enviar likes o cartas de conexión, hacer match, conversar mediante chat y cerrar conversaciones de forma respetuosa.

La aplicación busca resolver problemas comunes en plataformas de citas, como conexiones superficiales, ghosting, falta de compatibilidad real y poca seguridad al interactuar con otros usuarios.

## Objetivo general

Desarrollar una aplicación web en Angular que permita a los usuarios crear un perfil, responder un test de compatibilidad, visualizar perfiles sugeridos, enviar likes o cartas de conexión, hacer match, conversar y cerrar chats de forma respetuosa.

## Tecnologías utilizadas

- Angular
- TypeScript
- HTML
- CSS / SCSS
- Angular Router
- Reactive Forms
- Servicios en Angular
- Framework de maquetación: Bootstrap / Angular Material / Tailwind CSS
- Datos simulados o locales para la primera versión

## Funcionalidades principales

- Registro de usuarios
- Inicio de sesión
- Validación de mayoría de edad
- Creación y edición de perfil
- Pacto de Respeto
- Test de compatibilidad
- Cálculo básico de compatibilidad
- Visualización de perfiles sugeridos
- Likes con comentario
- Cartas de conexión
- Creación de matches
- Chat básico entre usuarios compatibles
- Sugerencias para iniciar conversación
- Cierre Amistoso para evitar el ghosting
- Reportar usuarios
- Bloquear usuarios
- Modo Pausa
- Pantalla Premium simulada
- Panel de ajustes y privacidad
- Implementación de logout

## Requisitos del producto final

Este proyecto cumple con las características solicitadas para la entrega final:

- Aplicación desarrollada con Angular.
- Uso de un framework de maquetación como Bootstrap, Angular Material, Tailwind CSS u otro.
- Creación de componentes reutilizables.
- Implementación de comunicación entre componentes usando `@Input` y `@Output`.
- Uso de servicios en Angular.
- Implementación de al menos un CRUD.
- Routing y navegación dentro de la aplicación.
- Implementación de layout general.
- Aplicación responsive.
- Código organizado en carpetas separadas.
- Uso de clases, interfaces, componentes, servicios y funciones.
- Separación de archivos para mantener una estructura limpia y ordenada.

## Módulos principales

- Módulo de autenticación
- Módulo de perfil
- Módulo de onboarding
- Módulo de Pacto de Respeto
- Módulo de test de compatibilidad
- Módulo de perfiles compatibles
- Módulo de likes, cartas y matches
- Módulo de chat
- Módulo de Cierre Amistoso
- Módulo de ajustes
- Módulo de seguridad básica
- Módulo Premium simulado

## Componentes principales

- `AppComponent`
- `NavbarComponent`
- `WelcomeComponent`
- `LoginComponent`
- `RegisterComponent`
- `RespectPactComponent`
- `OnboardingComponent`
- `CompatibilityTestComponent`
- `AuraComponent`
- `MatchListComponent`
- `ProfileCardComponent`
- `ProfileDetailComponent`
- `ConnectionLetterComponent`
- `ChatListComponent`
- `ChatComponent`
- `FriendlyClosureComponent`
- `SettingsComponent`
- `PremiumComponent`

## Servicios principales

- `AuthService`
- `UserService`
- `CompatibilityService`
- `MatchService`
- `ChatService`
- `ReportService`
- `PremiumService`

## CRUD implementado

El proyecto contempla el uso de un CRUD mediante servicios de Angular.  
Por ejemplo, se puede aplicar sobre los perfiles de usuario:

- Crear perfil
- Consultar perfiles
- Actualizar información del perfil
- Eliminar o desactivar perfil

También puede aplicarse en chats, matches, reportes o usuarios, dependiendo del avance del desarrollo.

## Rutas principales

- `/inicio`
- `/login`
- `/registro`
- `/pacto-respeto`
- `/onboarding`
- `/test`
- `/aura`
- `/matches`
- `/perfil/:id`
- `/chat/:id`
- `/ajustes`
- `/premium`

## Estructura sugerida del proyecto

```bash
src/
│
├── app/
│   ├── components/
│   │   ├── navbar/
│   │   ├── profile-card/
│   │   └── friendly-closure/
│   │
│   ├── pages/
│   │   ├── welcome/
│   │   ├── login/
│   │   ├── register/
│   │   ├── onboarding/
│   │   ├── compatibility-test/
│   │   ├── matches/
│   │   ├── chat/
│   │   ├── settings/
│   │   └── premium/
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── compatibility.service.ts
│   │   ├── match.service.ts
│   │   ├── chat.service.ts
│   │   └── report.service.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── match.model.ts
│   │   ├── message.model.ts
│   │   └── report.model.ts
│   │
│   ├── interfaces/
│   │   ├── user.interface.ts
│   │   ├── profile.interface.ts
│   │   └── compatibility.interface.ts
│   │
│   └── app-routing.module.ts
│
├── assets/
│
└── styles.scss

## Instalación

Para instalar las dependencias del proyecto, ejecuta:

```bash
npm install
Ejecución
Para iniciar el servidor de desarrollo, ejecuta:

bash
ng serve
Luego abre el navegador en:

text
http://localhost:4200
Compilación
Para generar una versión de producción, ejecuta:

bash
ng build
Diseño visual sugerido
La identidad visual de Cita Perfecta busca transmitir confianza, seguridad, calidez y modernidad.

Paleta de colores

Rosa principal: #FF6B8B

Morado emocional: #6C5CE7

Azul seguridad: #2D9CDB

Verde confianza: #2ECC71

Fondo cálido: #FFF5F7

Tipografías sugeridas

Poppins para títulos

Inter para textos

Responsabilidades del equipo
Daniel Celiz Martínez
Encargado del desarrollo frontend y backend del proyecto, creación del proyecto Angular, componentes principales, rutas, servicios, formularios, lógica de compatibilidad, integración de datos simulados y estructura general de la aplicación.

Ismael Cervantes Carranza
Encargado de QA, testing y documentación. Apoya en la revisión de requisitos, pruebas de funcionalidades, validación de flujos y elaboración de documentación del proyecto.

Estado del proyecto
Proyecto en desarrollo como microproyecto académico para la materia Desarrollo de Software Frontend II.

Conclusión
Cita Perfecta es una aplicación web enfocada en crear conexiones reales y compatibles mediante una experiencia más humana, consciente y respetuosa. La primera versión en Angular establece una base funcional con registro, perfil, test de compatibilidad, perfiles sugeridos, likes, cartas de conexión, matches, chat, cierre amistoso y una estructura organizada para futuras mejoras.
