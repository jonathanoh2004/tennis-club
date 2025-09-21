// backend/handlers/clubs_delete.js  (ESM)

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { noContent, bad } from "../utils/responses.js";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CLUBS_TABLE = process.env.CLUBS_TABLE;
const MATCHES_TABLE = process.env.MATCHES_TABLE;
// use the same env key as other handlers do
const MATCHES_BY_CLUB_GSI = process.env.MATCHES_BY_CLUB_INDEX || "byClubV2";

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;

  try {
    const clubId = event.pathParameters?.clubId;
    if (!clubId) return bad(400, "clubId required", origin);

    // 1) Delete all matches for this club (25-per-batch)
    const res = await ddb.send(
      new QueryCommand({
        TableName: MATCHES_TABLE,
        IndexName: MATCHES_BY_CLUB_GSI,
        KeyConditionExpression: "clubId = :c",
        ExpressionAttributeValues: { ":c": clubId },
        ProjectionExpression: "matchId",
      })
    );

    const items = res.Items || [];
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      if (chunk.length === 0) continue;
      await ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [MATCHES_TABLE]: chunk.map((m) => ({
              DeleteRequest: { Key: { matchId: m.matchId } },
            })),
          },
        })
      );
    }

    // 2) Delete the club
    await ddb.send(
      new DeleteCommand({
        TableName: CLUBS_TABLE,
        Key: { clubId },
        ConditionExpression: "attribute_exists(clubId)",
      })
    );

    return noContent(origin);
  } catch (err) {
    const code =
      err?.name === "ConditionalCheckFailedException" ? 404 : 500;
    return bad(code, err?.message || "Internal error", origin);
  }
};
