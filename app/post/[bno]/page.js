"use client";

import axiosInstance from "@/api/axiosInstance";
import { isMyPost } from "@/api/postApi";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";

function PostDetailPage() {
  const params = useParams();
  const { authInfo } = useAuth();
  const bno = useMemo(() => {
    const value = params?.bno;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!bno) {
      return;
    }

    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.get(`/api/posts/${bno}`);
        const postData = response.data?.data ?? response.data?.post ?? response.data ?? null;

        if (isMounted) {
          setPost(postData);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError("게시글을 불러오지 못했습니다.");
          setPost(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [bno]);

  useEffect(() => {
    if (!authInfo.isLogin || !post?.postId) {
      return;
    }

    let isMounted = true;

    const checkOwnership = async () => {
      try {
        const result = await isMyPost(post.postId);
        console.log("isMyPost result:", result);
        if (isMounted) {
          const isOwner = result === true || result?.data === true;
          console.log("isOwner:", isOwner);
          setCanEdit(isOwner);
        }
      } catch (error) {
        console.error("isMyPost error:", error);
        if (isMounted) {
          setCanEdit(false);
        }
      }
    };

    checkOwnership();

    return () => {
      isMounted = false;
    };
  }, [authInfo.isLogin, post?.postId]);

  const displayDate = post?.createdAt
    ? new Date(post.createdAt).toLocaleString("ko-KR")
    : "-";

  const displayUpdatedDate = post?.updatedAt
    ? new Date(post.updatedAt).toLocaleString("ko-KR")
    : "-";

  const displayDeletedDate = post?.deletedAt
    ? new Date(post.deletedAt).toLocaleString("ko-KR")
    : "-";

  const normalizedTags = Array.isArray(post?.tags)
    ? post.tags
        .map((tag) => {
          if (typeof tag === "string") {
            return { key: tag, label: tag };
          }

          const key = String(tag?.tagId ?? tag?.id ?? tag?.name ?? tag?.tag ?? JSON.stringify(tag));
          const label = String(tag?.name ?? tag?.tag ?? tag?.label ?? tag?.title ?? key);

          return { key, label };
        })
        .filter((tag) => tag.label && tag.label !== "undefined")
    : [];

  if (!bno) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        게시글 번호가 없습니다.
      </div>
    );
  }

  const articleFrameStyle = {
    position: "relative",
    maxWidth: 920,
    margin: "0 auto",
    padding: 24,
    background: "#ffffff",
    borderRadius: 28,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.04)",
  };

  const titleBlockStyle = {
    padding: "22px 8px 24px",
    borderBottom: "1px solid #b8d6bc",
  };

  const infoLineStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  };

  const infoItemStyle = {
    padding: "16px 18px",
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.03)",
  };

  return (
    <div className="container-fluid px-0">
      <section style={articleFrameStyle}>
        <div>
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge rounded-pill text-bg-light text-dark px-3 py-2 border fw-semibold">POST</span>
              <span className="text-dark small fw-semibold">blog / article</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {canEdit && post?.postId ? (
                <Link href={`/post/PostUpdate/${post.postId}`} className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-pill">
                  수정
                </Link>
              ) : null}
              <Link href="/post/PostList" className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-pill">
                목록으로
              </Link>
            </div>
          </div>

          <header style={titleBlockStyle} className="mb-4">
            <h1 style={{ fontSize: "clamp(1.85rem, 4vw, 3rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em" }} className="mb-3">
              {post?.title || `게시글 ${bno || "상세"}`}
            </h1>
            <div className="d-flex flex-wrap gap-2 align-items-center text-muted fw-semibold" style={{ fontSize: 13 }}>
              <span><span className="text-dark fw-bold">작성자</span> {post?.nickname ?? "-"}</span>
              <span>•</span>
              <span><span className="text-dark fw-bold">날짜</span> {displayDate}</span>
              <span>•</span>
              <span><span className="text-dark fw-bold">조회</span> {post?.viewCount ?? 0}</span>
              <span>•</span>
              <span><span className="text-dark fw-bold">좋아요</span> {post?.likeCount ?? 0}</span>
              <span>•</span>
              <span><span className="text-dark fw-bold">댓글</span> {post?.commentCount ?? 0}</span>
            </div>
          </header>

          {loading ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center py-5 text-muted">불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="alert alert-warning mb-0 rounded-4 border-0 shadow-sm" role="alert">
              {error}
            </div>
          ) : post ? (
            <article>
              <section style={{ marginBottom: 28 }}>
                <div style={infoLineStyle}>
                  <div style={infoItemStyle}>
                    <div className="text-dark small fw-bold mb-1">게시글 ID</div>
                    <div className="fw-semibold text-dark">{post.postId ?? bno}</div>
                  </div>
                  <div style={infoItemStyle}>
                    <div className="text-dark small fw-bold mb-1">회원 ID</div>
                    <div className="fw-semibold text-dark">{post.memberId ?? "-"}</div>
                  </div>
                  <div style={infoItemStyle}>
                    <div className="text-dark small fw-bold mb-1">작성자</div>
                    <div className="fw-semibold text-dark">{post.nickname ?? "-"}</div>
                  </div>
                  <div style={infoItemStyle}>
                    <div className="text-dark small fw-bold mb-1">수정일</div>
                    <div className="fw-semibold text-dark">{displayUpdatedDate}</div>
                  </div>
                </div>
              </section>

              <section className="mb-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">공개</span> {post.isPublic ?? "-"}
                  </span>
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">임시저장</span> {post.isTemp ?? "-"}
                  </span>
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">삭제 여부</span> {post.isDeleted ?? "-"}
                  </span>
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">조회</span> {post.viewCount ?? 0}
                  </span>
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">좋아요</span> {post.likeCount ?? 0}
                  </span>
                  <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}>
                    <span className="fw-bold">댓글</span> {post.commentCount ?? 0}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <span className="text-dark fw-bold">작성일</span>
                  <span>•</span>
                  <span className="text-dark fw-semibold">{displayDate}</span>
                </div>
              </section>

              {post.content ? (
                <div
                  className="rounded-4 mb-4"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 2,
                    fontSize: "1.06rem",
                    color: "#3f463f",
                    background: "#ffffff",
                    borderRadius: 22,
                    padding: "34px 30px",
                    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <div className="text-uppercase small text-muted mb-3" style={{ letterSpacing: "0.12em" }}>
                    Content
                  </div>
                  {post.content}
                </div>
              ) : (
                <div className="text-muted mb-4">본문이 없습니다.</div>
              )}

              {normalizedTags.length > 0 && (
                <section>
                  <div className="text-muted small mb-2">Tags</div>
                  <div className="d-flex flex-wrap gap-2">
                    {normalizedTags.map((tag, index) => (
                      <span
                        key={`${tag.key}-${index}`}
                        className="badge rounded-pill px-3 py-2"
                        style={{ backgroundColor: "#eaf6ea", color: "#111111", border: "1px solid #b8d6bc" }}
                      >
                        #{tag.label}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </article>
          ) : (
            <div className="alert alert-secondary mb-0 rounded-4 border-0 shadow-sm" role="alert">
              게시글이 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PostDetailPage;