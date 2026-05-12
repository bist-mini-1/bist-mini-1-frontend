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
    headers: { "Content-Type": undefined }, // FormData 전송 시 boundary 포함한 Content-Type을 브라우저가 자동 설정하도록
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

/** 북마크한 게시글 목록 조회 → MyPostResponse[] */
export const getBookmarkedPosts = async () => {
  const res = await axiosInstance.get("/api/members/me/bookmarks");
  return res.data.data ?? [];
};

/**
 * 팔로우 취소
 * @param {number} followingId - 언팔할 상대방 memberId
 */
export const unfollowUser = async (followingId) => {
  const res = await axiosInstance.delete(`/api/follows/${followingId}`);
  return res.data;
};

/**
 * 특정 유저 공개 프로필 조회 → { memberId, nickname, bio, profileImageUrl }
 * @param {number} memberId
 */
export const getUserProfile = async (memberId) => {
  const res = await axiosInstance.get(`/api/members/${memberId}/profile`);
  return res.data.data;
};

/**
 * 특정 유저 공개 게시글 목록 조회 → MyPostResponse[]
 * @param {number} memberId
 */
export const getUserPosts = async (memberId) => {
  const res = await axiosInstance.get(`/api/members/${memberId}/posts`);
  return res.data.data ?? [];
};

/**
 * 팔로우 하기
 * @param {number} followingId - 팔로우할 상대방 memberId
 */
export const followUser = async (followingId) => {
  const res = await axiosInstance.post(`/api/follows/${followingId}`);
  return res.data;
};

/**
 * 팔로워/팔로잉 수 조회 → { followerCount, followingCount }
 * @param {number} memberId
 */
export const getFollowCount = async (memberId) => {
  const res = await axiosInstance.get(`/api/follows/${memberId}/count`);
  return res.data.data; // { followerCount, followingCount }
};

/**
 * 특정 멤버 프로필 조회 (로그인 필요 X) → { memberId, loginId, nickname, bio, profileImageUrl, isFollowing }
 * @param {number} memberId
 */
export const getMemberProfile = async (memberId) => {
  const res = await axiosInstance.get(`/api/members/${memberId}`);
  return res.data.data;
};

/**
 * 팔로우/언팔로우 토글 → { data: true = 팔로우됨, false = 언팔로우됨 }
 * @param {number} memberId
 */
export const toggleFollowMember = async (memberId) => {
  const res = await axiosInstance.post(`/api/follows/${memberId}`);
  return res.data.data; // boolean
};
