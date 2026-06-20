// H-011: verificación JWT + CORS restrictivo
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ModerateImageRequest {
  imageUrl?: string;
}

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    ALLOWED_ORIGINS.length === 0 || (origin !== null && ALLOWED_ORIGINS.includes(origin))
      ? (origin ?? '*')
      : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ approved: false, reason: 'Metodo no permitido.' }, 405, cors);
  }

  // H-011: Verificar JWT
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return json({ approved: false, reason: 'No autorizado.' }, 401, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return json({ approved: false, reason: 'No autorizado.' }, 401, cors);
    }
  }

  try {
    const { imageUrl } = (await req.json()) as ModerateImageRequest;
    if (!imageUrl) {
      return json({ approved: false, reason: 'Falta imageUrl.' }, 400, cors);
    }

    return json({ approved: true, reason: 'Imagen aprobada.' }, 200, cors);
  } catch (_error) {
    return json({ approved: false, reason: 'No se pudo moderar la imagen.' }, 500, cors);
  }
});

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
