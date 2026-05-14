"use client";

import axiosInstance from "@/api/axiosInstance";
import {
  deletePost,
  isMyPost,
  togglePostLike,
  togglePostBookmark,
} from "@/api/postApi";
import {
  getUserProfile,
  getFollowCount,
  followUser,
  unfollowUser,
} from "@/api/mypageApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useAuth from "@/hooks/useAuth";
import CommentSection from "@/components/comments/CommentSection";
import PostDetailView from "@/components/posts/PostDetailView";
import RecommendedPostList from "@/components/posts/RecommendedPostList";

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
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
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
        const postData =
          response.data?.data ?? response.data?.post ?? response.data ?? null;

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
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
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

      if (
        !slotElement ||
        !headerElement ||
        !contentWrapElement ||
        !railElement
      ) {
        setRailStyle({});
        return;
      }

      const rect = slotElement.getBoundingClientRect();
      const railRect = railElement.getBoundingClientRect();
      const headerRect = headerElement.getBoundingClientRect();
      const contentWrapRect = contentWrapElement.getBoundingClientRect();
      const headerStyles = window.getComputedStyle(headerElement);
      const headerMarginTop = parseFloat(headerStyles.marginTop) || 0;
      const headerMarginBottom = parseFloat(headerStyles.marginBottom) || 0;

      const desiredTopOffset = Math.round(
        headerRect.top +
          headerRect.height +
          headerMarginTop +
          headerMarginBottom,
      );
      const maxTopOffset = Math.round(
        contentWrapRect.bottom - railRect.height - 8,
      );
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

      resizeFrameId = window.requestAnimationFrame(syncRailStyle);
    };

    syncRailStyle();
    window.addEventListener("resize", scheduleRailSync);

    const railResizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleRailSync)
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

  const getDisplayDateParts = (createdAt) => {
    if (!createdAt) {
      return { displayDate: "-", displayTime: "-" };
    }

    const date = new Date(createdAt);

    return {
      displayDate: date.toLocaleDateString("ko-KR"),
      displayTime: date.toLocaleTimeString("ko-KR"),
    };
  };

  const normalizeTags = (tags) => {
    return Array.isArray(tags)
      ? tags
          .map((tag) => {
            if (typeof tag === "string") {
              return { key: tag, label: tag };
            }

            const key = String(
              tag?.tagId ??
                tag?.id ??
                tag?.name ??
                tag?.tag ??
                JSON.stringify(tag),
            );
            const label = String(
              tag?.name ?? tag?.tag ?? tag?.label ?? tag?.title ?? key,
            );

            return { key, label };
          })
          .filter((tag) => tag.label && tag.label !== "undefined")
      : [];
  };

  const getAuthorDisplayName = (post) => {
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
  };

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
      const nextBookmarked = Boolean(result?.data);
      setBookmarked(nextBookmarked);
    } catch (error) {
      console.error("togglePostBookmark error:", error);
      alert("스크랩 처리 중 오류가 발생했습니다.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShareClick = async () => {
    const url = window.location.href;

    try {
      // 1. Modern Navigator API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return;
      }

      // 2. Fallback: ExecCommand
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("게시글 링크가 복사되었습니다. (Fallback)");
      } catch (err) {
        throw new Error("Copy command failed");
      }
      document.body.removeChild(textArea);
    } catch (error) {
      console.error("share copy error:", error);
      alert("링크 복사에 실패했습니다. 주소창의 URL을 직접 복사해주세요.");
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
      console.error("follow action error:", error);
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
      <PostDetailView
        post={post}
        bno={bno}
        loading={loading}
        error={error}
        displayDate={displayDate}
        displayTime={displayTime}
        normalizedTags={normalizedTags}
        authorProfile={authorProfile}
        authorFollowCount={authorFollowCount}
        authorFollowing={authorFollowing}
        followLoading={followLoading}
        onFollowClick={handleFollowClick}
        liked={liked}
        likeCount={likeCount}
        likeLoading={likeLoading}
        onLikeClick={handleLikeClick}
        onShareClick={handleShareClick}
        bookmarked={bookmarked}
        bookmarkLoading={bookmarkLoading}
        onBookmarkClick={handleBookmarkClick}
        currentMemberId={authInfo?.memberId}
        canEdit={canEdit}
        actionMenuRef={actionMenuRef}
        showActionMenu={showActionMenu}
        setShowActionMenu={setShowActionMenu}
        onDelete={handleDeleteClick}
        headerRef={headerRef}
        titleRef={titleRef}
        contentWrapRef={contentWrapRef}
        railRef={railRef}
        railSlotRef={railSlotRef}
        railStyle={railStyle}
      />

      {post?.postId && (
        <CommentSection postId={post.postId} postAuthorId={post.memberId} />
      )}

      {post?.postId && <RecommendedPostList postId={post.postId} />}

      {showDeleteConfirm ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", zIndex: 1050 }}
        >
          <div
            className="bg-white rounded-4 shadow p-4"
            style={{ width: "min(92vw, 420px)" }}
          >
            <div className="fw-bold mb-2" style={{ fontSize: "1.05rem" }}>
              삭제하시겠습니까?
            </div>
            <div className="text-muted small mb-4">
              삭제한 게시글은 복구되지 않을 수 있습니다.
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="btn btn-outline-secondary px-4"
                disabled={deleting}
              >
                아니오
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger px-4"
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "예"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PostDetailPage;
