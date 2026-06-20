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
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ approved: false, reason: 'Metodo no permitido.' }, 405);
  }

  try {
    const { imageUrl } = (await req.json()) as ModerateImageRequest;
    if (!imageUrl) {
      return json({ approved: false, reason: 'Falta imageUrl.' }, 400);
    }

    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!apiKey) {
      return json({
        approved: true,
        reason: 'Moderacion automatica no configurada. Imagen aprobada por validacion local de formato y tamano.'
      });
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
      return json({ approved: false, reason: 'Google Vision no pudo revisar la imagen.' }, 502);
    }

    const result = await response.json();
    const safeSearch = result.responses?.[0]?.safeSearchAnnotation as SafeSearchAnnotation | undefined;
    const blockedReason = getBlockedReason(safeSearch);

    return json({
      approved: !blockedReason,
      reason: blockedReason ?? 'Imagen aprobada.'
    });
  } catch (_error) {
    return json({ approved: false, reason: 'No se pudo moderar la imagen.' }, 500);
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

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
