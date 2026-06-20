import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'src/app/app.routes.ts',
  'src/app/pages/login/login.component.ts',
  'src/app/pages/register/register.component.ts',
  'src/app/pages/onboarding/onboarding.component.ts',
  'src/app/pages/explore/explore.component.ts',
  'src/app/pages/match-list/match-list.component.ts',
  'src/app/pages/chat/chat.component.ts',
  'vercel.json',
  'scripts/write-env.mjs',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required app file: ${file}`);
  }
}

const routes = readFileSync('src/app/app.routes.ts', 'utf8');
const requiredRoutes = ['login', 'register', 'onboarding', 'dashboard', 'explore', 'matches', 'chat/:matchId'];

for (const route of requiredRoutes) {
  if (!routes.includes(`path: '${route}'`)) {
    throw new Error(`Missing route: ${route}`);
  }
}

if (!routes.includes('authGuard') || !routes.includes('publicGuard') || !routes.includes('adminGuard')) {
  throw new Error('Expected auth/public/admin guards in route configuration.');
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
if (vercel.buildCommand !== 'npm run vercel-build') {
  throw new Error('Vercel buildCommand must be npm run vercel-build.');
}

if (!Array.isArray(vercel.rewrites) || !vercel.rewrites.some((rewrite) => rewrite.destination === '/index.html')) {
  throw new Error('Vercel SPA rewrite to /index.html is missing.');
}

// H-016: verify security headers are configured in vercel.json
const requiredHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'Strict-Transport-Security'];
const headersConfig = JSON.stringify(vercel.headers ?? []);
for (const header of requiredHeaders) {
  if (!headersConfig.includes(header)) {
    throw new Error(`Missing security header in vercel.json: ${header}`);
  }
}

// H-016: verify core services are present
const coreServices = [
  'src/app/core/services/auth.service.ts',
  'src/app/core/services/letter.service.ts',
  'src/app/core/services/premium.service.ts',
  'src/app/core/services/report.service.ts',
  'src/app/core/services/global-error-handler.service.ts',
];
for (const svc of coreServices) {
  if (!existsSync(svc)) {
    throw new Error(`Missing core service: ${svc}`);
  }
}

// H-016: verify migrations folder is populated
const { readdirSync } = await import('node:fs');
const migrations = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'));
if (migrations.length < 10) {
  throw new Error(`Expected at least 10 migration files, found ${migrations.length}`);
}

console.log('E2E smoke passed: critical routes, guards, security headers, services and migrations present.');
