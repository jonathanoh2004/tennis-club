// backend/handlers/matches.js
import { ddb } from "../utils/dynamo.js";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ok, bad } from "../utils/responses.js";
import { nanoid } from "nanoid";

const MATCHES_TABLE = process.env.MATCHES_TABLE;

/** POST /matches  { clubId, teams: {A:[a,b], B:[c,d]}, bestOf, startedAt } */
export const create = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    if (!body.clubId) return bad(400, { message: "clubId required" });

    const match = {
      matchId: `match_${nanoid(8)}`,
      clubId: body.clubId,
      teams: body.teams || {},
      bestOf: body.bestOf || 1,
      score: body.score || { A: 0, B: 0, sets: [] },
      status: "LIVE",
      startedAt: body.startedAt || Date.now(),
      createdAt: Date.now(),
    };

    await ddb.send(new PutCommand({ TableName: MATCHES_TABLE, Item: match }));
    return ok(match, 201);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

/** GET /matches?clubId=... */
export const list = async (event) => {
  try {
    const clubId = event?.queryStringParameters?.clubId;
    if (!clubId) return bad(400, { message: "clubId query param required" });

    const res = await ddb.send(
      new QueryCommand({
        TableName: MATCHES_TABLE,
        IndexName: "byClub",
        KeyConditionExpression: "clubId = :c",
        ExpressionAttributeValues: { ":c": clubId },
        // If your GSI has startedAt as RANGE, you can sort newest first:
        // ScanIndexForward: false,
      })
    );
    return ok(res.Items || []);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

/** GET /matches/{matchId} */
export const get = async (event) => {
  try {
    const matchId = event?.pathParameters?.matchId;
    if (!matchId) return bad(400, { message: "matchId path param required" });

    const res = await ddb.send(
      new GetCommand({
        TableName: MATCHES_TABLE,
        Key: { matchId },
      })
    );

    if (!res.Item) return bad(404, { message: "Match not found" });
    return ok(res.Item);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

/**
 * POST /matches/{matchId}/score
 * body: { team: "A" | "B", delta?: number }  // default delta = +1
 * clamps result to >= 0, only when status === "LIVE"
 */
export const score = async (event) => {
  try {
    const matchId = event?.pathParameters?.matchId;
    if (!matchId) return bad(400, { message: "matchId path param required" });

    const body = JSON.parse(event.body || "{}");
    const team = body.team || body.which; // accept either key
    const delta = Number(body.delta ?? 1);
    if (!["A", "B"].includes(team)) return bad(400, { message: "team must be 'A' or 'B'" });
    if (!Number.isFinite(delta)) return bad(400, { message: "delta must be a number" });

    // Load current match
    const cur = await ddb.send(
      new GetCommand({ TableName: MATCHES_TABLE, Key: { matchId } })
    );
    if (!cur.Item) return bad(404, { message: "Match not found" });
    if (cur.Item.status !== "LIVE") return bad(400, { message: "Match is not LIVE" });

    const field = team; // "A" or "B"
    const current = cur.Item.score?.[field] ?? 0;
    const next = Math.max(0, current + delta);

    // Update exact value + updatedAt
    const updated = await ddb.send(
      new UpdateCommand({
        TableName: MATCHES_TABLE,
        Key: { matchId },
        UpdateExpression: "SET #score.#f = :val, updatedAt = :now",
        ExpressionAttributeNames: {
          "#score": "score",
          "#f": field,
        },
        ExpressionAttributeValues: {
          ":val": next,
          ":now": Date.now(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return ok(updated.Attributes);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

/** POST /matches/{matchId}/finalize */
export const finalize = async (event) => {
  try {
    const matchId = event?.pathParameters?.matchId;
    if (!matchId) return bad(400, { message: "matchId path param required" });

    const cur = await ddb.send(
      new GetCommand({ TableName: MATCHES_TABLE, Key: { matchId } })
    );
    if (!cur.Item) return bad(404, { message: "Match not found" });
    if (cur.Item.status === "FINAL") return ok(cur.Item); // idempotent

    const res = await ddb.send(
      new UpdateCommand({
        TableName: MATCHES_TABLE,
        Key: { matchId },
        UpdateExpression: "SET #s = :final, updatedAt = :now",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":final": "FINAL", ":now": Date.now() },
        ReturnValues: "ALL_NEW",
      })
    );

    return ok(res.Attributes);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};
