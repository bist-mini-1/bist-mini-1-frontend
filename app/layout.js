import { Geist, Geist_Mono } from "next/font/google";
import BootstrapClient from "../components/layout/BootstrapClient";
import AppHeader from "../components/layout/AppHeader";
import ChatWidget from "../components/chat/ChatWidget";
import "./globals.css";

import "@/styles/buttons.css";
import "@/styles/home.css";
import "@/styles/pagination.css";
import "@/styles/search.css";
import "@/styles/auth.css";
import "@/styles/post.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SLog",
  description: "학습 기록 공유 커뮤니티",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <BootstrapClient />

        <div className="d-flex flex-column min-vh-100">
          <AppHeader />

          <main className="flex-grow-1">
            <div className="container py-4">
              {children}
            </div>
          </main>

          <ChatWidget />
        </div>
      </body>
    </html>
  );
}