import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeInitScript } from "@/components/ThemeToggle";
import { THEME_COOKIE } from "@/lib/ui-prefs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexa Bug Tracker",
  description: "Gestión de tickets de bugs para el equipo QA de Nexa Consulting TI",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // El tema elegido se guarda en cookie: así el servidor ya pinta la página en
  // oscuro y ningún refresco de React le quita la clase "dark".
  const theme = (await cookies()).get(THEME_COOKIE)?.value;

  return (
    // suppressHydrationWarning: sin cookie, ThemeInitScript puede añadir "dark"
    // (tema del sistema) antes de hidratar. Solo silencia los atributos de <html>.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
