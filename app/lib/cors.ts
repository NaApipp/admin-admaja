// lib/cors.ts
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];

export function getCorsHeaders(requestOrOrigin?: Request | string | null) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
  let origin: string | null = null;

  if (typeof requestOrOrigin === "string") {
    origin = requestOrOrigin;
  } else if (requestOrOrigin instanceof Request) {
    origin = requestOrOrigin.headers.get("origin");
  }

  const isAllowed = origin ? allowedOrigins.includes(origin) : false;
  const finalOrigin = isAllowed && origin ? origin : (allowedOrigins[0] || "*");

  return {
    "Access-Control-Allow-Origin": finalOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Helper to add CORS headers to a NextResponse or Response
 */
export function withCors<T extends Response>(response: T, requestOrOrigin?: Request | string | null): T {
  const headers = getCorsHeaders(requestOrOrigin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Helper for handling OPTIONS preflight requests
 */
export function handleOptions(request?: Request) {
  const origin = request ? request.headers.get("origin") : null;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}