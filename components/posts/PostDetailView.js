"use client";

import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Fragment } from "react";

import { getBackendAbsoluteUrl } from "@/utils/urlUtils";

const ATTACHMENT_BLOCK_REGEX = /<div class="attachment-block"><a class="attachment-download" href="([^"]+)"(?: data-attachment-id="([^"]+)")?(?: data-attachment-name="([^"]+)")?><div class="attachment-icon">📎<\/div><div class="attachment-info"><div class="attachment-name">([\s\S]*?)<\/div><div class="attachment-meta">([\s\S]*?)<\/div><\/div><\/a><\/div>/g;

function getAttachmentDisplayHref(href) {
  if (!href || !String(href).trim()) {
    return "#";
  }

  if (href.startsWith("/api/attachments")) {
    return getBackendAbsoluteUrl(href);
  }

  return href;
}

function AttachmentBlock({ href, name, meta, attachmentId }) {
  return (
    <div className="attachment-block" data-attachment-id={attachmentId || undefined}>
      <a className="attachment-download" href={getAttachmentDisplayHref(href)}>
        <div className="attachment-icon">📎</div>
        <div className="attachment-info">
          <div className="attachment-name">{name || "첨부파일"}</div>
          <div className="attachment-meta">{meta || "다운로드"}</div>
        </div>
      </a>
    </div>
  );
}

function renderPostContent(content, markdownComponents) {
  const nodes = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of content.matchAll(ATTACHMENT_BLOCK_REGEX)) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;

    if (matchStart > lastIndex) {
      const markdownChunk = content.slice(lastIndex, matchStart);
      if (markdownChunk.trim()) {
        nodes.push(
          <ReactMarkdown key={`markdown-${matchIndex}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdownChunk}
          </ReactMarkdown>
        );
        matchIndex += 1;
      }
    }

    nodes.push(
      <AttachmentBlock
        key={`attachment-${matchIndex}`}
        href={match[1]}
        attachmentId={match[2]}
        name={match[4] || match[3] || "첨부파일"}
        meta={match[5] || "다운로드"}
      />
    );
    matchIndex += 1;
    lastIndex = matchEnd;
  }

  if (lastIndex < content.length) {
    const markdownChunk = content.slice(lastIndex);
    if (markdownChunk.trim()) {
      nodes.push(
        <ReactMarkdown key={`markdown-${matchIndex}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdownChunk}
        </ReactMarkdown>
      );
    }
  }

  if (nodes.length === 0) {
    return null;
  }

  return <Fragment>{nodes}</Fragment>;
}


function getAuthorDisplayName(post) {
  const authorName =
    post?.nickname ||
    post?.writerNickname ||
    post?.authorNickname ||
    post?.loginId ||
    post?.writerLoginId ||
    post?.authorLoginId ||
    post?.writerId ||
    post?.authorId;

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

  const markdownComponents = {
    img: ({ src, alt }) => {
      if (!src || !String(src).trim()) {
        return null;
      }

      let absoluteSrc = src;
      if (src.startsWith("/api/attachments")) {
        absoluteSrc = getBackendAbsoluteUrl(src);
      }

      /* eslint-disable-next-line @next/next/no-img-element */
      return <img src={absoluteSrc} alt={alt || "게시글 이미지"} loading="eager" />;
    },
  };

  return (
    <div className="rounded-4 mb-4 post-content-panel">
      <div className="post-markdown-body">
        {renderPostContent(content, markdownComponents)}
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
  bookmarked,
  bookmarkLoading,
  onBookmarkClick,
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
  // canEdit가 true이면 본인 글이므로 팔로우 버튼을 숨깁니다.
  const showFollowButton = post?.memberId && !canEdit;

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
                className={`post-detail-action-button post-detail-like-button ${liked ? "is-active" : ""}`}
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
                className={`post-detail-action-button ${bookmarked ? "is-active" : ""}`}
                onClick={onBookmarkClick}
                disabled={bookmarkLoading}
                aria-pressed={bookmarked}
                aria-label="스크랩"
              >
                <span className="post-detail-action-icon">
                  <i className={`bi ${bookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`} />
                </span>
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
                  <Link href={`/Mypage/user/${post?.memberId}`} className="post-detail-author-name">
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
            <Link href={`/Mypage/user/${post?.memberId}`} className="post-author-avatar-link">
              {authorProfile?.profileImageUrl && String(authorProfile.profileImageUrl).trim() ? (
                <Image
                  src={
                    authorProfile.profileImageUrl.startsWith("http")
                      ? authorProfile.profileImageUrl
                      : getBackendAbsoluteUrl(authorProfile.profileImageUrl)
                  }
                  alt={authorProfile.nickname || getAuthorDisplayName(post)}
                  width={48}
                  height={48}
                  className="post-author-avatar"
                  unoptimized
                />
              ) : (
                <div className="post-author-avatar post-author-avatar-placeholder">
                  <i className="bi bi-person-fill" style={{ color: "#2f8f5b" }}></i>
                </div>
              )}
            </Link>

            <div className="post-author-body">
              <Link href={`/Mypage/user/${post?.memberId}`} className="post-author-headline">
                <h3 className="post-author-name">{authorProfile?.nickname || getAuthorDisplayName(post)}</h3>
                <p className="post-author-login">{authorProfile?.loginId || "-"}</p>
              </Link>

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
                {followLoading ? "처리 중..." : authorFollowing ? "팔로우 취소" : "팔로우"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
