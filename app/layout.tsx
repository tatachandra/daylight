import type { Metadata } from "next";
import "./globals.css";
import {DeviceTimeProvider} from './device-time';

export const metadata: Metadata = {
  title: "My Day Harbor — News, Wellbeing & Growth",
  description: "Your daily place for personalized news, fitness and nutrition, and communities for personal growth.",
  icons: {
    icon: {url: "/green-leaves-v2.png", type: "image/png"},
    shortcut: "/green-leaves-v2.png",
    apple: "/green-leaves-v2.png",
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
