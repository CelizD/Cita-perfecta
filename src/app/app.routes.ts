import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'inicio', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  { path: 'registro', pathMatch: 'full', redirectTo: 'register' },
  {
    path: 'recuperar-contrasena',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/welcome/welcome.component').then((m) => m.WelcomeComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.component').then((m) => m.OnboardingComponent)
  },
  { path: 'pacto', pathMatch: 'full', redirectTo: 'pacto-respeto' },
  {
    path: 'pacto-respeto',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/respect-pact/respect-pact.component').then((m) => m.RespectPactComponent)
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.component').then((m) => m.OnboardingComponent)
  },
  {
    path: 'test',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/compatibility-test/compatibility-test.component').then((m) => m.CompatibilityTestComponent)
  },
  {
    path: 'aura',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/aura/aura.component').then((m) => m.AuraComponent)
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/match-list/match-list.component').then((m) => m.MatchListComponent)
  },
  {
    path: 'perfil/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile-detail/profile-detail.component').then((m) => m.ProfileDetailComponent)
  },
  {
    path: 'chats',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat-list/chat-list.component').then((m) => m.ChatListComponent)
  },
  {
    path: 'chat/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.component').then((m) => m.ChatComponent)
  },
  {
    path: 'ajustes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent)
  },
  {
    path: 'premium',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/premium/premium.component').then((m) => m.PremiumComponent)
  },
  {
    path: 'crud-perfiles',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile-crud/profile-crud.component').then((m) => m.ProfileCrudComponent)
  },
  { path: '**', redirectTo: 'login' }
];
