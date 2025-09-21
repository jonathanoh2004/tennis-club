// backend/handlers/clubs_delete.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

// If you already have a shared DDB client helper, you can replace this with it.
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CLUBS_TABLE = process.env.CLUBS_TABLE;
const MATCHES_TABLE = process.env.MATCHES_TABLE;

// GSI name you already use to list matches by club
const MATCHES_BY_CLUB_GSI = "byClub";

exports.handler = async (event) => {
  try {
    const clubId = event.pathParameters?.clubId;
    if (!clubId) {
      return { statusCode: 400, body: JSON.stringify({ message: "clubId required" }) };
    }

    // --- Cascade delete matches for this club (best-effort) ---
    const res = await ddb.send(new QueryCommand({
      TableName: MATCHES_TABLE,
      IndexName: MATCHES_BY_CLUB_GSI,
      KeyConditionExpression: "clubId = :c",
      ExpressionAttributeValues: { ":c": clubId },
      ProjectionExpression: "matchId",
    }));

    const items = res.Items || [];
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      if (chunk.length === 0) continue;
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [MATCHES_TABLE]: chunk.map((m) => ({
            DeleteRequest: { Key: { matchId: m.matchId } },
          })),
        },
      }));
    }

    // --- Delete the club itself ---
    await ddb.send(new DeleteCommand({
      TableName: CLUBS_TABLE,
      Key: { clubId },
      ConditionExpression: "attribute_exists(clubId)",
    }));

    return { statusCode: 204, body: "" };
  } catch (err) {
    const code =
      err.name === "ConditionalCheckFailedException" ? 404 : 500;
    return { statusCode: code, body: JSON.stringify({ message: err.message }) };
  }
};
