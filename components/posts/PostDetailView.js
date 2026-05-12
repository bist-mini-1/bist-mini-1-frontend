"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const getBackendAbsoluteUrl = (relativePath) => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
  }

  // 브라우저 환경일 때만 현재 호스트 주소를 사용
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080${relativePath}`;
    }
  }

  // 기본값 (로컬 개발 시)
  return `http://localhost:8080${relativePath}`;
};

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

function PostActionMenu({
  actionMenuRef,
  canEdit,
  postId,
  showActionMenu,
  setShowActionMenu,
  onDelete,
}) {
  return (
    <div className="post-detail-menu" ref={actionMenuRef}>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center post-detail-menu-button"
        aria-label="게시글 작업 메뉴"
        aria-expanded={showActionMenu}
        onClick={() => setShowActionMenu((prev) => !prev)}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>

      {showActionMenu ? (
        <div className="dropdown-menu dropdown-menu-end show shadow-sm border post-detail-menu-dropdown">
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
  if (!content?.trim()) {
    return <div className="text-muted mb-4">본문이 없습니다.</div>;
  }

  return (
    <div className="rounded-4 mb-4 post-content-panel">
      <div className="post-markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => {
              if (!src || !String(src).trim()) {
                return null;
              }

              // 상대 경로를 절대 경로로 변환
              let absoluteSrc = src;
              if (src.startsWith("/api/attachments")) {
                absoluteSrc = getBackendAbsoluteUrl(src);
              }

              return <img src={absoluteSrc} alt={alt || "게시글 이미지"} loading="eager" />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function PostDetailView({
  post,
  bno,
  loading,
  error,
  displayDate,
  displayTime,
  normalizedTags,
  authorProfile,
  authorFollowCount,
  authorFollowing,
  followLoading,
  onFollowClick,
  liked,
  likeCount,
  likeLoading,
  onLikeClick,
  onShareClick,
  currentMemberId,
  canEdit,
  actionMenuRef,
  showActionMenu,
  setShowActionMenu,
  onDelete,
  headerRef,
  titleRef,
  contentWrapRef,
  railRef,
  railSlotRef,
  railStyle,
}) {
  const showFollowButton = post?.memberId && post.memberId !== currentMemberId;

  return (
    <>
      <section className="post-detail-shell post-detail-shell-spaced">
        <div className="post-detail-stage">
          <div
            ref={railSlotRef}
            className="post-detail-rail-slot"
          >
            <aside ref={railRef} className="post-detail-rail post-detail-rail-left" aria-label="게시글 반응" style={railStyle}>
              <button
                type="button"
                className={`post-detail-action-button ${liked ? "is-active" : ""}`}
                onClick={onLikeClick}
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
                onClick={onShareClick}
                aria-label="공유"
              >
                <span className="post-detail-action-icon">
                  <i className="bi bi-share" />
                </span>
              </button>
            </aside>
          </div>

          <article className="post-detail-main">
            <header ref={headerRef} className="post-detail-header mb-4">
              <h1 ref={titleRef} className="post-detail-title">
                {post?.title || `게시글 ${bno || "상세"}`}
              </h1>

              <div className="post-detail-info-row">
                <div className="post-detail-author-row">
                  <Link href={`/Mypage/user/${post?.memberId}`} className="post-detail-author-name text-decoration-none">
                    {getAuthorDisplayName(post)}
                  </Link>
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
                  onDelete={onDelete}
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
              <div className="post-detail-body-grid">
                <div ref={contentWrapRef} className="post-detail-content-wrap">
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

      {post ? (
        <section className="post-author-section">
          <div className="post-author-card">
            {authorProfile?.profileImageUrl && String(authorProfile.profileImageUrl).trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <Link href={`/Mypage/user/${post?.memberId}`}>
                <img
                  src={
                    authorProfile.profileImageUrl.startsWith("http")
                      ? authorProfile.profileImageUrl
                      : getBackendAbsoluteUrl(authorProfile.profileImageUrl)
                  }
                  alt={authorProfile.nickname || getAuthorDisplayName(post)}
                  className="post-author-avatar"
                />
              </Link>
            ) : (
              <div className="post-author-avatar post-author-avatar-placeholder">👤</div>
            )}

            <div className="post-author-body">
              <div className="post-author-headline">
                <h3 className="post-author-name">{authorProfile?.nickname || getAuthorDisplayName(post)}</h3>
                <p className="post-author-login">{authorProfile?.loginId || "-"}</p>
              </div>

              {authorProfile?.bio ? <p className="post-author-bio">{authorProfile.bio}</p> : null}

              <div className="post-author-stats">
                <span>팔로워 {authorFollowCount?.followerCount ?? 0}</span>
                <span>팔로잉 {authorFollowCount?.followingCount ?? 0}</span>
              </div>
            </div>

            {showFollowButton ? (
              <button
                type="button"
                onClick={onFollowClick}
                disabled={followLoading}
                className={`post-author-follow-button ${authorFollowing ? "is-following" : ""}`}
              >
                {followLoading ? "처리 중..." : authorFollowing ? "팔로잉" : "팔로우"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
