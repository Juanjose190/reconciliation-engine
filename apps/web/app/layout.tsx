import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reconciliation Ops",
  description: "Formance reconciliation operations dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
