// backend/handlers/websocket.js
import { ddb } from "../utils/dynamo.js";
import {
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

/** $connect */
export const connect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const clubId = event?.queryStringParameters?.clubId || "global";

  await ddb.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: { connectionId, clubId, connectedAt: Date.now() },
    })
  );

  return { statusCode: 200 };
};

/** $disconnect */
export const disconnect = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await ddb.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );

  return { statusCode: 200 };
};

/** $default – renamed to onMessage to avoid reserved name */
export const onMessage = async (event) => {
  const { domainName, stage } = event.requestContext;
  const endpoint = `https://${domainName}/${stage}`;
  const ws = new ApiGatewayManagementApiClient({ endpoint });

  const body = safeJSON(event.body) || {};
  const clubId = body.clubId || "global";
  const message = body.message ?? { ping: true };

  // Query all connections for this club
  const res = await ddb.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: "byClub",
      KeyConditionExpression: "clubId = :c",
      ExpressionAttributeValues: { ":c": clubId },
    })
  );

  // Fanout
  await Promise.all(
    (res.Items ?? []).map(async ({ connectionId }) => {
      try {
        await ws.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(message)),
          })
        );
      } catch {
        // Ignore stale/broken connections; cleanup happens on $disconnect
      }
    })
  );

  return { statusCode: 200 };
};

function safeJSON(s) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
