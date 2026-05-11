import axiosInstance from "./axiosInstance";

/**
 * 팔로우 API
 */

// 사용자 팔로우
export const followUser = async (followingId) => {
  const response = await axiosInstance.post(`/api/follows/${followingId}`);
  return response.data;
};

// 팔로우 취소
export const unfollowUser = async (followingId) => {
  const response = await axiosInstance.delete(`/api/follows/${followingId}`);
  return response.data;
};

// 팔로워 목록 조회
export const getFollowers = async (memberId) => {
  const response = await axiosInstance.get(`/api/follows/${memberId}/followers`);
  return response.data.data;
};

// 팔로잉 목록 조회
export const getFollowings = async (memberId) => {
  const response = await axiosInstance.get(`/api/follows/${memberId}/followings`);
  return response.data.data;
};

// 팔로우 수 조회
export const getFollowCount = async (memberId) => {
  const response = await axiosInstance.get(`/api/follows/${memberId}/count`);
  return response.data.data;
};
