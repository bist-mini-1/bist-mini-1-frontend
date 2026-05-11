import axiosInstance from "./axiosInstance";

/**
 * 채팅 API
 */

// 내 채팅방 목록 조회
export const getChatRooms = async () => {
  const res = await axiosInstance.get("/api/chat/rooms");
  return res.data.data ?? [];
};

// 1:1 채팅방 조회 또는 생성
export const getOrCreatePersonalRoom = async (partnerId) => {
  const res = await axiosInstance.post(`/api/chat/rooms/personal/${partnerId}`);
  return res.data.data;
};

// 메시지 내역 조회 (페이징)
export const getMessageHistory = async (roomId, page = 1, size = 50) => {
  const res = await axiosInstance.get(`/api/chat/rooms/${roomId}/messages`, {
    params: { page, size }
  });
  return res.data.data ?? [];
};

// 메시지 전송 (REST - 백업용)
export const sendMessageRest = async (roomId, data) => {
  const res = await axiosInstance.post(`/api/chat/rooms/${roomId}/messages`, data);
  return res.data.data;
};

// 메시지 읽음 처리
export const markAsRead = async (roomId) => {
  const res = await axiosInstance.patch(`/api/chat/rooms/${roomId}/read`);
  return res.data;
};

// 팔로잉 목록 조회
export const getFollowingList = async (memberId) => {
  const res = await axiosInstance.get(`/api/follows/${memberId}/followings`);
  return res.data.data; // FollowListResponse { count, users }
};
