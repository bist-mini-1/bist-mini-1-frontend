export const formatDate = (dateTime) => {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};