import type { Metadata } from "next";
import { Mona_Sans, Geist_Mono } from "next/font/google";
import { WalletProvider } from "./components/WalletProvider";
import "./globals.css";

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geistmono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "gopadi // local errands, escrowed",
  description:
    "Post a local errand in a Nigerian university town. Lock USDC in Trustless Work escrow. Release on completion.",
  icons: {
    icon: [
      { url: "/gopadi-logo.svg", type: "image/svg+xml" },
      { url: "/gopadi-logo.png", type: "image/png", sizes: "1240x340" },
    ],
    shortcut: "/gopadi-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
