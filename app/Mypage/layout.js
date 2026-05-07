"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/Mypage/character", label: "캐릭터 성장", icon: "🌱" },
  { href: "/Mypage/grass",     label: "잔디",        icon: "🔥" },
  { href: "/Mypage/profile",   label: "설정",  icon: "👤" },
];

export default function MyPageLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [nickname, setNickname]   = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    // 초기값을 localStorage에서 읽어서 세팅 (서버 렌더링 이후 클라이언트에서만 실행)
    setNickname(localStorage.getItem("nickname") || "");
    setAvatarUrl(localStorage.getItem("profileImageUrl") || null);

    const sync = () => {
      setNickname(localStorage.getItem("nickname") || "");
      setAvatarUrl(localStorage.getItem("profileImageUrl") || null);
    };
    window.addEventListener("authChanged", sync);
    return () => window.removeEventListener("authChanged", sync);
  }, [router]);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

      {/* ── 사이드바 ── */}
      <aside style={{
        width: 210,
        flexShrink: 0,
        background: "linear-gradient(175deg, #2e7d32 0%, #1b5e20 100%)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(46,125,50,0.25)",
        position: "sticky",
        top: 16,
      }}>
        {/* 프로필 요약 */}
        <div style={{ padding: "28px 20px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="프로필" width={58} height={58}
              style={{ borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.5)", marginBottom: 10 }} />
          ) : (
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white", margin: "0 auto 10px", border: "2.5px solid rgba(255,255,255,0.4)" }}>
              {nickname ? nickname.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
            {nickname || "사용자"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>SLog 멤버</div>
        </div>

        {/* 메뉴 */}
        <nav style={{ padding: "14px 10px 20px" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 10, marginBottom: 3,
                background: active ? "rgba(255,255,255,0.18)" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.65)",
                textDecoration: "none", fontSize: 13, fontWeight: active ? 700 : 400,
                borderLeft: active ? "3px solid #a5d6a7" : "3px solid transparent",
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 17 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── 콘텐츠 ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
