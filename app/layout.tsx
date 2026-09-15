import type { Metadata } from "next";
import "./globals.css";
import {DeviceTimeProvider} from './device-time';

export const metadata: Metadata = {
  title: "Daylight — Your Daily News",
  description: "Your daily news feed: world headlines, technology, AI, and market coverage with original sources.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><DeviceTimeProvider>{children}</DeviceTimeProvider></body>
    </html>
  );
}
