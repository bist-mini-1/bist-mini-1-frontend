"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { getUserProfile, getUserPosts, getFollowCount, getMyFollowings, followUser, unfollowUser, checkIsMe } from "../../../../api/mypageApi";

const GREEN      = "#2f8f5b";
const GREEN_DARK = "#26744a";

export default function UserProfilePage() {
  const router   = useRouter();
  const { memberId } = useParams();

  const [profile,     setProfile]     = useState(null);
  const [posts,       setPosts]       = useState([]);
  const [followCount, setFollowCount] = useState({ followerCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMe,        setIsMe]        = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [followingAction, setFollowingAction] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }
    if (!memberId) return;

    const load = async () => {
      try {
        const [prof, postList, counts, meRes, myFollowings] = await Promise.all([
          getUserProfile(memberId),
          getUserPosts(memberId),
          getFollowCount(memberId),
          checkIsMe(memberId),
          getMyFollowings()
        ]);
        
        setProfile(prof);
        setPosts(postList);
        if (counts) setFollowCount(counts);
        setIsMe(meRes);
        
        if (myFollowings) {
          const isF = (myFollowings.users ?? []).some(u => String(u.memberId) === String(memberId));
          setIsFollowing(isF);
        }
      } catch (e) {
        console.error(e);
        setError("유저 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId, router]);

  const handleFollowToggle = async () => {
    if (followingAction) return;
    try {
      setFollowingAction(true);
      if (isFollowing) {
        await unfollowUser(memberId);
        setIsFollowing(false);
        setFollowCount(prev => ({ ...prev, followerCount: Math.max(0, prev.followerCount - 1) }));
        window.dispatchEvent(new Event("followChanged"));
      } else {
        await followUser(memberId);
        setIsFollowing(true);
        setFollowCount(prev => ({ ...prev, followerCount: prev.followerCount + 1 }));
        window.dispatchEvent(new Event("followChanged"));
      }
    } catch (err) {
      console.error(err);
      alert("요청 중 오류가 발생했습니다.");
    } finally {
      setFollowingAction(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (error)   return <ErrorState message={error} />;
  if (!profile) return null;

  const initial = profile.nickname?.charAt(0).toUpperCase() ?? "U";

  return (
    <div>
      {/* 뒤로가기 */}
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 13, marginBottom: 20, padding: 0 }}
      >
        <i className="bi bi-arrow-left" /> 돌아가기
      </button>

      {/* 프로필 카드 */}
      <div style={{
        background: "white", borderRadius: 16, border: "1.5px solid #e9ecef",
        padding: "32px 28px", marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        {/* 아바타 */}
        {profile.profileImageUrl ? (
          <Image src={profile.profileImageUrl} alt={profile.nickname} width={72} height={72} unoptimized
            style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid #a5d6a7", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "white", border: "3px solid #a5d6a7",
          }}>
            {initial}
          </div>
        )}

        {/* 정보 */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#222", marginBottom: 4 }}>
            {profile.nickname}
          </div>
          {profile.bio && (
            <div style={{ fontSize: 13, color: "#666", marginBottom: 10, lineHeight: 1.5 }}>
              {profile.bio}
            </div>
          )}
          {/* 팔로워/팔로잉 수 */}
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: GREEN_DARK }}>{followCount.followerCount}</div>
              <div style={{ fontSize: 11, color: "#888" }}>팔로워</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: GREEN_DARK }}>{followCount.followingCount}</div>
              <div style={{ fontSize: 11, color: "#888" }}>팔로잉</div>
            </div>
          </div>
        </div>

        {/* 팔로우 버튼 (내 프로필이 아닐 때만) */}
        {!isMe && (
          <button
            onClick={handleFollowToggle}
            disabled={followingAction}
            onMouseEnter={(e) => {
              if (isFollowing) {
                e.currentTarget.style.background = "#fff5f5";
                e.currentTarget.style.color = "#c62828";
                e.currentTarget.style.borderColor = "#ffcdd2";
                e.currentTarget.textContent = "언팔로우";
              } else {
                e.currentTarget.style.background = GREEN_DARK;
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(60,184,120,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (isFollowing) {
                e.currentTarget.style.background = "#f0f9f1";
                e.currentTarget.style.color = GREEN;
                e.currentTarget.style.borderColor = "#c8e6c9";
                e.currentTarget.textContent = "팔로잉";
              } else {
                e.currentTarget.style.background = GREEN;
                e.currentTarget.style.boxShadow = "none";
              }
            }}
            style={{
              padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              border: isFollowing ? "1.5px solid #c8e6c9" : "none",
              background: isFollowing ? "#f0f9f1" : GREEN,
              color: isFollowing ? GREEN : "white",
              minWidth: 100,
            }}
          >
            {isFollowing ? "팔로잉" : "팔로우"}
          </button>
        )}
      </div>

      {/* 게시글 목록 */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-collection-fill" style={{ color: GREEN }} />
          작성한 게시글
          <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>({posts.length}개)</span>
        </h3>
      </div>

      {posts.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "48px 20px", textAlign: "center" }}>
          <i className="bi bi-file-earmark-x" style={{ fontSize: 40, color: "#ddd", display: "block", marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: "#999", margin: 0 }}>아직 작성한 공개 게시글이 없어요</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map((post) => <PostCard key={post.postId} post={post} router={router} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, router }) {
  const preview = post.content?.replace(/<[^>]+>/g, "").slice(0, 100) ?? "";
  return (
    <div
      onClick={() => router.push(`/post/${post.postId}`)}
      style={{
        background: "white", borderRadius: 14,
        border: "1.5px solid #e9ecef", padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5d6a7"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(46,125,50,0.10)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e9ecef"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 6 }}>{post.title}</div>
      {preview && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 10, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {preview}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "#aaa" }}>
        <span><i className="bi bi-eye" /> {post.viewCount ?? 0}</span>
        <span><i className="bi bi-suit-heart" /> {post.likeCount ?? 0}</span>
        <span><i className="bi bi-chat" /> {post.commentCount ?? 0}</span>
        <span style={{ marginLeft: "auto" }}>
          {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ko-KR") : ""}
        </span>
      </div>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      <div style={{ height: 140, background: "white", borderRadius: 16, border: "1.5px solid #e9ecef", marginBottom: 20 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 90, background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", marginBottom: 10 }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
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
