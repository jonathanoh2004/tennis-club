// backend/handlers/clubs.js
import { ddb } from "../utils/dynamo.js";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ok, bad } from "../utils/responses.js";
import { nanoid } from "nanoid";

const CLUBS_TABLE = process.env.CLUBS_TABLE;

export const get = async () => {
  try {
    const res = await ddb.send(new ScanCommand({ TableName: CLUBS_TABLE }));
    return ok(res.Items || []);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

export const create = async (event) => {
  try {
    const body = json(event.body);
    const club = {
      clubId: `club_${nanoid(8)}`,
      name: (body.name || "Unnamed Club").trim(),
    };
    await ddb.send(new PutCommand({ TableName: CLUBS_TABLE, Item: club }));
    return ok(club, 201);
  } catch (e) {
    return bad(500, { message: e.message || String(e) });
  }
};

/* helpers */
const json = (b) => (b ? JSON.parse(b) : {});
