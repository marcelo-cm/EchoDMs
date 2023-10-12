import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@radix-ui/themes/styles.css";
import { Theme, Card, ThemePanel } from "@radix-ui/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EchoDMs",
  description: "Connect with everyone, with one command.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme grayColor="sand" radius="large" scaling="95%">
          {children}
          {/* <ThemePanel /> */}
        </Theme>
      </body>
    </html>
  );
}
