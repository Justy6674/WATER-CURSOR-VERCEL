// supabase/functions/_shared/cors.ts
const ALLOWED_ORIGIN_PATTERNS_STRING = Deno.env.get('ALLOWED_CORS_ORIGINS') || 'http://localhost:3000';
const ALLOWED_ORIGINS = ALLOWED_ORIGIN_PATTERNS_STRING.split(',').map((s)=>s.trim()).filter(Boolean);
const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type, x-api-key';
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
export const corsHeaders = (requestOrigin)=>{
  let accessControlAllowOrigin = ALLOWED_ORIGINS[0] || '*';
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    accessControlAllowOrigin = requestOrigin;
  } else if (ALLOWED_ORIGINS.includes('*')) {
    accessControlAllowOrigin = '*';
  }
  return {
    'Access-Control-Allow-Origin': accessControlAllowOrigin,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': ALLOWED_METHODS
  };
};
export function handleCors(req) {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(requestOrigin) // Zde se volá jako funkce
    });
  }
  return null;
}
