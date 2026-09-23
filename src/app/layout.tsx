import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { Sidebar } from "../app/layout/Sidebar";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="font-secondary text-text-main bg-card-bg antialiased flex min-h-screen w-full">
        
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {children}
        </div>

      </body>
    </html>
  );
}