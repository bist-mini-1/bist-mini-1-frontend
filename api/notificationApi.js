import axiosInstance from "./axiosInstance";

/**
 * 내 알림 목록 조회
 */
export const getNotifications = async () => {
  const response = await axiosInstance.get("/api/notifications");
  return response.data;
};

/**
 * 알림 읽음 처리
 */
export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllAsRead = async () => {
  const response = await axiosInstance.patch("/api/notifications/read-all");
  return response.data;
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (notificationId) => {
  const response = await axiosInstance.delete(`/api/notifications/${notificationId}`);
  return response.data;
};

/**
 * 모든 알림 삭제
 */
export const deleteAllNotifications = async () => {
  const response = await axiosInstance.delete("/api/notifications/all");
  return response.data;
};
