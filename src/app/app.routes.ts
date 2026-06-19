import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { RespectPactComponent } from './pages/respect-pact/respect-pact.component';
import { OnboardingComponent } from './pages/onboarding/onboarding.component';
import { CompatibilityTestComponent } from './pages/compatibility-test/compatibility-test.component';
import { AuraComponent } from './pages/aura/aura.component';
import { MatchListComponent } from './pages/match-list/match-list.component';
import { ProfileDetailComponent } from './pages/profile-detail/profile-detail.component';
import { ChatListComponent } from './pages/chat-list/chat-list.component';
import { ChatComponent } from './pages/chat/chat.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { PremiumComponent } from './pages/premium/premium.component';
import { ProfileCrudComponent } from './pages/profile-crud/profile-crud.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'pacto', redirectTo: 'pacto-respeto' },
  { path: 'pacto-respeto', component: RespectPactComponent, canActivate: [authGuard] },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { path: 'test', component: CompatibilityTestComponent, canActivate: [authGuard] },
  { path: 'aura', component: AuraComponent, canActivate: [authGuard] },
  { path: 'matches', component: MatchListComponent, canActivate: [authGuard] },
  { path: 'perfil/:id', component: ProfileDetailComponent, canActivate: [authGuard] },
  { path: 'chats', component: ChatListComponent, canActivate: [authGuard] },
  { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
  { path: 'ajustes', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'premium', component: PremiumComponent, canActivate: [authGuard] },
  { path: 'crud-perfiles', component: ProfileCrudComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'inicio' }
];
