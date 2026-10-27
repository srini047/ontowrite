"use client";

import { account } from "@/lib/appwrite";
import { useEffect } from "react";

export default function AuthSuccessPage() {
  useEffect(() => {
    async function handleOAuthSuccess() {
      const url = new URL(window.location.href);
      const secret = url.searchParams.get("secret");
      const userId = url.searchParams.get("userId");
      if (!secret || !userId) return window.location.assign("/auth/failure");
      await account.createSession({ userId, secret });
      window.location.assign("/dashboard");
    }
    handleOAuthSuccess();
  }, []);
  return <p>Signing you in...</p>;
}
