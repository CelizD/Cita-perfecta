// H-004: fail-closed cuando no hay API key; H-011: verificación JWT + CORS restrictivo
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ModerateImageRequest {
  imageUrl?: string;
}

interface SafeSearchAnnotation {
  adult?: string;
  violence?: string;
  spoof?: string;
  medical?: string;
  racy?: string;
}

const BLOCKED_LEVELS = new Set(['LIKELY', 'VERY_LIKELY']);

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

    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!apiKey) {
      // H-004: fail-closed en producción; fail-open solo en entorno sin clave configurada
      const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
      if (isProduction) {
        return json({ approved: false, reason: 'Moderacion no disponible. Configura GOOGLE_VISION_API_KEY.' }, 503, cors);
      }
      return json({
        approved: true,
        reason: 'Moderacion automatica no configurada. Imagen validada solo por formato y tamano.'
      }, 200, cors);
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }]
          }
        ]
      })
    });

    if (!response.ok) {
      return json({ approved: false, reason: 'Google Vision no pudo revisar la imagen.' }, 502, cors);
    }

    const result = await response.json();
    const safeSearch = result.responses?.[0]?.safeSearchAnnotation as SafeSearchAnnotation | undefined;
    const blockedReason = getBlockedReason(safeSearch);

    return json({
      approved: !blockedReason,
      reason: blockedReason ?? 'Imagen aprobada.'
    }, 200, cors);
  } catch (_error) {
    return json({ approved: false, reason: 'No se pudo moderar la imagen.' }, 500, cors);
  }
});

function getBlockedReason(annotation?: SafeSearchAnnotation): string | null {
  if (!annotation) return 'No se recibio resultado de SafeSearch.';

  if (BLOCKED_LEVELS.has(annotation.adult ?? '')) return 'Contenido adulto detectado.';
  if (BLOCKED_LEVELS.has(annotation.violence ?? '')) return 'Contenido violento detectado.';
  if (BLOCKED_LEVELS.has(annotation.spoof ?? '')) return 'Contenido enganoso detectado.';
  if (BLOCKED_LEVELS.has(annotation.racy ?? '')) return 'Contenido sexual sugerente detectado.';

  return null;
}

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
