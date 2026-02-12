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
  const [showPassword, setShowPassword] = useState(false);
  const [showLdapPassword, setShowLdapPassword] = useState(false);

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
            password: ldapPassword,
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
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("isAdmin", data.user?.isAdmin ? "true" : "false");
      
      const params = new URLSearchParams(window.location.search);
      let redirect = params.get("redirect");
      
      // If no redirect specified, send admins to admin portal, others to client portal
      if (!redirect) {
        redirect = data.user?.isAdmin ? "/admin/about" : "/client/about";
      } else if (redirect.includes("/admin") && !data.user?.isAdmin) {
        // Non-admin users trying to access admin portal, redirect to client
        redirect = "/client/about";
      }
      
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Get intended redirect from URL (if any)
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "admin/about";
    // Redirect to backend Google OAuth endpoint with redirect param
    window.location.href = `http://localhost:4000/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>SSO Login</h1>

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
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.inputSuffix}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.13 19.13 14.13 19.8 12 19.8C7.58 19.8 4.11 16.36 2.46 14.36C1.81 13.54 1.81 12.46 2.46 11.64C3.13 10.8 4.11 9.64 5.36 8.64M9.53 9.53C10.07 9.19 10.77 9 12 9C14.21 9 16 10.79 16 13C16 14.23 15.81 14.93 15.47 15.47M12 15C13.1 15 14 14.1 14 13C14 11.9 13.1 11 12 11C10.9 11 10 11.9 10 13C10 14.1 10.9 15 12 15ZM3 3L21 21" stroke="#777777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z" stroke="#777777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#777777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}  
                  </button>
                </div>
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
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="ldapPassword"
                    type={showLdapPassword ? "text" : "password"}
                    value={ldapPassword}
                    onChange={(e) => setLdapPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your domain password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.inputSuffix}
                    onClick={() => setShowLdapPassword((v) => !v)}
                    tabIndex={-1}
                    title={showLdapPassword ? "Hide password" : "Show password"}
                  >
                    {showLdapPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.13 19.13 14.13 19.8 12 19.8C7.58 19.8 4.11 16.36 2.46 14.36C1.81 13.54 1.81 12.46 2.46 11.64C3.13 10.8 4.11 9.64 5.36 8.64M9.53 9.53C10.07 9.19 10.77 9 12 9C14.21 9 16 10.79 16 13C16 14.23 15.81 14.93 15.47 15.47M12 15C13.1 15 14 14.1 14 13C14 11.9 13.1 11 12 11C10.9 11 10 11.9 10 13C10 14.1 10.9 15 12 15ZM3 3L21 21" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading
              ? "Logging in..."
              : loginMode === "email"
                ? "Login with Email"
                : "Login with LDAP"}
          </button>
        </form>
        {/* Google Sign-In Button */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          className={styles.googleOpenIdButton}
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
        <button
          onClick={() => window.location.href = "http://localhost:4000/auth/google-drive-gmail"}
          className={styles.googleDriveButton}
          type="button"
          style={{ marginTop: "1rem" }}
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
          Login with Google for Drive Access
        </button>

        <p className={styles.link}>
          Don't have an account? <Link href="/register">Register here</Link>
        </p>
        {/* <p className={styles.link}>
          Enterprise user? <Link href="/ldap">LDAP Login</Link>
        </p> */}
        <p className={styles.link}>
          Want an enterprise account? <Link href="/ldap/register">Register LDAP User</Link>
        </p>
      </div>
    </div>
  );
}
