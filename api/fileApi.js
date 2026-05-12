import axiosInstance from "./axiosInstance";

export const uploadTempAttachments = async (files = [], uploadType = "INLINE_IMAGE") => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("uploadType", uploadType);

  const response = await axiosInstance.post("/api/attachments/temp", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

const fileApi = {
  uploadTempAttachments,
};

export default fileApi;