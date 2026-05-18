export const getBackendAbsoluteUrl = (relativePath) => {
  if (!relativePath) return "";

  // 이미 절대 경로인 경우 그대로 반환
  if (relativePath.startsWith("http")) {
    return relativePath;
  }

  // 환경 변수가 설정되어 있으면 사용
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
  }

  // 브라우저 환경일 때 현재 호스트 주소를 기반으로 추측 (개발 환경 편의성)
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    // 로컬호스트가 아니면 현재 호스트의 8080 포트로 연결 시도
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080${relativePath}`;
    }
  }

  // 기본값 (로컬 개발 시)
  return `http://localhost:8080${relativePath}`;
};
