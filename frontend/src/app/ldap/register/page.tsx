"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../register/register.module.css";

export default function LdapRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cn, setCn] = useState("");
  const [sn, setSn] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("http://localhost:4000/auth/ldap/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          cn,
          sn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "LDAP registration failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred during LDAP registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Register LDAP User</h1>
        <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "20px" }}>
          Create an enterprise LDAP account
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Username 
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Enter LDAP username (e.g., john.doe)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cn" className={styles.label}>
              Common Name 
            </label>
            <input
              id="cn"
              type="text"
              value={cn}
              onChange={(e) => setCn(e.target.value)}
              className={styles.input}
              placeholder="Enter full name (e.g., John Doe)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sn" className={styles.label}>
              Surname
            </label>
            <input
              id="sn"
              type="text"
              value={sn}
              onChange={(e) => setSn(e.target.value)}
              className={styles.input}
              placeholder="Enter surname (e.g., Doe)"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password 
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter LDAP password (min 6 characters)"
              required
              minLength={6}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && (
            <div style={{
              padding: "12px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "8px",
              fontSize: "14px",
              border: "1px solid #c3e6cb"
            }}>
              LDAP user registered successfully! Redirecting to login...
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading || success}>
            {loading ? "Creating LDAP account..." : success ? "Success!" : "Register LDAP User"}
          </button>
        </form>

        <p className={styles.link}>
          Already have an account? <Link href="/login">Login here</Link>
        </p>
        <p className={styles.link}>
          Need a regular account? <Link href="/register">Register with Email</Link>
        </p>
      </div>
    </div>
  );
}
