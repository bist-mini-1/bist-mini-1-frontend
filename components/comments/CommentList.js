"use client";

import CommentItem from "./CommentItem";

function CommentList({ comments, loading, onRefresh, postId, postAuthorId, newCommentId, isBestMode = false }) {
  if (loading && comments.length === 0) {
    return <div className="py-4 text-center text-muted">댓글을 불러오는 중입니다...</div>;
  }

  if (!comments || comments.length === 0) {
    if (isBestMode) return null;
    return <div className="py-5 text-center text-muted border-top">첫 번째 댓글을 남겨보세요.</div>;
  }

  return (
    <div style={{ borderTop: isBestMode ? "none" : "1px solid #f1f1f1" }}>
      {comments.map((comment) => (
        <CommentItem 
          key={comment.commentId} 
          comment={comment} 
          onRefresh={onRefresh}
          postId={postId}
          postAuthorId={postAuthorId}
          isNew={comment.commentId === newCommentId}
          isBest={isBestMode}
        />
      ))}
    </div>
  );
}

export default CommentList;
