"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ldapUsername, setLdapUsername] = useState("");
  const [ldapPassword, setLdapPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"email" | "ldap">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      
      if (loginMode === "ldap") {
        response = await fetch("http://localhost:4000/auth/ldap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            username: ldapUsername, 
            password: ldapPassword 
          }),
        });
      } else {
        response = await fetch("http://localhost:4000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token in localStorage
      localStorage.setItem("access_token", data.access_token);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = "http://localhost:4000/auth/google";
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>

   

        {/* Login Mode Toggle */}
        <div className={styles.toggleContainer}>
          <button
            type="button"
            className={`${styles.toggleButton} ${
              loginMode === "email" ? styles.toggleActive : ""
            }`}
            onClick={() => setLoginMode("email")}
          >
            Email Login
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${
              loginMode === "ldap" ? styles.toggleActive : ""
            }`}
            onClick={() => setLoginMode("ldap")}
          >
            LDAP Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {loginMode === "email" ? (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="ldapUsername" className={styles.label}>
                  Username
                </label>
                <input
                  id="ldapUsername"
                  type="text"
                  value={ldapUsername}
                  onChange={(e) => setLdapUsername(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your domain username"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ldapPassword" className={styles.label}>
                  Password
                </label>
                <input
                  id="ldapPassword"
                  type="password"
                  value={ldapPassword}
                  onChange={(e) => setLdapPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your domain password"
                  required
                />
              </div>
            </>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading 
              ? "Logging in..." 
              : loginMode === "email" 
                ? "Login with Email" 
                : "Login with LDAP"
            }
          </button>
        </form>
     {/* Google Sign-In Button */}
       <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          className={styles.googleButton}
          type="button"
        >
          <svg
            className={styles.googleIcon}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

      
        <p className={styles.link}>
          Don't have an account? <Link href="/register">Register here</Link>
        </p>
        {/* <p className={styles.link}>
          Enterprise user? <Link href="/ldap">LDAP Login</Link>
        </p> */}
      </div>
    </div>
  );
}
