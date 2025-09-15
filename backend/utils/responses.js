// backend/utils/responses.js
const ALLOW = new Set([
  "https://tenniscluboh.com",
  "https://www.tenniscluboh.com",
]);

function corsHeaders(origin) {
  const allowed = ALLOW.has(origin) ? origin : "https://tenniscluboh.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

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

export function bad(statusCode, message, origin, extra = {}) {
  return {
    statusCode,
    headers: { ...corsHeaders(origin) },
    body: JSON.stringify({ message, ...extra }),
  };
}

// Back-compat alias (if any code still imports `err`)
export const err = bad;
