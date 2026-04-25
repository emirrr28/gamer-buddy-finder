import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Queue",
  description: "Find compatible players and short-lived lobbies for the games you actually play."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
