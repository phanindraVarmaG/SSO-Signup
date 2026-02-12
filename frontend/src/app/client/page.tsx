"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page2() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login?redirect=/client/about");
    } else {
      router.replace("/client/about");
    }
  }, [router]);
  return null;
}
