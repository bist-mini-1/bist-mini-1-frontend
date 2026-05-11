import axiosInstance from "./axiosInstance";

/**
 * 특정 포스트의 댓글 목록을 가져옵니다.
 * @param {number|string} postId - 게시글 ID
 * @returns {Promise<Array>} 댓글 목록 배열
 */
export const getComments = async (postId) => {
  const response = await axiosInstance.get(`/api/comments/post/${postId}`);
  // API 명세상 { status, message, data: [...] } 형태로 반환됨
  return response.data?.data || [];
};

/**
 * 새로운 댓글 또는 대댓글을 등록합니다.
 * @param {Object} params
 * @param {number} params.postId - 게시글 ID
 * @param {number|null} params.parentId - 부모 댓글 ID (대댓글인 경우)
 * @param {string} params.content - 댓글 내용
 */
export const createComment = async ({ postId, parentId = null, content }) => {
  const response = await axiosInstance.post("/api/comments", {
    postId,
    parentId,
    content,
  });
  return response.data;
};

/**
 * 댓글을 수정합니다.
 * @param {number} commentId - 댓글 ID
 * @param {string} content - 수정할 내용
 */
export const updateComment = async (commentId, content) => {
  const response = await axiosInstance.put(`/api/comments/${commentId}`, {
    content,
  });
  return response.data;
};

/**
 * 댓글을 삭제합니다.
 * @param {number} commentId - 댓글 ID
 */
export const deleteComment = async (commentId) => {
  const response = await axiosInstance.delete(`/api/comments/${commentId}`);
  return response.data;
};

/**
 * 현재 로그인한 사용자가 해당 댓글의 작성자인지 확인합니다.
 * @param {number} commentId - 댓글 ID
 * @returns {Promise<boolean>} 본인 여부
 */
export const checkIsMyComment = async (commentId) => {
  try {
    const response = await axiosInstance.get(`/api/comments/${commentId}/mine`);
    return response.data?.data === true;
  } catch (error) {
    return false;
  }
};

/**
 * 댓글 좋아요를 토글합니다.
 * @param {number} commentId - 댓글 ID
 * @returns {Promise<boolean>} 좋아요 상태 (true: 추가됨, false: 취소됨)
 */
export const toggleCommentLike = async (commentId) => {
  const response = await axiosInstance.post(`/api/comments/${commentId}/like`);
  return response.data?.data;
};