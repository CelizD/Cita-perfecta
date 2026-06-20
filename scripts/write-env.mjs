import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.prod.ts');
const supabaseUrl = process.env['SUPABASE_URL'] ?? 'TU_URL_AQUI';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] ?? 'TU_ANON_KEY_AQUI';

const content = `export const environment = {
  production: true,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}'
  }
};
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content);
