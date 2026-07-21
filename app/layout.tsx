import type { Metadata } from "next";
import { Anton, Oswald, Archivo } from "next/font/google";
import "./globals.css";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { AuthProvider } from "@/components/providers/AuthProvider";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GreekGodBerry | 333 Nights of Fire",
  description:
    "GreekGodBerry's community platform — earn HellCatCoins, join live stream games, climb the leaderboard, and win giveaways.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${oswald.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ChromeGate>{children}</ChromeGate>
        </AuthProvider>
      </body>
    </html>
  );
}
