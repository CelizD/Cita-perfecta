import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'src/app/app.routes.ts',
  'src/app/pages/login/login.component.ts',
  'src/app/pages/register/register.component.ts',
  'src/app/pages/onboarding/onboarding.component.ts',
  'src/app/pages/explore/explore.component.ts',
  'src/app/pages/match-list/match-list.component.ts',
  'src/app/pages/chat/chat.component.ts',
  'vercel.json'
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

console.log('E2E smoke passed: critical routes, guards and Vercel SPA config are present.');
