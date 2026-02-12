"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("access_token");

    if (token) {
      router.push("admin/about");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <h1>Welcome to SSO Demo</h1>
        <p>Choose an application to access:</p>
        <div style={{ marginTop: 32 }}>
          <Link
            href="/page1"
            style={{ marginRight: 24, fontSize: "1.2rem" }}
          >
            Go to Application 1
          </Link>
          <Link href="/page2" style={{ fontSize: "1.2rem" }}>
            Go to Application 2
          </Link>
        </div>
      </div>
    </main>
  );
}
