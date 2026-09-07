import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ProgressProvider } from "@/components/ProgressProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Lingora — Learn languages & sign",
  description:
    "A bright Duolingo-style path for ASL, BSL, International Sign, NZSL, Māori, Mandarin, Latin, Dutch, and Spanish.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
