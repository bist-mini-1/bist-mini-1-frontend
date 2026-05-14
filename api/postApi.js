import axiosInstance from "./axiosInstance";

export const getPostList = async ({
  page = 1,
  size = 12,
  keyword = "",
  sort = "latest",
}) => {
  const response = await axiosInstance.get("/api/posts", {
    params: {
      page,
      size,
      keyword,
      sort,
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
export const getPostDetail = async (postId) => {
  const response = await axiosInstance.get(`/api/posts/${postId}`);

  return response.data;
};

export const getTempPostList = async () => {
  const response = await axiosInstance.get("/api/posts/temp/list");

  return response.data;
};

export const getTempPostDetail = async (postId) => {
  const response = await axiosInstance.get(`/api/posts/temp/${postId}`);

  return response.data;
};

export const deleteTempPost = async (postId) => {
  const response = await axiosInstance.delete(`/api/posts/temp/${postId}`);

  return response.data;
};

export const isMyPost = async (postId) => {
  const response = await axiosInstance.get(`/api/posts/${postId}/mine`) ;

  return response.data;
};

export const createPost = async (data) => {
  const response = await axiosInstance.post("/api/posts", data);

  return response.data;
};

export const updatePost = async (postId, data) => {
  const response = await axiosInstance.put(`/api/posts/${postId}`, data);

  return response.data;
};

export const deletePost = async (postId) => {
  const response = await axiosInstance.delete(`/api/posts/${postId}`);

  return response.data;
};

export const getRecommendedPosts = async (postId, limit = 4) => {
  const response = await axiosInstance.get(`/api/posts/${postId}/recommended`, {
    params: {
      limit,
    },
  });

  return response.data;
};