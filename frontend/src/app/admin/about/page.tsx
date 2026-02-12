
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import styles from "./page.module.css";

export default function AdminAbout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const accessToken = searchParams.get("access_token");
    const isAdminParam = searchParams.get("isAdmin");
    
    if (urlToken) {
      localStorage.setItem("access_token", urlToken);
      if (isAdminParam !== null) {
        localStorage.setItem("isAdmin", isAdminParam);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      if (isAdminParam !== null) {
        localStorage.setItem("isAdmin", isAdminParam);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login?redirect=/admin/about");
      return;
    }
    
    // Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      // Non-admin users cannot access admin portal
      router.replace("/client/about");
    }
  }, [router, searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isAdmin");
    router.replace("/login");
  };

  // Navigate to /client/about (SSO: token will be checked there)
  const handleSwitchToClient = () => {
    router.push("/client/about");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: "#2d3748" }}>Admin Portal</span>
          <span style={{ fontSize: 14, color: "#888" }}>| About</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Switch to Client Icon */}
          <button
            onClick={handleSwitchToClient}
            title="Switch to Client Portal"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
          >
            {/* User icon or app icon */}
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#e0e7ff" />
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.31 0-6 1.34-6 3v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1c0-1.66-2.69-3-6-3z" fill="#6366f1" />
            </svg>
            <span style={{ fontSize: 13, color: "#6366f1", marginLeft: 4 }}>Client Portal</span>
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0.5rem 1.2rem",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main style={{ maxWidth: 700, margin: "2.5rem auto 0", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px 0 rgba(0,0,0,0.04)", padding: "2.5rem 2rem" }}>
        <h1 style={{ color: "#2d3748", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>About the Admin Portal</h1>
        <p style={{ color: "#4b5563", fontSize: 18, marginBottom: 32 }}>
          Welcome to the Admin Portal! This is a modern SSO-enabled dashboard. You are securely logged in and can access all admin features. Use the icon in the header to switch to the Client Portal (SSO will be used).
        </p>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Admin Portal" style={{ borderRadius: 10, maxWidth: "100%", boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)" }} />
        </div>
        <div style={{ color: "#6366f1", fontWeight: 500, fontSize: 16, textAlign: "center" }}>
          &copy; 2026 Admin Portal. All rights reserved.
        </div>
      </main>
    </div>
  );
}
