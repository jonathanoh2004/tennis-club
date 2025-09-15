import { ddb } from "../utils/dynamo.js";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ok, bad } from "../utils/responses.js";
import { nanoid } from "nanoid";
import { requireAuth } from "../utils/verifyCognitoJwt.js";

const CLUBS_TABLE = process.env.CLUBS_TABLE;

export const get = async (event) => {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  try {
    const res = await ddb.send(new ScanCommand({ TableName: CLUBS_TABLE }));
    return ok({ items: res.Items ?? [] }, origin, 200);
  } catch (e) {
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
};

async function _create(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  const user = event.requestContext.authorizer?.user; // from JWT
  try {
    const body = safeJson(event?.body);
    const name = (body?.name ?? "").trim();
    if (!name) return bad(400, "Field 'name' is required", origin);

    const club = {
      clubId: `club_${nanoid(8)}`,
      name,
      createdAt: Date.now(),
      createdBy: user?.sub,
    };
    await ddb.send(new PutCommand({ TableName: CLUBS_TABLE, Item: club }));
    return ok(club, origin, 201);
  } catch (e) {
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
}
export const create = requireAuth(_create);

function safeJson(b) { try { return b ? JSON.parse(b) : {}; } catch { return {}; } }
