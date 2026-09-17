import type { Metadata } from "next";
import { Luckiest_Guy, Fredoka } from "next/font/google";
import "./globals.css";

const luckiestGuy = Luckiest_Guy({
  variable: "--font-luckiest",
  weight: "400",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Noche de los 9",
  description: "Game show de cumpleaños — La Noche de los 9 + El Infiltrado",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${luckiestGuy.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-text-primary font-heading">{children}</body>
    </html>
  );
}
