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
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "") // 이미지 제거
    .replace(/\[.*?\]\(.*?\)/g, "") // 링크 제거
    .replace(/[#*`~_>]/g, "") // 마크다운 기호 제거
    .replace(/\s+/g, " ") // 공백 정리
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