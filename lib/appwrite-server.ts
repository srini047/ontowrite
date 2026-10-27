import "server-only";
import { Client, TablesDB } from "node-appwrite";

export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const tablesDB = new TablesDB(client);
export const DATABASE_ID = "onto_main";
