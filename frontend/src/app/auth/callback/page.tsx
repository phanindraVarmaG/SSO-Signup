"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Store the token
      localStorage.setItem("access_token", token);

      // Redirect to Application 1 About page
      router.push("admin/about");
    } else {
      setError("Authentication failed. No token received.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1 style={{ color: "#c33" }}>{error}</h1>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h1>Authenticating...</h1>
      <p>Please wait while we complete your sign-in.</p>
    </div>
  );
}
