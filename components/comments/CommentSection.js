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
 */
function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [newCommentId, setNewCommentId] = useState(null);

  const fetchComments = useCallback(async (newId = null) => {
    if (!postId) return;
    
    if (newId) {
      setNewCommentId(newId);
      setTimeout(() => setNewCommentId(null), 3000);
    }

    setLoading(true);
    setError("");
    try {
      const data = await getComments(postId);
      setTotalCount(data.length);
      setComments(buildCommentTree(data));
    } catch (err) {
      console.error("댓글 로딩 실패:", err);
      setError("댓글을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!postId) return;
      
      try {
        const data = await getComments(postId);
        if (isMounted) {
          setTotalCount(data.length);
          setComments(buildCommentTree(data));
        }
      } catch (err) {
        if (isMounted) setError("댓글을 불러오는 데 실패했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [postId]);

  const handleCommentSubmit = async (content) => {
    try {
      const result = await createComment({ postId, content });
      const createdComment = result?.data || result;
      await fetchComments(createdComment?.commentId); // 목록 갱신 및 새 댓글 ID 전달
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      alert("댓글 등록에 실패했습니다.");
    }
  };

  const sectionStyle = {
    maxWidth: 920,
    margin: "0 auto 40px",
    padding: "0 24px",
    width: "100%",
    boxSizing: "border-box",
  };

  const headerStyle = {
    fontSize: "1.15rem",
    fontWeight: 700,
    marginBottom: 24,
    color: "#111",
  };

  return (
    <div style={sectionStyle}>
      <h3 style={headerStyle}>{totalCount}개의 댓글</h3>
      
      {/* 댓글 작성 폼 */}
      <CommentForm onSubmit={handleCommentSubmit} />

      {error && <div className="text-danger mb-3">{error}</div>}

      {/* 댓글 리스트 */}
      <CommentList 
        comments={comments} 
        loading={loading} 
        onRefresh={fetchComments}
        postId={postId}
        newCommentId={newCommentId}
      />
    </div>
  );
}

export default CommentSection;
