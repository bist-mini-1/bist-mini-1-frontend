"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyProfile, getFollowCount, getMyProfileImage } from "../../api/mypageApi";
import { getBackendAbsoluteUrl } from "../../utils/urlUtils";
import { getMemberIdFromToken } from "../../utils/tokenUtils";

const NAV = [
  { href: "/Mypage/character", label: "캐릭터 성장", icon: "bi-person-badge-fill" },
  { href: "/Mypage/grass",     label: "잔디",        icon: "bi-calendar2-check-fill" },
  { href: "/Mypage/posts",     label: "게시글 조회", icon: "bi-collection-fill" },
  { href: "/Mypage/profile",   label: "설정",        icon: "bi-sliders2" },
];

export default function MyPageLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [nickname, setNickname]     = useState("");
  const [avatarUrl, setAvatarUrl]   = useState(null);
  const [followCount, setFollowCount] = useState({ followerCount: 0, followingCount: 0 });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    // 팔로워/팔로잉 수 조회 + 초기 닉네임/아바타 세팅
    const init = async () => {
      setNickname(localStorage.getItem("nickname") || "");
      try {
        const blob = await getMyProfileImage();
        setAvatarUrl(URL.createObjectURL(blob));
      } catch (e) {
        setAvatarUrl(null);
      }

      const mid = getMemberIdFromToken(token);
      if (mid) {
        try {
          const counts = await getFollowCount(mid);
          if (counts) setFollowCount(counts);
        } catch {
          // 조회 실패 시 기본값 유지
        }
      }

      try {
        const blob = await getMyProfileImage();
        setAvatarUrl(URL.createObjectURL(blob));
      } catch (e) {
        setAvatarUrl(null);
      }

      // 프로필 정보 추가 동기화 (실패해도 무시)
      try {
        await getMyProfile();
      } catch {
        // 무시
      }
    };
    init();

    const fetchImg = async () => {
      try {
        const blob = await getMyProfileImage();
        setAvatarUrl(URL.createObjectURL(blob));
      } catch (e) {
        setAvatarUrl(null);
      }
    };

    const sync = () => {
      setNickname(localStorage.getItem("nickname") || "");
      fetchImg();
    };

    // 팔로우 상태 변경 시 숫자 다시 불러오기
    const handleFollowChange = async () => {
      const mid = getMemberIdFromToken(token);
      if (mid) {
        try {
          const counts = await getFollowCount(mid);
          if (counts) setFollowCount(counts);
        } catch (e) { console.error(e); }
      }
    };

    window.addEventListener("authChanged", sync);
    window.addEventListener("followChanged", handleFollowChange);
    return () => {
      window.removeEventListener("authChanged", sync);
      window.removeEventListener("followChanged", handleFollowChange);
    };
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
          <div style={{ width: 58, height: 58, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.5)", marginBottom: 10, margin: "0 auto 10px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="프로필"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white" }}>
                {nickname ? nickname.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            {nickname || "사용자"}
          </div>

          {/* 팔로워 / 팔로잉 숫자 — 클릭 시 목록 페이지로 이동 */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: 12, 
            marginBottom: 6,
            background: "rgba(0,0,0,0.1)",
            padding: "10px 6px",
            borderRadius: 14
          }}>
            <Link href="/Mypage/followers" style={{ flex: 1, textAlign: "center", textDecoration: "none", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "brightness(1)"; }}
            >
              <div style={{ color: "white", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                {followCount.followerCount}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 4, fontWeight: 500 }}>팔로워</div>
            </Link>
            <div style={{ width: 1, background: "rgba(255,255,255,0.15)", alignSelf: "stretch" }} />
            <Link href="/Mypage/followings" style={{ flex: 1, textAlign: "center", textDecoration: "none", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "brightness(1)"; }}
            >
              <div style={{ color: "white", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                {followCount.followingCount}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 4, fontWeight: 500 }}>팔로잉</div>
            </Link>
          </div>

        </div>

        {/* 메뉴 */}
        <nav style={{ padding: "14px 10px 20px" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
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
                {icon.startsWith("bi-")
                  ? <i className={`bi ${icon}`} style={{ fontSize: 16, width: 18, textAlign: "center" }} />
                  : <span style={{ fontSize: 17 }}>{icon}</span>
                }
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
