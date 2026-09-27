import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { AppShell } from "./layout/AppShell";
import { verifySession } from "../lib/auth";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Laboratorios Sistemas Informatica UMSS",
  description: "Plataforma de formación continua",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  const initialUser = session
    ? {
        ci: session.sub,
        email: session.email,
        role: session.role,
        nombre: session.nombre,
      }
    : null;

  return (
    <html lang="es" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="font-secondary text-text-main bg-card-bg antialiased flex min-h-screen w-full">
        <AuthProvider initialUser={initialUser}>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
