// handlers/users.js
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { requireUser } from '../utils/auth.js';

const ddb = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE;

export const getMe = async (event) => {
  try {
    const user = await requireUser(event);
    const getRes = await ddb.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ userId: user.sub }),
    }));

    if (!getRes.Item) {
      const item = { userId: user.sub, email: user.email, username: user.username, displayName: user.username, createdAt: Date.now() };
      await ddb.send(new PutItemCommand({ TableName: USERS_TABLE, Item: marshall(item) }));
      return ok(item);
    }

    return ok(unmarshall(getRes.Item));
  } catch (e) { return bad(e.statusCode || 500, { message: e.message }); }
};

export const updateProfile = async (event) => {
  try {
    const user = await requireUser(event);
    const body = JSON.parse(event.body || '{}');
    const displayName = (body.displayName || '').trim();
    if (!displayName) return bad(400, { message: 'displayName required' });

    const res = await ddb.send(new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ userId: user.sub }),
      UpdateExpression: 'SET displayName = :n, updatedAt = :t',
      ExpressionAttributeValues: marshall({ ':n': displayName, ':t': Date.now() }),
      ReturnValues: 'ALL_NEW',
    }));

    return ok(unmarshall(res.Attributes));
  } catch (e) { return bad(e.statusCode || 500, { message: e.message }); }
};

// small response helpers
function ok(body, statusCode = 200) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) };
}
function bad(statusCode, body) { return ok(body, statusCode); }
