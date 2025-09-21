// backend/utils/responses.js  (ESM)

const ALLOW = new Set([
  "https://tenniscluboh.com",
  "https://www.tenniscluboh.com",
  "http://localhost:5173", // local dev
]);

function corsHeaders(origin) {
  const allowed = ALLOW.has(origin) ? origin : "https://tenniscluboh.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

// Keep the same call signature your handlers use:
// ok(body, origin, statusCode?, extraHeaders?)
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

// noContent(origin, extraHeaders?)
export function noContent(origin, extraHeaders = {}) {
  return {
    statusCode: 204,
    headers: { ...corsHeaders(origin), ...extraHeaders },
    body: "",
  };
}

// bad(statusCode, message, origin, extra?)
export function bad(statusCode, message, origin, extra = {}) {
  return {
    statusCode,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...extra }),
  };
}

// Back-compat alias if anything imports `err`
export const err = bad;

// Optional: if you ever wire OPTIONS manually
export function preflight(origin, extraHeaders = {}) {
  return {
    statusCode: 204,
    headers: { ...corsHeaders(origin), ...extraHeaders },
    body: "",
  };
}
