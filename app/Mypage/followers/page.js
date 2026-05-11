"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFollowers } from "../../../api/mypageApi";
import { getMemberIdFromToken } from "../../../utils/tokenUtils";

const GREEN = "#3cb878";
const GREEN_DARK = "#2e7d32";

export default function FollowersPage() {
  const router = useRouter();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    const load = async () => {
      try {
        let memberId = localStorage.getItem("memberId");
        if (!memberId) {
          memberId = getMemberIdFromToken(token);
          if (memberId) localStorage.setItem("memberId", memberId);
        }
        if (!memberId) {
          setError("사용자 정보를 불러올 수 없습니다. 다시 로그인해 주세요.");
          setLoading(false);
          return;
        }
        const res = await getFollowers(memberId);
        setUsers(res?.users ?? []);
      } catch (e) {
        setError("팔로워 목록을 불러오는 중 오류가 발생했습니다.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-people-fill" style={{ color: GREEN }} />
          팔로워
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>나를 팔로우하는 사람들이에요</p>
      </div>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} />
      ) : users.length === 0 ? (
        <EmptyState text="아직 팔로워가 없어요" sub="다른 사람들과 소통해 보세요!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((user) => <UserCard key={user.memberId} user={user} badge="팔로워" />)}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, badge }) {
  const router = useRouter();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      background: "white", borderRadius: 14,
      border: "1.5px solid #e9ecef",
      padding: "14px 18px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      transition: "all 0.15s",
      cursor: "pointer",
    }}
      onClick={() => router.push(`/Mypage/user/${user.memberId}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5d6a7"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(46,125,50,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e9ecef"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
    >
      {user.profileImage ? (
        <Image src={user.profileImage} alt={user.nickname} width={46} height={46} unoptimized
          style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #a5d6a7", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white", border: "2px solid #a5d6a7" }}>
          {user.nickname?.charAt(0).toUpperCase() ?? "U"}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{user.nickname}</div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>SLog 멤버</div>
      </div>

      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#e8f5e9", color: GREEN_DARK, border: "1px solid #a5d6a7" }}>
        {badge}
      </span>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, background: "#f0f0f0", borderRadius: 6, width: "30%", marginBottom: 6 }} />
            <div style={{ height: 11, background: "#f0f0f0", borderRadius: 6, width: "20%" }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function EmptyState({ text, sub }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "48px 20px", textAlign: "center" }}>
      <i className="bi bi-people" style={{ fontSize: 48, color: "#ddd", display: "block", marginBottom: 12 }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "#555", margin: "0 0 6px" }}>{text}</p>
      <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>{sub}</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ background: "#fff5f5", borderRadius: 14, border: "1.5px solid #ffcdd2", padding: "24px 20px", textAlign: "center", color: "#c62828", fontSize: 14 }}>
      ⚠️ {message}
    </div>
  );
}
