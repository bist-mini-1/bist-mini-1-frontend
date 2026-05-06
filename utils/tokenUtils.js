export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }

  try {
    const payload = token.split(".")[1];

    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    if (!decodedPayload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);

    return decodedPayload.exp < now;
  } catch (error) {
    console.log("토큰 확인 실패:", error);
    return true;
  }
};