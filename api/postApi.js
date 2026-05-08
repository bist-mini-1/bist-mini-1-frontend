import axiosInstance from "./axiosInstance";

export const getPostList = async ({ page = 1, size = 12, keyword = "" }) => {
  const response = await axiosInstance.get("/api/posts", {
    params: {
      page,
      size,
      keyword,
    },
  });

  return response.data;
};

export const togglePostLike = async (postId) => {
  const response = await axiosInstance.post(`/api/posts/${postId}/like`);
  return response.data;
};

export const togglePostBookmark = async (postId) => {
  const response = await axiosInstance.post(`/api/posts/${postId}/bookmark`);
  return response.data;
};
