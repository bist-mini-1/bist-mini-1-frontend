import axiosInstance from "./axiosInstance";

export const login = async (data) => {
  const response = await axiosInstance.post("/api/members/login", data);
  return response.data;
};