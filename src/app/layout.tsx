import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://promptlab.vercel.app"),
  title: "PromptLab",
  description:
    "İsteğini kendi cümlelerinle yaz; seçtiğin yapay zeka aracına uygun, kullanıma hazır prompt üretir. Premium ile sınırsız kullanım.",
  openGraph: {
    title: "Prompt Lab - Video Prompt Generator",
    description:
      "AI Prompt Builder ve character continuity odaklı Prompt Lab ile video/görsel promptlarını daha hızlı üret.",
    type: "website",
    locale: "tr_TR",
    siteName: "Prompt Lab",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Prompt Lab - Video Prompt Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Lab - Video Prompt Generator",
    description:
      "AI Prompt Builder ve character continuity odaklı Prompt Lab ile video/görsel promptlarını daha hızlı üret.",
    images: ["/twitter-image"],
  },
};

const themeInitScript = `(function(){try{var k='promptlab-theme';var t=localStorage.getItem(k);var h=document.documentElement;if(t==='light'||t==='dark'){h.setAttribute('data-theme',t);h.style.colorScheme=t;}else{var m=window.matchMedia('(prefers-color-scheme: light)');h.setAttribute('data-theme',m.matches?'light':'dark');h.style.colorScheme=m.matches?'light':'dark';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${dmSans.className} antialiased pb-28`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
