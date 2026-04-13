import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Suspense } from "react";

import { LoginSuccessToast, ToastProvider } from "@/shared/ui";

import "./globals.css";

const fontBody = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const fontDisplay = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Support — панель",
  description: "Админ-панель поддержки Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${fontBody.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider />
        <Suspense fallback={null}>
          <LoginSuccessToast />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
