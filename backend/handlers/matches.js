import { ddb } from "../utils/dynamo.js";
import { PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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
  };
  await ddb.send(new PutCommand({ TableName: MATCHES_TABLE, Item: match }));
  return ok(match, 201);
};

/** GET /matches?clubId=... */
export const list = async (event) => {
  const clubId = event?.queryStringParameters?.clubId;
  if (!clubId) return bad("clubId query param required");
  const res = await ddb.send(new QueryCommand({
    TableName: MATCHES_TABLE,
    IndexName: "byClub",
    KeyConditionExpression: "clubId = :c",
    ExpressionAttributeValues: { ":c": clubId },
  }));
  return ok(res.Items || []);
};

/* helpers */
const ok = (data, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(data),
});
const bad = (msg, code = 400) => ok({ error: msg }, code);
