const IMAGE_MARKDOWN_REGEX = /!\[[^\]]*\]\(([^)]+)\)/g;
const IMAGE_HTML_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
const MARKDOWN_IMAGE_AND_HTML_REGEX = /!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["'][^"']+["'][^>]*>/gi;

export const getFirstImageSrcFromContent = (content) => {
  if (!content) {
    return null;
  }

  const text = String(content);

  IMAGE_MARKDOWN_REGEX.lastIndex = 0;
  const markdownMatch = IMAGE_MARKDOWN_REGEX.exec(text);
  if (markdownMatch?.[1]) {
    return markdownMatch[1].trim();
  }

  IMAGE_HTML_REGEX.lastIndex = 0;
  const htmlMatch = IMAGE_HTML_REGEX.exec(text);
  if (htmlMatch?.[1]) {
    return htmlMatch[1].trim();
  }

  return null;
};

export const resolveImageSrc = (src, baseUrl) => {
  if (!src) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(src) || /^(data|blob):/i.test(src)) {
    return src;
  }

  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
};

export const getPreviewTextFromContent = (content, maxLength = 120) => {
  if (!content) {
    return "";
  }

  let text = String(content);

  // 마크다운 이미지 제거: ![alt](url) - 모든 변형
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/gs, "");

  // base64 및 data URI 제거
  text = text.replace(/data:image\/[^;]*;base64,[^\s)]+/gi, "");
  text = text.replace(/data:image\/[^\s;]+[^\s)]*\)/gi, "");

  // 모든 URL 제거 (http, https, blob, data 등)
  text = text.replace(/(?:https?|blob|file):\/\/[^\s)]+/gi, "");

  // HTML 이미지 태그 제거
  text = text.replace(/<img[^>]*>/gi, "");

  // 마크다운 링크 제거: [text](url)
  text = text.replace(/\[[^\]]+\]\([^)]*\)/g, "");

  // ! 기호 뒤 남은 텍스트 정리 (![...](...) 형식이 남아있을 수 있음)
  text = text.replace(/![^\s]*\[[^\]]*\][^\s]*/g, "");

  // 마크다운 포매팅 제거
  text = text.replace(/[#*`_~\[\](){}!]/g, "");

  // 연속된 공백 정리
  text = text.replace(/\s+/g, " ").trim();

  return maxLength > 0 ? text.slice(0, maxLength) : text;
};