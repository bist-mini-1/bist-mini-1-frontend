import axiosInstance from "./axiosInstance";

// 게시글 목록 조회
export const getPostList = async ({ page = 1, size = 10 }) => {
  const response = await axiosInstance.get("/api/post", {
    params: {
      page,
      size,
    },
  });

  return response.data;
};