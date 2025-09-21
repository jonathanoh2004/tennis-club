// backend/utils/responses.js

// Allowed origins for CORS
const ALLOW = new Set([
  "https://tenniscluboh.com",
  "https://www.tenniscluboh.com",
  "http://localhost:5173", // allow local dev
]);

function corsHeaders(origin) {
  const allowed = ALLOW.has(origin) ? origin : "https://tenniscluboh.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "false",
  };
}

// Success response
export function ok(body, origin, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
    body: JSON.stringify(body ?? {}),
  };
}

// Error response
export function bad(statusCode, message, origin, extra = {}) {
  return {
    statusCode,
    headers: { ...corsHeaders(origin) },
    body: JSON.stringify({ message, ...extra }),
  };
}

// Back-compat alias
export const err = bad;

// No content response (204)
export function noContent(origin, extraHeaders = {}) {
  return {
    statusCode: 204,
    headers: { ...corsHeaders(origin), ...extraHeaders },
    body: "",
  };
}

// Preflight response (for OPTIONS requests if needed)
export function preflight(origin, extraHeaders = {}) {
  return {
    statusCode: 204,
    headers: { ...corsHeaders(origin), ...extraHeaders },
    body: "",
  };
}
