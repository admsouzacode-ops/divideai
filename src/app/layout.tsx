import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DivideAí - Divida contas de forma justa",
  description:
    "O divisor de contas inteligente e brasileiro. Perfeito para churrasco, festas e contas do dia a dia. Compartilhe no WhatsApp!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DivideAí",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF7ED" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1917" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-dvh bg-background text-foreground">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
