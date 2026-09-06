import type { Metadata } from "next";
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
  metadataBase: new URL("https://admin.admajaskanifo.org"),

  // Tittle
  title: "Admin Admaja",
  description: "Dashboard Admin Admaja",

  // category
  category: "information",

  // Informasi pembuat
  authors: [{ name: "Nabil Arif", url: "https://appsporto.vercel.app" }],
  creator: "Nabil Arif",
  publisher: "Adika Mahdi Jaya",

  // Favicon dan icon untuk berbagai device
  icons: {
    icon: [
      { url: "/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icon/apple-touch-icon.png", // icon untuk iOS
  },

  openGraph: {
    title: "Dashboard Admin Admaja", // Judul saat di-share
    description: "Dashboard Admin Admaja", // Deskripsi saat di-share
    url: "https://admin.admajaskanifo.org", // URL utama
    siteName: "Admin Admaja",
    images: [
      {
        url: "/logo-v2.png", // Gambar preview
        width: 1200,
        height: 630,
        alt: "Preview Image",
      },
    ],
    locale: "id_ID", // Bahasa / region
    type: "website",
  },

  // Twitter Card (untuk share ke Twitter/X)
  twitter: {
    card: "summary_large_image", // tipe card
    title: "Dashboard Admin Admaja",
    description: "Dashboard Management System Milik Admaja",
    images: ["/logo-v2.png"],
    creator: "@n_apipppp",
  },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
