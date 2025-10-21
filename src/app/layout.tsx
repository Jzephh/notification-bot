import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MUIThemeProvider from '@/components/MUIThemeProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Role Notification System",
  description: "A role-based notification system integrated with Whop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MUIThemeProvider>
          {children}
        </MUIThemeProvider>
      </body>
    </html>
  );
}