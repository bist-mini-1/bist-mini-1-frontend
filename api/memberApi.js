import axiosInstance from "./axiosInstance";

export const login = async (data) => {
  const response = await axiosInstance.post("/api/members/login", data);
  return response.data;
};

export const join = async (data) => {
  const response = await axiosInstance.post("/api/members/join", data);
  return response.data;
};

export const checkLoginId = async (loginId) => {
  const response = await axiosInstance.get("/api/members/check-login-id", {
    params: { loginId },
  });

  return response.data;
};

export const checkEmail = async (email) => {
  const response = await axiosInstance.get("/api/members/check-email", {
    params: { email },
  });

  return response.data;
};

export const checkNickname = async (nickname) => {
  const response = await axiosInstance.get("/api/members/check-nickname", {
    params: { nickname },
  });

  return response.data;
};