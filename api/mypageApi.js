import axiosInstance from "./axiosInstance";

/**
 * 마이페이지 API
 * - 모든 엔드포인트는 Authorization 헤더(Bearer JWT)가 자동 첨부됩니다.
 * - 백엔드는 ApiResponse<T> 래퍼로 응답하므로 실제 데이터는 res.data.data 에 있습니다.
 */

/** 내 프로필 조회 → { memberId, loginId, email, nickname, bio, profileImageUrl } */
export const getMyProfile = async () => {
  const res = await axiosInstance.get("/api/members/me");
  return res.data.data;
};

/** 내 게시글 목록 조회 → Post[] */
export const getMyPosts = async () => {
  const res = await axiosInstance.get("/api/members/me/posts");
  return res.data.data ?? [];
};

/** 닉네임 수정 */
export const updateNickname = async (nickname) => {
  const res = await axiosInstance.patch("/api/members/me/nickname", { nickname });
  return res.data;
};

/** 비밀번호 변경 */
export const updatePassword = async (currentPassword, newPassword) => {
  const res = await axiosInstance.patch("/api/members/me/password", {
    currentPassword,
    newPassword,
  });
  return res.data;
};

/** 자기소개 수정 */
export const updateBio = async (bio) => {
  const res = await axiosInstance.patch("/api/members/me/bio", { bio });
  return res.data;
};

/** 프로필 이미지 업로드 → { profileImageUrl } */
export const updateProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("profileImage", file);
  const res = await axiosInstance.patch("/api/members/me/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data; // { profileImageUrl }
};

/**
 * 닉네임 중복 확인 (기존 /api/members/check-nickname 재사용)
 * @returns {Promise<boolean>} true = 이미 사용 중, false = 사용 가능
 */
export const checkNicknameDuplicate = async (nickname) => {
  const res = await axiosInstance.get("/api/members/check-nickname", {
    params: { nickname },
  });
  return res.data === true; // boolean 반환
};
