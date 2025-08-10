import { ddb } from "../utils/dynamo.js";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const CLUBS_TABLE = process.env.CLUBS_TABLE;

export const get = async () => {
  const res = await ddb.send(new ScanCommand({ TableName: CLUBS_TABLE }));
  return ok(res.Items || []);
};

export const create = async (event) => {
  const body = json(event.body);
  const club = { clubId: `club_${nanoid(8)}`, name: body.name || "Unnamed Club" };
  await ddb.send(new PutCommand({ TableName: CLUBS_TABLE, Item: club }));
  return ok(club, 201);
};

/* helpers */
const ok = (data, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(data),
});
const json = (b) => (b ? JSON.parse(b) : {});
