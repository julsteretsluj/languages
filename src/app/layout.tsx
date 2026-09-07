import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProgressProvider } from "@/components/ProgressProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lingora — Learn languages & sign",
  description:
    "A calm Duolingo-style path for ASL, BSL, International Sign, NZSL, Māori, Mandarin, Latin, Dutch, and Spanish.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
