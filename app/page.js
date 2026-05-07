"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const { authInfo } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get("/api/posts");
        const list = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
        setPosts(list);
      } catch {
        /* API 미구현 시 빈 배열 */
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div>
      {/* 상단 배너 */}
      <div
        style={{
          textAlign: "center",
          padding: "28px 0 32px",
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 800, color: "#2e7d32" }}>
            SLog
          </span>
          <span style={{ fontSize: 22 }}>📚</span>
        </div>
        <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px" }}>
          학습 기록을 공유하고 함께 성장해요
        </p>
        {!authInfo.isLogin && (
          <Link
            href="/login"
            style={{
              background: "linear-gradient(135deg, #3cb878, #2e7d32)",
              color: "white",
              padding: "9px 28px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            시작하기
          </Link>
        )}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 48, fontSize: 14 }}>
          불러오는 중…
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "52px 24px",
            background: "#fafafa",
            borderRadius: 16,
            border: "1.5px dashed #e0e0e0",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 14 }}>📝</div>
          <div style={{ fontWeight: 600, color: "#444", marginBottom: 6 }}>
            아직 작성된 글이 없어요.
          </div>
          <div style={{ fontSize: 13, color: "#aaa" }}>
            {authInfo.isLogin ? (
              <Link href="/Mypage" style={{ color: "#3cb878", fontWeight: 600 }}>
                첫 번째 글을 작성해 보세요! →
              </Link>
            ) : (
              <Link href="/login" style={{ color: "#3cb878", fontWeight: 600 }}>
                로그인하고 첫 글을 써보세요! →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        border: "1.5px solid #e9ecef",
        padding: "18px 20px",
        cursor: "pointer",
        transition: "box-shadow 0.18s, border-color 0.18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "#3cb878";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e9ecef";
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "#222",
          marginBottom: 6,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
        }}
      >
        {post.title || "제목 없음"}
      </div>
      {post.content && (
        <div
          style={{
            fontSize: 12,
            color: "#888",
            lineHeight: 1.6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            marginBottom: 12,
          }}
        >
          {post.content}
        </div>
      )}
      {post.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                background: "#f0f9f0",
                color: "#2e7d32",
                borderRadius: 99,
                padding: "2px 8px",
                fontWeight: 500,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#bbb", display: "flex", gap: 10 }}>
        {post.nickname && <span>✍️ {post.nickname}</span>}
        {post.createdAt && (
          <span>🕐 {new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
        )}
        {post.viewCount != null && <span>👁 {post.viewCount}</span>}
        {post.likeCount != null && <span>🤍 {post.likeCount}</span>}
      </div>
    </div>
  );
}
