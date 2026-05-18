import axiosInstance from "./axiosInstance";

/**
 * 파일 업로드 (게시글 작성 중 이미지/파일)
 * 파일이 DB에 직접 저장되고 attachment_id가 발급됩니다.
 * @param {File[]} files - 업로드할 파일 목록
 * @param {string} uploadType - 'IMAGE' 또는 'FILE'
 * @returns {Promise<{attachmentId, fileUrl, ...}[]>}
 */
export const uploadFiles = async (files, uploadType = "IMAGE") => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post(
    "/api/attachments/upload",
    formData,
    {
      params: { uploadType },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }
  );

  return response.data.data ?? [];
};

/**
 * 정식 첨부파일 조회 URL 생성
 * @param {number} attachmentId - 첨부파일 ID
 * @returns {string} 조회 가능한 URL
 */
export const getAttachmentUrl = (attachmentId) => {
  const baseURL = getBackendBaseURL();
  return `${baseURL}/api/attachments/${attachmentId}/image`;
};

const getBackendBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // 브라우저 환경일 때만 현재 호스트 주소를 사용 (192.168.x.x 등 외부 접속 대응)
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080`;
    }
  }
  
  // 기본값 (로컬 개발 시)
  return "http://localhost:8080";
};