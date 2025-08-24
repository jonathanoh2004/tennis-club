// backend/utils/auth.js
import * as jose from "jose";

const region = process.env.COGNITO_REGION;          // e.g. "us-east-2"
const userPoolId = process.env.COGNITO_POOL_ID;     // e.g. "us-east-2_XXXX"
const clientId = process.env.COGNITO_CLIENT_ID;     // your app client id
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

let jwks;
async function getJWKS() {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function requireUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  // Verify signature + issuer
  const { payload } = await jose.jwtVerify(token, await getJWKS(), { issuer });

  // Accept either an ID token or an Access token.
  // - ID token has: token_use = "id", aud = clientId (sometimes also client_id)
  // - Access token has: token_use = "access", client_id = clientId
  const tokenUse = payload.token_use;
  const aud = payload.aud;
  const cid = payload.client_id;

  if (tokenUse === "id") {
    if (clientId && aud && aud !== clientId) {
      throw Object.assign(new Error("Invalid audience"), { statusCode: 401 });
    }
  } else if (tokenUse === "access") {
    if (clientId && cid && cid !== clientId) {
      throw Object.assign(new Error("Invalid client"), { statusCode: 401 });
    }
  } else {
    // Unknown token type; reject
    throw Object.assign(new Error("Invalid token"), { statusCode: 401 });
  }

  // Common fields
  const sub = payload.sub;
  const email = payload.email || "";
  const username = payload["cognito:username"] || email || sub;

  return { sub, email, username, tokenUse };
}
