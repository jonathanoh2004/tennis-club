import { ddb } from "../utils/dynamo.js";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const MATCHES_TABLE = process.env.MATCHES_TABLE;

/** POST /matches  { clubId, teams: {A:[a,b], B:[c,d]}, bestOf, startedAt } */
export const create = async (event) => {
  const body = JSON.parse(event.body || "{}");
  if (!body.clubId) return bad("clubId required");

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
};

/** GET /matches?clubId=... */
export const list = async (event) => {
  const clubId = event?.queryStringParameters?.clubId;
  if (!clubId) return bad("clubId query param required");

  const res = await ddb.send(
    new QueryCommand({
      TableName: MATCHES_TABLE,
      IndexName: "byClub",
      KeyConditionExpression: "clubId = :c",
      ExpressionAttributeValues: { ":c": clubId },
    })
  );
  return ok(res.Items || []);
};

/** GET /matches/{matchId} */
export const get = async (event) => {
  const matchId = event?.pathParameters?.matchId;
  if (!matchId) return bad("matchId path param required");

  const res = await ddb.send(
    new GetCommand({
      TableName: MATCHES_TABLE,
      Key: { matchId },
    })
  );

  if (!res.Item) return bad("Match not found", 404);
  return ok(res.Item);
};

/**
 * POST /matches/{matchId}/score
 * body: { team: "A" | "B", delta?: number }  // default delta = +1
 * clamps result to >= 0, only when status === "LIVE"
 */
export const score = async (event) => {
  const matchId = event?.pathParameters?.matchId;
  if (!matchId) return bad("matchId path param required");

  const body = JSON.parse(event.body || "{}");
  const team = body.team;
  const delta = Number(body.delta ?? 1);
  if (!["A", "B"].includes(team)) return bad("team must be 'A' or 'B'");
  if (!Number.isFinite(delta)) return bad("delta must be a number");

  // Load current match
  const cur = await ddb.send(
    new GetCommand({ TableName: MATCHES_TABLE, Key: { matchId } })
  );
  if (!cur.Item) return bad("Match not found", 404);
  if (cur.Item.status !== "LIVE") return bad("Match is not LIVE");

  const field = team; // "A" or "B"
  const current = (cur.Item.score?.[field] ?? 0);
  const next = Math.max(0, current + delta);

  // Update exact value + updatedAt
  const updated = await ddb.send(
    new UpdateCommand({
      TableName: MATCHES_TABLE,
      Key: { matchId },
      UpdateExpression:
        "SET #score.#f = :val, updatedAt = :now",
      ExpressionAttributeNames: {
        "#score": "score",
        "#f": field, // dynamic "A" or "B"
      },
      ExpressionAttributeValues: {
        ":val": next,
        ":now": Date.now(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return ok(updated.Attributes);
};

/** POST /matches/{matchId}/finalize */
export const finalize = async (event) => {
  const matchId = event?.pathParameters?.matchId;
  if (!matchId) return bad("matchId path param required");

  // Ensure it exists
  const cur = await ddb.send(
    new GetCommand({ TableName: MATCHES_TABLE, Key: { matchId } })
  );
  if (!cur.Item) return bad("Match not found", 404);
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
};

/* helpers */
const ok = (data, statusCode = 200) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(data),
});
const bad = (msg, code = 400) => ok({ error: msg }, code);
