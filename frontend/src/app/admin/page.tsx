"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page2() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login?redirect=/admin/about");
    } else {
      router.replace("/admin/about");
    }
  }, [router]);
  return null;
}
