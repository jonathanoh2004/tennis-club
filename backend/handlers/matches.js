// backend/handlers/matches.js
import { ddb } from "../utils/dynamo.js";
import {
  PutCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ok, bad } from "../utils/responses.js";
import { nanoid } from "nanoid";
import { requireAuth } from "../utils/verifyCognitoJwt.js";

const TABLE = process.env.MATCHES_TABLE;
const GSI = process.env.MATCHES_BY_CLUB_INDEX || "byClubV2";

/** GET /matches?clubId=... (public) */
export const list = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const q = event.queryStringParameters || {};
  const clubId = q.clubId ?? new URLSearchParams(q).get?.("clubId");
  if (!clubId) return bad(400, "clubId is required", origin);

  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: GSI,
        KeyConditionExpression: "clubId = :c",
        ExpressionAttributeValues: { ":c": clubId },
      })
    );
    return ok({ items: res.Items ?? [] }, origin);
  } catch (e) {
    console.error("matches.list error:", e);
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
};

/** GET /matches/{matchId} (public) */
export const get = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const { matchId } = event.pathParameters || {};
  if (!matchId) return bad(400, "matchId is required", origin);

  try {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { matchId },
      })
    );
    return ok(res.Item ?? {}, origin);
  } catch (e) {
    console.error("matches.get error:", e);
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
};

/** POST /matches (protected) */
async function _create(event) {
  const origin = event.headers?.origin || event.headers?.Origin;
  const user = event.requestContext.authorizer?.user;

  try {
    const body = getJsonBody(event);
    if (!body?.clubId || !body?.teams) {
      return bad(400, "clubId and teams required", origin, { received: body ?? null });
    }

    const match = {
      matchId: `match_${nanoid(10)}`,
      clubId: body.clubId,
      teams: body.teams,
      score: body.score ?? { A: 0, B: 0 },
      startedAt: Date.now(),
      createdBy: user?.sub,
      status: "active",
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: match }));
    return ok(match, origin, 201);
  } catch (e) {
    console.error("matches.create error:", e);
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
}
export const create = requireAuth(_create);

/** POST /matches/{matchId}/score (protected) */
async function _score(event) {
  const origin = event.headers?.origin || event.headers?.Origin;
  const user = event.requestContext.authorizer?.user;
  const { matchId } = event.pathParameters || {};

  try {
    const body = getJsonBody(event);
    const team = body?.team; // 'A' or 'B'
    const delta = Number(body?.delta ?? 1);
    if (!matchId || !["A", "B"].includes(team) || ![1, -1].includes(delta)) {
      return bad(400, "matchId, team (A|B), delta (1|-1) required", origin, {
        received: body ?? null,
      });
    }

    const res = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { matchId },
        UpdateExpression: `SET score.#t = score.#t + :d, updatedAt = :now`,
        ExpressionAttributeNames: { "#t": team },
        ExpressionAttributeValues: { ":d": delta, ":now": Date.now() },
        ReturnValues: "ALL_NEW",
      })
    );

    return ok({ item: res.Attributes, by: user?.sub }, origin);
  } catch (e) {
    console.error("matches.score error:", e);
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
}
export const score = requireAuth(_score);

/** POST /matches/{matchId}/finalize (protected) */
async function _finalize(event) {
  const origin = event.headers?.origin || event.headers?.Origin;
  const user = event.requestContext.authorizer?.user;
  const { matchId } = event.pathParameters || {};

  try {
    if (!matchId) return bad(400, "matchId is required", origin);

    const res = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { matchId },
      UpdateExpression: "SET #status = :done, finalizedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },   // 👈 alias reserved word
      ExpressionAttributeValues: { ":done": "final", ":now": Date.now() },
      ReturnValues: "ALL_NEW",
    }));

    return ok({ item: res.Attributes, by: user?.sub }, origin);
  } catch (e) {
    console.error("matches.finalize error:", e);
    return bad(500, "Internal error", origin, { detail: e?.message ?? String(e) });
  }
}
export const finalize = requireAuth(_finalize);

/* -------- helpers -------- */
function getJsonBody(event) {
  if (!event) return {};
  let b = event.body;
  if (b == null) return {};

  // Some API Gateway paths mark bodies as base64
  if (event.isBase64Encoded && typeof b === "string") {
    try {
      b = Buffer.from(b, "base64").toString("utf8");
    } catch {
      // ignore decode errors; we'll try JSON parse next
    }
  }

  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  // Already an object in some setups
  return b;
}
