"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostList from "../../../components/posts/PostList";
import { getMyPosts, getBookmarkedPosts } from "../../../api/mypageApi";

const GREEN = "#2f8f5b";
const GREEN_DARK = "#26744a";

const TABS = [
  { key: "my",       label: "내가 쓴 글",  icon: "bi-pen-fill" },
  { key: "bookmark", label: "북마크한 글", icon: "bi-bookmark-heart-fill" },
];

/** MyPostResponse → PostCard가 기대하는 형태로 변환 */
function adaptPost(post, isBookmarked = false) {
  const rawText = post.content
    ? post.content.replace(/(<([^>]+)>)/gi, "").trim()
    : "";

  return {
    postId:         post.postId,
    title:          post.title || "(제목 없음)",
    contentPreview: rawText.slice(0, 120) || "내용 미리보기가 없습니다.",
    thumbnailUrl:   post.thumbnailUrl ?? null,
    likeCount:      post.likeCount ?? 0,
    commentCount:   post.commentCount ?? 0,
    viewCount:      post.viewCount ?? 0,
    createdAt:      post.createdAt,
    tags:           post.tags ?? [],
    nickname:       post.nickname ?? "나",
    isLiked:        post.isLiked ?? false,
    isBookmarked:   post.isBookmarked ?? isBookmarked,
  };
}

export default function PostsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my");
  const [myPosts, setMyPosts]               = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mine, bookmarked] = await Promise.all([
          getMyPosts(),
          getBookmarkedPosts(),
        ]);
        setMyPosts(mine.map((p) => adaptPost(p, false)));
        setBookmarkedPosts(bookmarked.map((p) => adaptPost(p, true)));
      } catch {
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const posts = activeTab === "my" ? myPosts : bookmarkedPosts;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-collection-fill" style={{ color: GREEN }} />
          게시글 조회
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>내가 쓴 글과 북마크한 글을 확인해요</p>
      </div>

      {/* 탭 */}
      <div style={{
        display: "flex",
        gap: 6,
        marginBottom: 24,
        background: "#f5f5f5",
        borderRadius: 12,
        padding: 5,
        width: "fit-content",
      }}>
        {TABS.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                background: active
                  ? `${GREEN}`
                  : "transparent",
                color: active ? "white" : "#666",
                transition: "all 0.15s",
                boxShadow: active ? "0 2px 8px rgba(46,125,50,0.25)" : "none",
              }}
            >
              <i className={`bi ${icon}`} style={{ fontSize: 14 }} />
              {label}
              <span style={{
                marginLeft: 2,
                background: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.1)",
                color: active ? "white" : "#666",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                minWidth: 22,
                textAlign: "center",
              }}>
                {key === "my" ? myPosts.length : bookmarkedPosts.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 컨텐츠 */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <PostList
          posts={posts}
          emptyMessage={
            activeTab === "my"
              ? "아직 작성한 게시글이 없어요 ✏️"
              : "북마크한 게시글이 없어요 🔖"
          }
        />
      )}
    </div>
  );
}

/* ── 로딩 스켈레톤 ── */
function LoadingState() {
  return (
    <div className="row">
      {[1, 2, 3, 4].map((i) => (
        <div className="col-sm-6 col-lg-4 col-xl-3 mb-4" key={i}>
          <div className="card border-0 h-100" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            <div style={{ height: 160, background: "#f0f0f0", borderRadius: "8px 8px 0 0" }} />
            <div className="card-body">
              <div style={{ height: 14, background: "#f0f0f0", borderRadius: 6, width: "60%", marginBottom: 10 }} />
              <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, width: "90%", marginBottom: 6 }} />
              <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, width: "40%" }} />
            </div>
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

/* ── 에러 ── */
function ErrorState({ message }) {
  return (
    <div style={{
      background: "#fff5f5",
      borderRadius: 14,
      border: "1.5px solid #ffcdd2",
      padding: "24px 20px",
      textAlign: "center",
      color: "#c62828",
      fontSize: 14,
    }}>
      ⚠️ {message}
    </div>
  );
}
