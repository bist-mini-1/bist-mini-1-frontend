"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CommentForm from "./CommentForm";
import { updateComment, deleteComment, createComment, checkIsMyComment, toggleCommentLike } from "@/api/commentApi";
import useAuth from "@/hooks/useAuth";
import Image from "next/image";

function CommentItem({ comment, isReply = false, onRefresh, postId, postAuthorId, isNew, newCommentId }) {
  const { authInfo } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true); 
  const [showDropdown, setShowDropdown] = useState(false);

  // 좋아요 로컬 상태
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [liking, setLiking] = useState(false);

  // 게시글 작성자 여부 확인 (Badge 용)
  const isPostAuthor = comment.memberId === postAuthorId;

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (!authInfo.isLogin) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }
    if (liking) return;

    try {
      setLiking(true);
      const result = await toggleCommentLike(comment.commentId);
      setIsLiked(result);
      setLikeCount(prev => result ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error("좋아요 실패:", err);
    } finally {
      setLiking(false);
    }
  };

  // 댓글 데이터가 바뀌면(onRefresh 후 등) 좋아요 상태 업데이트
  useEffect(() => {
    setLikeCount(comment.likeCount || 0);
    setIsLiked(comment.isLiked || false);
  }, [comment.likeCount, comment.isLiked]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = () => setShowDropdown(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  const handleReplySubmit = async (content) => {
    try {
      const result = await createComment({ 
        postId, 
        parentId: comment.commentId, 
        content 
      });
      
      const createdComment = result?.data || result;
      setShowReplyForm(false);
      if (onRefresh) onRefresh(createdComment?.commentId);
    } catch (err) {
      alert("답글 등록에 실패했습니다.");
    }
  };

  const handleEditSubmit = async (content) => {
    try {
      await updateComment(comment.commentId, content);
      setShowEditForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("댓글 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteComment(comment.commentId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const itemStyle = {
    paddingTop: isReply ? "10px" : "24px",
    paddingBottom: isReply ? "0" : "24px",
    borderBottom: isReply ? "none" : "1px solid #f1f1f1",
    marginLeft: isReply ? "48px" : "0",
    opacity: comment.isDeleted === "Y" ? 0.6 : 1,
    position: "relative",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    gap: "12px",
    position: "relative",
  };

  const avatarStyle = {
    width: isReply ? "32px" : "40px",
    height: isReply ? "32px" : "40px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isReply ? "0.9rem" : "1.2rem",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid #eee",
  };

  const authorStyle = {
    fontWeight: "700",
    fontSize: isReply ? "0.85rem" : "0.95rem",
    color: "#111",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  };

  const dateStyle = {
    fontSize: "0.8rem",
    color: "#aaa",
  };

  const contentStyle = {
    fontSize: isReply ? "0.9rem" : "0.98rem",
    lineHeight: "1.6",
    color: "#333",
    whiteSpace: "pre-wrap",
    marginBottom: isReply ? "8px" : "16px",
    paddingLeft: isReply ? "0" : "0",
  };

  const actionButtonStyle = {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "0.82rem",
    fontWeight: "600",
    padding: "0",
    cursor: "pointer",
    marginRight: "12px",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center"
  };

  const likeButtonStyle = {
    ...actionButtonStyle,
    color: isLiked ? "#ff4d4f" : "#888",
  };

  const primaryActionButtonStyle = {
    ...actionButtonStyle,
    color: "var(--slog-green)",
  };

  const meatballStyle = {
    background: "none",
    border: "none",
    color: "#ccc",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    marginLeft: "auto",
  };

  // 삭제된 댓글 처리
  if (comment.isDeleted === "Y" && (!comment.replies || comment.replies.length === 0)) {
    return (
      <div style={itemStyle} className="comment-item-wrapper">
        <div style={{ ...contentStyle, color: "#aaa", fontStyle: "italic", marginBottom: 0 }}>
          삭제된 댓글입니다.
        </div>
      </div>
    );
  }

  return (
    <div style={itemStyle} className={`comment-item-wrapper ${isNew ? "comment-item-new" : ""}`}>
      <div style={headerStyle}>
        <Link href={`/Mypage/user/${comment.memberId}`} className="text-decoration-none">
          <div style={avatarStyle}>
            <Image 
              src={comment.profileImageUrl || "/images/default-profile.png"} 
              alt={comment.nickname || "User"} 
              width={isReply ? 32 : 40} 
              height={isReply ? 32 : 40} 
              style={{ objectFit: "cover" }} 
            />
          </div>
        </Link>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={authorStyle}>
            <Link href={`/Mypage/user/${comment.memberId}`} className="text-decoration-none text-dark hover-underline">
              {comment.nickname || `User ${comment.memberId}`}
            </Link>
            {isPostAuthor && (
              <span className="badge rounded-pill text-bg-success" style={{ fontSize: "10px", padding: "3px 8px", fontWeight: "600" }}>
                작성자
              </span>
            )}
          </div>
          <span style={dateStyle}>
            {new Date(comment.createdAt).toLocaleString()}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && <span style={{ marginLeft: "8px", opacity: 0.7 }}>(수정됨)</span>}
          </span>
        </div>
        
        {/* 수정/삭제 드롭다운 메뉴 */}
        {/* 수정/삭제 드롭다운 메뉴 (서버에서 부여한 권한 기반) */}
        {(comment.canDelete || comment.isMine) && comment.isDeleted !== "Y" && !showEditForm && (
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <button 
              style={meatballStyle} 
              className="meatball-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <i className="bi bi-three-dots"></i>
            </button>
            
            {showDropdown && (
              <div className="comment-dropdown">
                {comment.isMine && (
                  <div className="comment-dropdown-item" onClick={() => setShowEditForm(true)}>
                    <i className="bi bi-pencil-square"></i> 수정하기
                  </div>
                )}
                <div className="comment-dropdown-item delete" onClick={handleDelete}>
                  <i className="bi bi-trash"></i> 삭제하기
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showEditForm ? (
        <CommentForm 
          key={`edit-${comment.commentId}`}
          initialContent={comment.content} 
          onSubmit={handleEditSubmit} 
          buttonText="수정 완료" 
          onCancel={() => setShowEditForm(false)}
        />
      ) : (
        <div style={contentStyle}>
          {comment.isDeleted === "Y" ? "삭제된 댓글입니다." : comment.content}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {comment.isDeleted !== "Y" && (
          <button style={likeButtonStyle} onClick={handleLikeToggle} disabled={liking}>
            <i className={`bi ${isLiked ? "bi-heart-fill" : "bi-heart"} me-1`}></i>
            {likeCount > 0 ? likeCount : "좋아요"}
          </button>
        )}
        
        {comment.isDeleted !== "Y" && !isReply && (
          <button 
            style={showReplyForm ? primaryActionButtonStyle : actionButtonStyle} 
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <i className="bi bi-chat-dots me-1"></i>
            답글 달기
          </button>
        )}

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <button style={actionButtonStyle} onClick={() => setShowReplies(!showReplies)}>
            <i className={`bi ${showReplies ? "bi-chevron-up" : "bi-chevron-down"} me-1`}></i>
            {showReplies ? "답글 숨기기" : `답글 ${comment.replies.length}개 보기`}
          </button>
        )}
      </div>

      <div className={`comment-form-container ${showReplyForm ? 'show' : ''}`} style={{ paddingLeft: isReply ? 0 : "48px" }}>
        <div className="comment-form-inner">
          <CommentForm 
            key={`reply-${comment.commentId}`}
            placeholder={`${comment.nickname || "작성자"}님께 답글 작성`} 
            buttonText="답글 작성" 
            onSubmit={handleReplySubmit} 
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      </div>

      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className={`comment-reply-container ${showReplies ? 'show' : ''}`}>
          <div className="comment-reply-inner">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.commentId} 
                comment={reply} 
                isReply={true} 
                onRefresh={onRefresh}
                postId={postId}
                postAuthorId={postAuthorId}
                isNew={reply.commentId === newCommentId}
                newCommentId={newCommentId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CommentItem;
