import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Notas",
  description: "Recados pessoais para levar informação de um lugar a outro.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Evita que o teclado virtual (Android) cubra o composer em vez de
  // encolher a área de conteúdo — sem isso a caixa de texto fica cortada.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-dvh antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
