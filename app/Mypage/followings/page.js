"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFollowings, unfollowUser } from "../../../api/mypageApi";
import { getMemberIdFromToken } from "../../../utils/tokenUtils";
import { getBackendAbsoluteUrl } from "../../../utils/urlUtils";
import Pagination from "../../../components/common/Pagination";

const GREEN      = "#2f8f5b";
const GREEN_DARK = "#26744a";
const PAGE_SIZE  = 10;

export default function FollowingsPage() {
  const router = useRouter();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page,          setPage]          = useState(1);

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
        const res = await getFollowings(memberId);
        
        // API가 {users: []} 형태인지 아니면 배열 [] 그 자체인지에 따라 유연하게 처리
        const followingList = Array.isArray(res) ? res : (res?.users ?? []);
        setUsers(followingList);
      } catch (e) {
        setError("팔로잉 목록을 불러오는 중 오류가 발생했습니다.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleUnfollowClick = (e, user) => {
    e.stopPropagation();
    setConfirm(user);
  };

  const handleUnfollowConfirm = async () => {
    if (!confirm) return;
    try {
      await unfollowUser(confirm.memberId);
      setUsers((prev) => prev.filter((u) => u.memberId !== confirm.memberId));
      showToast(confirm.nickname + "님 팔로잉을 취소했습니다.");
      window.dispatchEvent(new Event("followChanged"));
    } catch (e) {
      showToast("팔로잉 취소 중 오류가 발생했습니다.", true);
      console.error(e);
    } finally {
      setConfirm(null);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
    setPage(1);
  };

  const handleClear = () => {
    setSearchKeyword("");
    setPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 실시간 검색 필터링 + 페이지네이션
  const filteredUsers = users.filter((u) =>
    !searchKeyword.trim() || u.nickname.toLowerCase().includes(searchKeyword.trim().toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.isError ? "#c62828" : GREEN_DARK,
          color: "white", padding: "12px 24px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>
          {toast.isError ? "⚠️ " : "✓ "}{toast.msg}
        </div>
      )}

      {confirm && (
        <div onClick={() => setConfirm(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", borderRadius: 16, padding: "28px 32px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 300, textAlign: "center",
          }}>
            <i className="bi bi-person-dash-fill" style={{ fontSize: 32, color: "#e57373", display: "block", marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "#222", margin: "0 0 6px" }}>
              팔로잉을 정말 취소하겠습니까?
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 24px" }}>
              <strong>{confirm.nickname}</strong>님을 언팔로우합니다.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: "1.5px solid #e9ecef", background: "white",
                color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>취소</button>
              <button onClick={handleUnfollowConfirm} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                background: "#e57373", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>언팔로우</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 6 }}>
          <button onClick={() => router.push("/Mypage/character")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#666", fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 4,
          }}>
            <i className="bi bi-arrow-left" /> 돌아가기
          </button>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-person-check-fill" style={{ color: GREEN }} />
          팔로잉
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>내가 팔로우하는 사람들이에요</p>
      </div>

      {/* ── 검색 박스 ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "white", border: "1.5px solid #e9ecef",
          borderRadius: 10, padding: "8px 14px", gap: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}>
          <i className="bi bi-search" style={{ color: "#aaa", fontSize: 14 }} />
          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="닉네임으로 검색"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#333", background: "transparent" }}
          />
          {searchKeyword && (
            <button type="button" onClick={handleClear}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0, fontSize: 14 }}>
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>
        {searchKeyword && (
          <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>
            <strong style={{ color: "#333" }}>{searchKeyword}</strong> 검색 결과{" "}
            <strong style={{ color: GREEN }}>{filteredUsers.length}</strong>명
          </p>
        )}
      </div>

      {loading ? <SkeletonList />
        : error ? <ErrorState message={error} />
        : filteredUsers.length === 0 ? (
            searchKeyword
              ? <EmptyState text="검색 결과가 없어요" sub={`"${searchKeyword}"와 일치하는 팔로잉이 없습니다.`} />
              : <EmptyState text="아직 팔로우한 사람이 없어요" sub="관심 있는 사람을 팔로우해 보세요!" />
          )
        : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pagedUsers.map((user) => (
                <UserCard key={user.memberId} user={user} onUnfollowClick={handleUnfollowClick} />
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </>
        )
      }
    </div>
  );
}

function UserCard({ user, onUnfollowClick }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/Mypage/user/" + user.memberId)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5d6a7"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(46,125,50,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e9ecef"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        background: "white", borderRadius: 14, border: "1.5px solid #e9ecef",
        padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.15s", cursor: "pointer",
      }}
    >
      {user.profileImage ? (
        <Image src={getBackendAbsoluteUrl(user.profileImage)} alt={user.nickname} width={46} height={46} unoptimized
          style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #a5d6a7", flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "white", border: "2px solid #a5d6a7",
        }}>
          {user.nickname?.charAt(0).toUpperCase() ?? "U"}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{user.nickname}</div>
      </div>
      <button
        onClick={(e) => onUnfollowClick(e, user)}
        onMouseEnter={(e) => { 
          e.currentTarget.style.background = "#fff5f5"; 
          e.currentTarget.style.color = "#c62828"; 
          e.currentTarget.style.borderColor = "#ffcdd2"; 
          e.currentTarget.textContent = "언팔로우";
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.background = "#f0f9f1"; 
          e.currentTarget.style.color = GREEN; 
          e.currentTarget.style.borderColor = "#c8e6c9"; 
          e.currentTarget.textContent = "팔로잉";
        }}
        style={{
          fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20,
          background: "#f0f9f1", color: GREEN, border: "1.5px solid #c8e6c9",
          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
          flexShrink: 0,
        }}
      >
        팔로잉
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
          <div style={{ flex: 1 }}><div style={{ height: 14, background: "#f0f0f0", borderRadius: 6, width: "30%" }} /></div>
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function EmptyState({ text, sub }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "48px 20px", textAlign: "center" }}>
      <i className="bi bi-person-plus" style={{ fontSize: 48, color: "#ddd", display: "block", marginBottom: 12 }} />
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
