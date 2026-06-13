import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { RespectPactComponent } from './pages/respect-pact/respect-pact.component';
import { OnboardingComponent } from './pages/onboarding/onboarding.component';
import { CompatibilityTestComponent } from './pages/compatibility-test/compatibility-test.component';
import { AuraComponent } from './pages/aura/aura.component';
import { MatchesComponent } from './pages/matches/matches.component';
import { ChatComponent } from './pages/chat/chat.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProfileCrudComponent } from './pages/profile-crud/profile-crud.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'pacto', component: RespectPactComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'test', component: CompatibilityTestComponent },
  { path: 'aura', component: AuraComponent },
  { path: 'matches', component: MatchesComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'ajustes', component: SettingsComponent },
  { path: 'crud-perfiles', component: ProfileCrudComponent },
  { path: '**', redirectTo: '' }
];