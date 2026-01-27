"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

interface UserProfile {
  userId: string;
  email: string;
  username?: string;
  provider?: string;
  displayName?: string;
  department?: string;
  title?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:4000/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user profile");
      // If token is invalid, redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const [data, setData] = useState(null);
  const [protectedDataError, setProtectedDataError] = useState("");

  const fetchProtectedData = async () => {
    setProtectedDataError("");
    setData(null);
    try {
      const token = localStorage.getItem("access_token"); // Adjust if you store token elsewhere
      const res = await fetch("http://localhost:4000/test/protected-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.status === 200) setData(result.data);
      else setProtectedDataError(result.message || "Access denied");
    } catch (e) {
      setProtectedDataError("Error fetching data");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>{error}</div>
          <p className={styles.redirectText}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>

        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>User Profile</h2>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.label}>User ID:</span>
              <span className={styles.value}>{user?.userId}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{user?.email}</span>
            </div>

            {user?.username && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Username:</span>
                <span className={styles.value}>{user.username}</span>
              </div>
            )}

            {user?.provider && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Provider:</span>
                <span className={styles.value}>
                  <span
                    className={`${styles.badge} ${styles[user.provider.toLowerCase()]}`}
                  >
                    {user.provider.toUpperCase()}
                  </span>
                </span>
              </div>
            )}

            {user?.displayName && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Display Name:</span>
                <span className={styles.value}>{user.displayName}</span>
              </div>
            )}

            {user?.department && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Department:</span>
                <span className={styles.value}>{user.department}</span>
              </div>
            )}

            {user?.title && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Title:</span>
                <span className={styles.value}>{user.title}</span>
              </div>
            )}
          </div>

          <div className={styles.welcomeMessage}>
            Welcome back, <strong>{user?.displayName || user?.email}</strong>!
            {user?.provider === "ldap" && (
              <span className={styles.providerNote}>
                (Authenticated via LDAP)
              </span>
            )}
          </div>

          <button onClick={fetchProtectedData} className={styles.logoutButton}>
            Show Protected Data
          </button>
          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
          {protectedDataError && (
            <p style={{ color: "red" }}>{protectedDataError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
