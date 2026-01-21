import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSO Sign-In",
  description: "Single Sign-On Authentication Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
