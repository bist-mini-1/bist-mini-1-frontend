import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/utils/formatDate";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function PostCard({ post }) {
  const detailUrl = `/post/${post.postId}`;
  const thumbnailSrc = post.thumbnailUrl
    ? `${API_BASE_URL}${post.thumbnailUrl}`
    : null;

  return (
    <article className="card h-100 border-0 slog-post-card">
      <Link href={detailUrl} className="text-decoration-none">
        {thumbnailSrc ? (
          <div className="slog-post-thumbnail">
            <Image
              src={thumbnailSrc}
              alt={post.title || "게시글 썸네일"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
          {post.contentPreview || "내용 미리보기가 없습니다."}
        </p>

        <div className="text-muted small">
          {formatDate(post.createdAt)} · 댓글 {post.commentCount ?? 0}
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-between align-items-center small">
        <span className="text-muted">
          by <strong className="text-dark">{post.nickname}</strong>
        </span>

        <span className="d-inline-flex align-items-center gap-1 slog-post-like">
          <span className="slog-heart-icon">❤</span>
          <span>{post.likeCount ?? 0}</span>
        </span>
      </div>
    </article>
  );
}