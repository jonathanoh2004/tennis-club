// backend/utils/verifyCognitoJwt.js
import { createRemoteJWKSet, jwtVerify } from "jose";

const REGION = process.env.COGNITO_REGION || "us-east-2";
const POOL_ID = process.env.COGNITO_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID; // audience

const ISS = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${ISS}/.well-known/jwks.json`));

export async function verifyJwt(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISS,
    audience: CLIENT_ID, // pin to your App Client ID
  });
  return payload; // e.g., { sub, email, "cognito:groups": [...] }
}

export function requireAuth(handler) {
  return async (event, context) => {
    const origin = event.headers?.origin || event.headers?.Origin;
    try {
      const auth = event.headers?.authorization || event.headers?.Authorization;
      if (!auth?.startsWith("Bearer ")) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || "https://tenniscluboh.com",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          },
          body: JSON.stringify({ message: "Missing Bearer token" }),
        };
      }
      const token = auth.slice(7);
      const user = await verifyJwt(token);
      event.requestContext.authorizer = { user };
      return handler(event, context);
    } catch (e) {
      console.error("JWT verify failed:", e);
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": origin || "https://tenniscluboh.com",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        body: JSON.stringify({ message: "Invalid or expired token" }),
      };
    }
  };
}
