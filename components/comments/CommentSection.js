"use client";

import { useState, useEffect, useCallback } from "react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { getComments, createComment } from "@/api/commentApi";

/**
 * 평탄화된 댓글 배열을 트리 구조로 변환하는 헬퍼 함수
 */
const buildCommentTree = (flatList) => {
  const map = {};
  const roots = [];

  flatList.forEach((item) => {
    map[item.commentId] = { ...item, replies: [] };
  });

  flatList.forEach((item) => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].replies.push(map[item.commentId]);
      // 대댓글은 과거순(오래된 순)으로 정렬하여 대화 흐름 유지
      map[item.parentId].replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      roots.push(map[item.commentId]);
    }
  });

  // 최신순 정렬 (최신이 위로)
  return roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * 댓글 섹션 전체를 관리하는 메인 컴포넌트
 * @param {string|number} postId - 해당 포스트의 ID (bno)
 * @param {number} postAuthorId - 게시글 작성자 ID
 */
function CommentSection({ postId, postAuthorId }) {
  const [flatComments, setFlatComments] = useState([]); // 누적된 평탄 리스트
  const [comments, setComments] = useState([]); // 트리 구조 리스트
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [newCommentId, setNewCommentId] = useState(null);

  const PAGE_SIZE = 10;

  // 전체 댓글 수 조회를 위한 별도 로직 (필요시 백엔드에 카운트 API 추가 권장)
  // 여기서는 단순히 현재 로드된 개수로 표시하거나, 초기 로드 시 전체 개수를 알 수 있다면 좋습니다.

  const fetchComments = useCallback(async (isMore = false, highlightId = null) => {
    if (!postId) return;
    
    if (highlightId) {
      setNewCommentId(highlightId);
      setTimeout(() => setNewCommentId(null), 3000);
    }

    const targetPage = isMore ? page + 1 : 1;
    
    if (isMore) setLoadingMore(true);
    else setLoading(true);

    setError("");
    
    try {
      const result = await getComments(postId, targetPage, PAGE_SIZE);
      const newComments = result?.comments || [];
      const total = result?.totalCount || 0;
      
      setTotalCount(total);

      if (isMore) {
        const combined = [...flatComments, ...newComments];
        setFlatComments(combined);
        setComments(buildCommentTree(combined));
        setPage(targetPage);
      } else {
        setFlatComments(newComments);
        setComments(buildCommentTree(newComments));
        setPage(1);
      }

      // 더 가져올 데이터가 있는지 확인 (현재 로드된 댓글 수가 전체 수보다 적으면 더보기 노출)
      setHasMore((isMore ? flatComments.length + newComments.length : newComments.length) < total);
      
    } catch (err) {
      console.error("댓글 로딩 실패:", err);
      setError("댓글을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, page, flatComments]);

  useEffect(() => {
    fetchComments(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleCommentSubmit = async (content) => {
    try {
      const result = await createComment({ postId, content });
      const createdComment = result?.data || result;
      // 새 댓글 등록 시에는 1페이지부터 다시 불러와서 최신글이 보이게 함
      await fetchComments(false, createdComment?.commentId);
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      alert("댓글 등록에 실패했습니다.");
    }
  };

  const sectionStyle = {
    maxWidth: 920,
    margin: "40px auto 80px",
    padding: "0 24px",
  };

  const headerStyle = {
    fontSize: "1.25rem",
    fontWeight: 800,
    marginBottom: 24,
    color: "#16251d",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  const moreBtnStyle = {
    width: "100%",
    padding: "14px",
    marginTop: "20px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "12px",
    color: "var(--slog-green)",
    fontWeight: "700",
    fontSize: "15px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  };

  return (
    <div style={sectionStyle}>
      <h3 style={headerStyle}>
        <i className="bi bi-chat-fill"></i>
        댓글 {totalCount}
      </h3>
      
      {/* 댓글 작성 폼 */}
      <CommentForm onSubmit={handleCommentSubmit} />

      {error && <div className="alert alert-danger mt-3 rounded-3">{error}</div>}

      {/* 댓글 리스트 */}
      <div className="mt-4">
        <CommentList 
          comments={comments} 
          loading={loading && page === 1} 
          onRefresh={() => fetchComments(false)}
          postId={postId}
          postAuthorId={postAuthorId}
          newCommentId={newCommentId}
        />
      </div>

      {/* 더보기 버튼 */}
      {hasMore && !loading && (
        <button 
          style={moreBtnStyle}
          onClick={() => fetchComments(true)}
          disabled={loadingMore}
          className="hover-bg-light"
        >
          {loadingMore ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <>
              댓글 더보기
              <i className="bi bi-chevron-down"></i>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default CommentSection;
