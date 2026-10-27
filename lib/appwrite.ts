import { Client, Account, OAuthProvider } from "appwrite";

export const client = new Client()
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      "https://fra.cloud.appwrite.io/v1",
  )
  .setProject(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6adc6d53003aa48fb063",
  );

export const account = new Account(client);
export { OAuthProvider };
