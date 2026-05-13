"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/formatDate";
import { togglePostLike, togglePostBookmark } from "@/api/postApi";
import useAuth from "@/hooks/useAuth";

import { getBackendAbsoluteUrl } from "@/utils/urlUtils";

const stripMarkdown = (text) => {
  if (!text) return "";
  return String(text)
    // 첨부 블록은 내부 텍스트까지 통째로 제거
    .replace(/<div[^>]*class=["']attachment-block["'][^>]*>[\s\S]*?<\/a>\s*<\/div>/gi, "")
    // 이스케이프된 첨부 블록도 함께 제거
    .replace(/&lt;div[^&]*class=["']attachment-block["'][^&]*&gt;[\s\S]*?&lt;\/a&gt;\s*&lt;\/div&gt;/gi, "")
    // 이스케이프된 HTML이 섞여 있어도 먼저 원형에 가깝게 복원
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
     // HTML 시작 조각이나 잘린 태그 조각 제거
     .replace(/<[^>\n]*(?:>|$)/g, "")
     // HTML 속성 조각이 남아 있으면 제거
     .replace(/\b(?:href|src|class|id|style|data-[\w-]+)=(?:"[^"]*"|'[^']*'|[^\s<>]+)/gi, "")
    // 이미지 / 링크 마크다운 제거
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    // 남아있는 HTML 태그 제거
    .replace(/<[^>]+>/g, "")
    // 혹시 다시 이스케이프 형태로 남은 태그 제거
    .replace(/&lt;[^&]+&gt;/g, "")
    // 마크다운 기호 제거
    .replace(/[#*`~_>]/g, "")
    // 공백 정리
    .replace(/\s+/g, " ")
    .trim();
};


export default function PostCard({ post, onLikeChanged }) {
  const router = useRouter();
  const { authInfo } = useAuth();

  const [bookmarked, setBookmarked] = useState(Boolean(post.isBookmarked));
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const liked = Boolean(post.isLiked);
  const likeCount = post.likeCount ?? 0;

  const detailUrl = `/post/${post.postId}`;
  const thumbnailSrc = post.thumbnailUrl ? getBackendAbsoluteUrl(post.thumbnailUrl) : null;

  const handleCardClick = () => {
    router.push(detailUrl);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter") {
      router.push(detailUrl);
    }
  };

  const requireLogin = () => {
    if (!authInfo.isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return false;
    }

    return true;
  };

  const handleLikeClick = async (event) => {
    event.stopPropagation();

    if (!requireLogin() || likeLoading) {
      return;
    }

    const prevLiked = liked;
    const prevLikeCount = likeCount;

    const nextLiked = !prevLiked;
    const nextLikeCount = nextLiked
      ? prevLikeCount + 1
      : Math.max(prevLikeCount - 1, 0);

    // 화면에 먼저 반영
    onLikeChanged?.({
      postId: post.postId,
      isLiked: nextLiked,
      likeCount: nextLikeCount,
    });

    try {
      setLikeLoading(true);

      const result = await togglePostLike(post.postId);
      const serverLiked = result.data;

      // 서버 결과와 프론트 예상 결과가 다르면 서버 기준으로 보정
      if (typeof serverLiked === "boolean" && serverLiked !== nextLiked) {
        const serverLikeCount = serverLiked
          ? prevLikeCount + 1
          : Math.max(prevLikeCount - 1, 0);

        onLikeChanged?.({
          postId: post.postId,
          isLiked: serverLiked,
          likeCount: serverLikeCount,
        });
      }
    } catch (error) {
      console.error(error);

      // 실패하면 원래 상태로 복구
      onLikeChanged?.({
        postId: post.postId,
        isLiked: prevLiked,
        likeCount: prevLikeCount,
      });

      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmarkClick = async (event) => {
    event.stopPropagation();

    if (!requireLogin() || bookmarkLoading) {
      return;
    }

    try {
      setBookmarkLoading(true);

      const result = await togglePostBookmark(post.postId);
      setBookmarked(result.data);
    } catch (error) {
      console.error(error);
      alert("북마크 처리 중 오류가 발생했습니다.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <article
      className="card border-0 slog-post-card"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="position-relative">
        {thumbnailSrc ? (
          <div className="slog-post-thumbnail">
            <Image
              src={thumbnailSrc}
              alt={post.title || "게시글 썸네일"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        ) : (
          <div className="slog-post-thumbnail slog-post-no-image">
            <div className="fs-3 mb-2">🌱</div>
            <div className="fw-bold fs-5">SLog</div>
            <div className="small mt-1">기록이 자라는 공간</div>
          </div>
        )}

        <button
          type="button"
          className={`btn p-0 border-0 slog-bookmark-button ${
            bookmarked ? "bookmarked" : ""
          }`}
          onClick={handleBookmarkClick}
          disabled={bookmarkLoading}
          aria-label="북마크"
        >
          <i
            className={`bi ${bookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}
          ></i>
        </button>
      </div>

      <div className="card-body slog-post-card-body">
        {post.tags?.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2 slog-post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="badge rounded-pill slog-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h5 className="card-title fw-bold mb-2 slog-post-title">
          {post.title}
        </h5>

        <p className="card-text text-muted small slog-post-preview">
          {stripMarkdown(post.contentPreview) || "내용 미리보기가 없습니다."}
        </p>

        <div className="text-muted small slog-post-meta">
          {formatDate(post.createdAt)} · 댓글 {post.commentCount ?? 0}
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-between align-items-center small slog-post-footer">
        <span className="text-muted slog-post-writer">
          by <strong className="text-dark">{post.nickname}</strong>
        </span>

        <button
          type="button"
          className={`btn p-0 border-0 d-inline-flex align-items-center gap-1 slog-like-button ${
            liked ? "liked" : ""
          }`}
          onClick={handleLikeClick}
          disabled={likeLoading}
          aria-label="좋아요"
        >
          <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`}></i>
          <span>{likeCount}</span>
        </button>
      </div>
    </article>
  );
}