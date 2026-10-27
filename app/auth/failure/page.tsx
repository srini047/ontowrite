"use client";

export default function AuthFailurePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "60vh",
        justifyContent: "center",
      }}
    >
      <h2>Sign-in failed</h2>
      <a
        href="/auth"
        style={{ marginTop: 24, color: "#15141f", textDecoration: "underline" }}
      >
        Back to sign in
      </a>
    </main>
  );
}
