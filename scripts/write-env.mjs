import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.prod.ts');
const supabaseUrl = process.env['SUPABASE_URL'] ?? 'TU_URL_AQUI';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] ?? 'TU_ANON_KEY_AQUI';
const posthogKey = process.env['POSTHOG_KEY'] ?? 'TU_POSTHOG_KEY';
const posthogHost = process.env['POSTHOG_HOST'] ?? 'https://app.posthog.com';
const appVersion = process.env['APP_VERSION'] ?? '1.0.0';

const content = `export const environment = {
  production: true,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}'
  },
  posthog: {
    key: '${posthogKey}',
    host: '${posthogHost}'
  },
  appVersion: '${appVersion}'
};
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content);
