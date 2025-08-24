// backend/handlers/members.js
import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { requireUser } from "../utils/auth.js";
import { ok, bad } from "../utils/responses.js";

const ddb = new DynamoDBClient({});
const CLUB_MEMBERS_TABLE = process.env.CLUB_MEMBERS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

// POST /clubs/{clubId}/members  (auth user joins)
export const join = async (event) => {
  try {
    const { sub } = await requireUser(event);
    const clubId = event.pathParameters?.clubId;
    if (!clubId) return bad(400, { message: "clubId required" });

    await ddb.send(
      new PutItemCommand({
        TableName: CLUB_MEMBERS_TABLE,
        Item: marshall({ clubId, userId: sub, joinedAt: Date.now() }),
        ConditionExpression:
          "attribute_not_exists(clubId) AND attribute_not_exists(userId)",
      })
    );
    return ok({ ok: true });
  } catch (e) {
    if (e.name === "ConditionalCheckFailedException")
      return ok({ ok: true, alreadyMember: true });
    return bad(e.statusCode || 500, { message: e.message });
  }
};

// GET /clubs/{clubId}/members  (list display names for selection)
export const list = async (event) => {
  try {
    const clubId = event.pathParameters?.clubId;
    if (!clubId) return bad(400, { message: "clubId required" });

    const memRes = await ddb.send(
      new QueryCommand({
        TableName: CLUB_MEMBERS_TABLE,
        KeyConditionExpression: "clubId = :c",
        ExpressionAttributeValues: marshall({ ":c": clubId }),
      })
    );

    const members = memRes.Items?.map(unmarshall) || [];

    // Fetch basic user profiles (batch get)
    const { BatchGetItemCommand } = await import("@aws-sdk/client-dynamodb");
    const keys = members.map((m) => ({ userId: { S: m.userId } }));
    let profiles = [];
    if (keys.length) {
      const batch = new BatchGetItemCommand({
        RequestItems: { [USERS_TABLE]: { Keys: keys } },
      });
      const got = await ddb.send(batch);
      profiles = (got.Responses?.[USERS_TABLE] || []).map((item) =>
        unmarshall(item)
      );
    }

    const profileById = Object.fromEntries(profiles.map((p) => [p.userId, p]));
    const out = members.map((m) => {
      const p = profileById[m.userId] || {};
      return {
        userId: m.userId,
        displayName: p.displayName || p.username || m.userId,
        email: p.email || "",
      };
    });

    return ok({ items: out });
  } catch (e) {
    return bad(e.statusCode || 500, { message: e.message });
  }
};
