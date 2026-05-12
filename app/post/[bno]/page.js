"use client";

import axiosInstance from "@/api/axiosInstance";
import { deletePost, isMyPost, togglePostBookmark, togglePostLike } from "@/api/postApi";
import { getUserProfile, getFollowCount, followUser, unfollowUser } from "@/api/mypageApi";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useAuth from "@/hooks/useAuth";
import CommentSection from "@/components/comments/CommentSection";

const ToastViewer = dynamic(() => import("@/components/common/ToastViewer"), { ssr: false });

const articleFrameStyle = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "0 24px",
  width: "100%",
  boxSizing: "border-box",
};

function getDisplayDateParts(createdAt) {
  if (!createdAt) {
    return { displayDate: "-", displayTime: "-" };
  }

  const date = new Date(createdAt);

  return {
    displayDate: date.toLocaleDateString("ko-KR"),
    displayTime: date.toLocaleTimeString("ko-KR"),
  };
}

function normalizeTags(tags) {
  return Array.isArray(tags)
    ? tags
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
}

function getAuthorDisplayName(post) {
  const authorName =
    post?.loginId ||
    post?.writerLoginId ||
    post?.authorLoginId ||
    post?.writerId ||
    post?.authorId ||
    post?.nickname ||
    post?.writerNickname ||
    post?.authorNickname;

  if (authorName) {
    return authorName;
  }

  if (post?.memberId) {
    return `User ${post.memberId}`;
  }

  return "작성자";
}

function PostActionMenu({ actionMenuRef, canEdit, postId, showActionMenu, setShowActionMenu, onDelete }) {
  return (
    <div className="post-detail-menu" ref={actionMenuRef}>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
        style={{ width: 36, height: 36 }}
        aria-label="게시글 작업 메뉴"
        aria-expanded={showActionMenu}
        onClick={() => setShowActionMenu((prev) => !prev)}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>

      {showActionMenu ? (
        <div className="dropdown-menu dropdown-menu-end show shadow-sm border" style={{ display: "block", minWidth: 140 }}>
          {canEdit && postId ? (
            <Link
              href={`/post/PostUpdate/${postId}`}
              className="dropdown-item"
              onClick={() => setShowActionMenu(false)}
            >
              수정
            </Link>
          ) : null}
          <Link href="/" className="dropdown-item" onClick={() => setShowActionMenu(false)}>
            목록으로
          </Link>
          {canEdit && postId ? (
            <button
              type="button"
              className="dropdown-item text-danger"
              onClick={() => {
                setShowActionMenu(false);
                onDelete();
              }}
            >
              삭제
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PostBodyPanel({ content }) {
  if (!content) {
    return <div className="text-muted mb-4">본문이 없습니다.</div>;
  }

  return (
    <div
      className="rounded-4 mb-4 post-content-panel"
      style={{
        background: "transparent",
        borderRadius: 0,
        padding: "0",
        boxShadow: "none",
      }}
    >
      <ToastViewer initialValue={content} usageStatistics={false} />
    </div>
  );
}

function DeleteConfirmDialog({ open, deleting, onCancel, onConfirm }) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", zIndex: 1050 }}
    >
      <div className="bg-white rounded-4 shadow p-4" style={{ width: "min(92vw, 420px)" }}>
        <div className="fw-bold mb-2" style={{ fontSize: "1.05rem" }}>
          삭제하시겠습니까?
        </div>
        <div className="text-muted small mb-4">삭제한 게시글은 복구되지 않을 수 있습니다.</div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-outline-secondary px-4" disabled={deleting}>
            아니오
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-danger px-4" disabled={deleting}>
            {deleting ? "삭제 중..." : "예"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { authInfo } = useAuth();
  const bno = useMemo(() => {
    const value = params?.bno;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [railStyle, setRailStyle] = useState({});
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [authorFollowCount, setAuthorFollowCount] = useState(null);
  const [authorFollowing, setAuthorFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const actionMenuRef = useRef(null);
  const railSlotRef = useRef(null);
  const headerRef = useRef(null);
  const contentWrapRef = useRef(null);
  const railRef = useRef(null);
  const titleRef = useRef(null);

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
          setLiked(Boolean(postData?.isLiked));
          setBookmarked(Boolean(postData?.isBookmarked));
          setLikeCount(postData?.likeCount ?? 0);
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
        if (isMounted) {
          const isOwner = result === true || result?.data === true;
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

  useEffect(() => {
    if (!post?.memberId) {
      return;
    }

    let isMounted = true;

    const fetchAuthorInfo = async () => {
      try {
        const profile = await getUserProfile(post.memberId);
        const followCount = await getFollowCount(post.memberId);

        if (isMounted) {
          setAuthorProfile(profile);
          setAuthorFollowCount(followCount);
          setAuthorFollowing(profile?.isFollowing ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch author info:", error);
      }
    };

    fetchAuthorInfo();

    return () => {
      isMounted = false;
    };
  }, [post?.memberId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowActionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const syncRailStyle = () => {
      const slotElement = railSlotRef.current;
      const headerElement = headerRef.current;
      const contentWrapElement = contentWrapRef.current;
      const railElement = railRef.current;

      if (!slotElement || !headerElement || !contentWrapElement || !railElement) {
        setRailStyle({});
        return;
      }

      const rect = slotElement.getBoundingClientRect();
      const railRect = railElement.getBoundingClientRect();
      const headerRect = headerElement.getBoundingClientRect();
      const contentWrapRect = contentWrapElement.getBoundingClientRect();
      const headerStyles = window.getComputedStyle(headerElement);
      const headerMarginTop = Number.parseFloat(headerStyles.marginTop) || 0;
      const headerMarginBottom = Number.parseFloat(headerStyles.marginBottom) || 0;
      const desiredTopOffset = Math.round(
        headerRect.top + headerRect.height + headerMarginTop + headerMarginBottom
      );
      const maxTopOffset = Math.round(contentWrapRect.bottom - railRect.height - 8);
      const viewportTopOffset = Math.min(desiredTopOffset, maxTopOffset);
      const viewportLeftOffset = Math.max(0, Math.round(rect.left - 60));

      setRailStyle({
        position: "fixed",
        top: viewportTopOffset,
        left: viewportLeftOffset,
        width: rect.width,
        zIndex: 2,
      });
    };

    let resizeFrameId = null;

    const scheduleRailSync = () => {
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        syncRailStyle();
      });
    };

    syncRailStyle();
    window.addEventListener("resize", scheduleRailSync);

    const railResizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleRailSync();
          })
        : null;

    if (railResizeObserver) {
      if (railSlotRef.current) {
        railResizeObserver.observe(railSlotRef.current);
      }

      if (headerRef.current) {
        railResizeObserver.observe(headerRef.current);
      }
    }

    return () => {
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      window.removeEventListener("resize", scheduleRailSync);

      if (railResizeObserver) {
        railResizeObserver.disconnect();
      }
    };
  }, []);

  const { displayDate, displayTime } = getDisplayDateParts(post?.createdAt);
  const normalizedTags = normalizeTags(post?.tags);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const requireLogin = () => {
    if (!authInfo.isLogin) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/login");
      return false;
    }

    return true;
  };

  const handleLikeClick = async () => {
    if (!post?.postId || likeLoading || !requireLogin()) {
      return;
    }

    try {
      setLikeLoading(true);
      const result = await togglePostLike(post.postId);
      const nextLiked = Boolean(result?.data);

      setLiked(nextLiked);
      setLikeCount((prev) => Math.max(prev + (nextLiked ? 1 : -1), 0));
    } catch (error) {
      console.error("togglePostLike error:", error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmarkClick = async () => {
    if (!post?.postId || bookmarkLoading || !requireLogin()) {
      return;
    }

    try {
      setBookmarkLoading(true);
      const result = await togglePostBookmark(post.postId);
      setBookmarked(Boolean(result?.data));
    } catch (error) {
      console.error("togglePostBookmark error:", error);
      alert("스크랩 처리 중 오류가 발생했습니다.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("게시글 링크가 복사되었습니다.");
    } catch (error) {
      console.error("share copy error:", error);
      alert("링크 복사에 실패했습니다.");
    }
  };

  const handleFollowClick = async () => {
    if (!post?.memberId || followLoading || !requireLogin()) {
      return;
    }

    try {
      setFollowLoading(true);
        if (authorFollowing) {
          await unfollowUser(post.memberId);
          setAuthorFollowing(false);
        } else {
          await followUser(post.memberId);
          setAuthorFollowing(true);
        }
    } catch (error) {
      console.error("toggleFollowMember error:", error);
      alert("팔로우 처리 중 오류가 발생했습니다.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) {
      return;
    }

    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (!post?.postId || deleting) {
      return;
    }

    try {
      setDeleting(true);
      await deletePost(post.postId);
      setShowDeleteConfirm(false);
      router.push("/");
    } catch (deleteError) {
      console.error("deletePost error:", deleteError);

      if (deleteError?.response?.status === 403) {
        alert("작성자만 게시글을 삭제할 수 있습니다.");
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!bno) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        게시글 번호가 없습니다.
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <section style={articleFrameStyle} className="post-detail-shell">
        <div style={{ position: "relative", width: "100%" }}>
          <div ref={railSlotRef} className="post-detail-rail-slot" style={{ position: "absolute", left: "-80px", top: 0, width: "auto", boxSizing: "border-box" }}>
            <aside ref={railRef} className="post-detail-rail post-detail-rail-left" aria-label="게시글 반응" style={railStyle}>
              <button
                type="button"
                className={`post-detail-action-button ${liked ? "is-active" : ""}`}
                onClick={handleLikeClick}
                disabled={likeLoading}
                aria-pressed={liked}
                aria-label="좋아요"
              >
                <span className="post-detail-action-icon">
                  <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
                </span>
                <span className="post-detail-action-count">{likeCount}</span>
              </button>

              <button
                type="button"
                className="post-detail-action-button"
                onClick={handleShareClick}
                aria-label="공유"
              >
                <span className="post-detail-action-icon">
                  <i className="bi bi-share" />
                </span>
              </button>
            </aside>
          </div>

          <article className="post-detail-main" style={{ width: "100%", boxSizing: "border-box" }}>
            <header ref={headerRef} className="post-detail-header mb-4">
              <h1 ref={titleRef} className="post-detail-title">
                {post?.title || `게시글 ${bno || "상세"}`}
              </h1>

              <div className="post-detail-info-row">
                <div className="post-detail-author-row">
                  <span className="post-detail-author-name">{getAuthorDisplayName(post)}</span>
                  <span className="post-detail-separator">·</span>
                  <span>{displayDate}</span>
                  <span className="post-detail-separator">·</span>
                  <span>{displayTime}</span>
                </div>

                <PostActionMenu
                  actionMenuRef={actionMenuRef}
                  canEdit={canEdit}
                  postId={post?.postId}
                  showActionMenu={showActionMenu}
                  setShowActionMenu={setShowActionMenu}
                  onDelete={handleDeleteClick}
                />
              </div>

              {normalizedTags.length > 0 ? (
                <div className="post-detail-tag-row">
                  {normalizedTags.map((tag) => (
                    <span key={tag.key} className="post-detail-tag-pill">
                      #{tag.label}
                    </span>
                  ))}
                </div>
              ) : null}
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
              <div className="post-detail-body-grid" style={{ width: "100%", boxSizing: "border-box" }}>
                <div ref={contentWrapRef} className="post-detail-content-wrap" style={{ width: "100%", boxSizing: "border-box" }}>
                  <PostBodyPanel content={post.content} />
                </div>
              </div>
            ) : (
              <div className="alert alert-secondary mb-0 rounded-4 border-0 shadow-sm" role="alert">
                게시글이 없습니다.
              </div>
            )}
          </article>
        </div>
      </section>

      {post && (
        <section style={{ maxWidth: 920, margin: "0 auto 40px", padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ backgroundColor: "#f8f9fa", borderRadius: 16, padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
            {authorProfile?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorProfile.profileImageUrl}
                alt={authorProfile.nickname}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#e9ecef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  flexShrink: 0,
                }}
              >
                👤
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "8px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600 }}>
                  {authorProfile?.nickname || getAuthorDisplayName(post)}
                </h3>
                <p style={{ margin: 0, color: "#6c757d", fontSize: "14px" }}>
                  {authorProfile?.loginId || "-"}
                </p>
              </div>
              {authorProfile?.bio && (
                <p style={{ margin: "8px 0 0 0", color: "#495057", fontSize: "14px" }}>
                  {authorProfile.bio}
                </p>
              )}
              <div style={{ marginTop: "8px", display: "flex", gap: "16px", fontSize: "14px", color: "#6c757d" }}>
                <span>팔로워 {authorFollowCount?.followerCount ?? 0}</span>
                <span>팔로잉 {authorFollowCount?.followingCount ?? 0}</span>
              </div>
            </div>

            {post?.memberId !== authInfo?.memberId && (
              <button
                onClick={handleFollowClick}
                disabled={followLoading}
                style={{
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: authorFollowing ? "#e9ecef" : "#0d6efd",
                  color: authorFollowing ? "#495057" : "#ffffff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {followLoading ? "처리 중..." : authorFollowing ? "팔로잉" : "팔로우"}
              </button>
            )}
          </div>
        </section>
      )}

      {post?.postId && (
        <CommentSection postId={post.postId} />
      )}

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        deleting={deleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default PostDetailPage;