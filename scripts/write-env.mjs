import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.prod.ts');
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];
const posthogKey = process.env['POSTHOG_KEY'] ?? 'TU_POSTHOG_KEY';
const posthogHost = process.env['POSTHOG_HOST'] ?? 'https://app.posthog.com';
const appVersion = process.env['APP_VERSION'] ?? '1.0.0';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables.');
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables.');
  process.exit(1);
}

if (!/^https:\/\/.+\.supabase\.co$/.test(supabaseUrl)) {
  console.error('SUPABASE_URL must look like https://your-project.supabase.co');
  process.exit(1);
}

console.log(`Writing Angular production environment for Supabase project: ${new URL(supabaseUrl).host}`);
console.log(`SUPABASE_ANON_KEY detected: ${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-6)}`);

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
