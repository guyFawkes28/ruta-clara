import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

export const connectMongo = async () => {
  await client.connect();
  const db = client.db("ruta-clara");
  return db;
};