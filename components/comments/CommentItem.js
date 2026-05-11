"use client";

import { useState, useEffect } from "react";
import CommentForm from "./CommentForm";
import { updateComment, deleteComment, createComment, checkIsMyComment } from "@/api/commentApi";
import useAuth from "@/hooks/useAuth";
import Image from "next/image";

function CommentItem({ comment, isReply = false, onRefresh, postId, isNew, newCommentId }) {
  const { authInfo } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true); // 기본적으로 답글 표시
  const [isAuthor, setIsAuthor] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // 서버로부터 본인 여부 확인
  useEffect(() => {
    const checkOwnership = async () => {
      if (!authInfo.isLogin || !comment.commentId) {
        setIsAuthor(false);
        return;
      }

      // 1. 로컬 기반 1차 판정 (빠른 반응성을 위해)
      const displayName = (comment.nickname || `User ${comment.memberId}`).trim();
      const currentNickname = (authInfo.nickname || "").trim();
      const localMatch = currentNickname.toLowerCase() === displayName.toLowerCase() || comment.isMine;
      setIsAuthor(localMatch);

      // 2. 서버 기반 최종 판정 (새로 만든 API 활용)
      const serverResult = await checkIsMyComment(comment.commentId);
      setIsAuthor(serverResult);
      
      // 디버깅 로그
      console.log(`[Comment ${comment.commentId}] Server-Side isAuthor: ${serverResult}`);
    };

    checkOwnership();
  }, [authInfo.isLogin, authInfo.nickname, comment.commentId, comment.nickname, comment.memberId, comment.isMine]);

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
        <div style={avatarStyle}>
          {comment.profileImage ? (
            <Image 
              src={comment.profileImage} 
              alt={comment.nickname || "User"} 
              width={isReply ? 32 : 40} 
              height={isReply ? 32 : 40} 
              style={{ objectFit: "cover" }} 
            />
          ) : (
            <i className="bi bi-person-circle" style={{ color: "#ddd", fontSize: isReply ? "1.2rem" : "1.5rem" }}></i>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={authorStyle}>{comment.nickname || `User ${comment.memberId}`}</span>
          <span style={dateStyle}>
            {new Date(comment.createdAt).toLocaleString()}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && <span style={{ marginLeft: "8px", opacity: 0.7 }}>(수정됨)</span>}
          </span>
        </div>
        
        {/* 수정/삭제 드롭다운 메뉴 */}
        {isAuthor && comment.isDeleted !== "Y" && !showEditForm && (
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
                <div className="comment-dropdown-item" onClick={() => setShowEditForm(true)}>
                  <i className="bi bi-pencil-square"></i> 수정하기
                </div>
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

      <div style={{ display: "flex", alignItems: "center" }}>
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
