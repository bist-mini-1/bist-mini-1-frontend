"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/formatDate";
import { togglePostLike, togglePostBookmark } from "@/api/postApi";
import { getFirstImageSrcFromContent, getPreviewTextFromContent, resolveImageSrc } from "@/utils/postContentUtils";
import useAuth from "@/hooks/useAuth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function PostCard({ post }) {
  const router = useRouter();
  const { authInfo } = useAuth();

  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [bookmarked, setBookmarked] = useState(Boolean(post.isBookmarked));
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const detailUrl = `/post/${post.postId}`;
  const firstContentImageSrc = getFirstImageSrcFromContent(post.contentPreview || post.content);
  const thumbnailSrc = resolveImageSrc(post.thumbnailUrl || firstContentImageSrc, API_BASE_URL);
  const previewText = getPreviewTextFromContent(post.contentPreview || post.content);

  const requireLogin = () => {
    if (!authInfo.isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return false;
    }

    return true;
  };

  const handleLikeClick = async () => {
    if (!requireLogin() || likeLoading) {
      return;
    }

    try {
      setLikeLoading(true);

      const result = await togglePostLike(post.postId);
      const nextLiked = result.data;

      setLiked(nextLiked);
      setLikeCount((prev) => {
        if (nextLiked) {
          return prev + 1;
        }

        return Math.max(prev - 1, 0);
      });
    } catch (error) {
      console.error(error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmarkClick = async (event) => {
    event.preventDefault();
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
    <article className="card h-100 border-0 slog-post-card">
      <div className="position-relative">
        <Link href={detailUrl} className="text-decoration-none">
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
        </Link>

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
            className={`bi ${
              bookmarked ? "bi-bookmark-fill" : "bi-bookmark"
            }`}
          ></i>
        </button>
      </div>

      <div className="card-body">
        {post.tags?.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {post.tags.map((tag) => (
              <span key={tag} className="badge rounded-pill slog-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h5 className="card-title fw-bold mb-2">
          <Link href={detailUrl} className="text-dark text-decoration-none">
            {post.title}
          </Link>
        </h5>

        <p className="card-text text-muted small slog-post-preview">
          {previewText || "내용 미리보기가 없습니다."}
        </p>

        <div className="text-muted small">
          {formatDate(post.createdAt)} · 댓글 {post.commentCount ?? 0}
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-between align-items-center small">
        <span className="text-muted">
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