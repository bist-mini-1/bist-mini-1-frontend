"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { uploadFiles } from "@/api/fileApi";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="alert alert-info mb-0">에디터 로드 중...</div>,
});

const getBackendAbsoluteUrl = (relativePath) => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
  }

  // 브라우저 환경일 때만 현재 호스트 주소를 사용
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080${relativePath}`;
    }
  }

  // 기본값 (로컬 개발 시)
  return `http://localhost:8080${relativePath}`;
};

const emptyForm = {
  title: "",
  tags: "",
  thumbnail: "",
  isPublic: "Y",
};

const toFormValues = (initialValues) => ({
  title: initialValues?.title ?? "",
  tags: Array.isArray(initialValues?.tags)
    ? initialValues.tags
        .map((tag) => {
          if (typeof tag === "string") {
            return tag;
          }

          return tag?.name ?? tag?.tag ?? tag?.label ?? tag?.title ?? "";
        })
        .filter(Boolean)
        .join(", ")
    : initialValues?.tags ?? "",
  thumbnail: initialValues?.thumbnail ?? initialValues?.thumbnailUrl ?? "",
  isPublic: initialValues?.isPublic ?? initialValues?.is_public ?? "Y",
  content: initialValues?.content ?? "",
});

export default function PostForm({
  initialValues = emptyForm,
  onSubmit,
  onCancel,
  submitting = false,
  showTempSave = true,
  title = "게시글 생성",
  subtitle = "POST WRITE",
  badgeText = "title / content / tags / thumbnail",
  submitLabel = "게시글 생성",
  tempLabel = "임시 저장",
  cancelLabel = "작성 취소",
}) {
  const imageInputRef = useRef(null);
  const [form, setForm] = useState(() => toFormValues(initialValues));
  const [content, setContent] = useState(() => initialValues?.content ?? "");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const insertUploadedImage = async (file) => {
    if (!file) {
      return;
    }

    try {
      setUploading(true);

      const uploadResponse = await uploadFiles([file], "IMAGE");
      let imageUrl = uploadResponse?.[0]?.fileUrl;

      if (!imageUrl) {
        throw new Error("이미지 업로드 응답에 fileUrl이 없습니다.");
      }

      // 상대 경로를 절대 경로로 변환 (백엔드 호스트 포함)
      if (imageUrl.startsWith("/api/attachments")) {
        imageUrl = getBackendAbsoluteUrl(imageUrl);
      }

      const altText = file.name?.replace(/\.[^.]+$/, "") || "image";
      const imageMarkdown = `![${altText}](${imageUrl})`;

      setContent((current) => {
        if (!current.trim()) {
          return imageMarkdown;
        }

        return `${current.trimEnd()}\n\n${imageMarkdown}`;
      });
    } catch (error) {
      console.error("Image upload error:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleImageInputChange = async (event) => {
    const file = event.target.files?.[0];
    await insertUploadedImage(file);
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "제목을 입력해주세요.";
    } else if (form.title.trim().length > 200) {
      nextErrors.title = "제목은 200자 이내로 입력해주세요.";
    }

    if (!content.trim()) {
      nextErrors.content = "내용을 입력해주세요.";
    }

    if (!form.isPublic.trim()) {
      nextErrors.isPublic = "공개 여부를 선택해주세요.";
    }

    if (form.thumbnail.trim().length > 0) {
      try {
        new URL(form.thumbnail.trim());
      } catch {
        nextErrors.thumbnail = "썸네일 URL 형식이 올바르지 않습니다.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (isTemp) => {
    if (!validate()) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: content.trim(),
      is_public: form.isPublic,
      is_temp: isTemp ? "Y" : "N",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      thumbnail: form.thumbnail.trim() || null,
    };

    await onSubmit(payload, { isTemp });
  };

  return (
    <form className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-header bg-white border-0 px-4 pt-4 pb-0">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div className="text-muted small fw-semibold mb-1">{subtitle}</div>
            <h1 className="h3 fw-bold mb-0">{title}</h1>
          </div>
          <div className="badge rounded-pill text-bg-light border text-dark px-3 py-2">{badgeText}</div>
        </div>
      </div>

      <div className="card-body p-4 p-lg-5">
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-semibold">제목</label>
            <input
              type="text"
              name="title"
              className={`form-control form-control-lg ${errors.title ? "is-invalid" : ""}`}
              placeholder="게시글 제목을 입력하세요"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
            />
            {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">내용 (마크다운)</label>
            <div className={`post-editor-shell ${errors.content ? "is-invalid" : ""}`}>
              <div className="post-editor-toolbar">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleImageInputChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={openImagePicker}
                  disabled={uploading}
                >
                  이미지 삽입
                </button>
              </div>

              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(value) => {
                    setContent(value ?? "");

                    if (errors.content) {
                      setErrors((current) => ({
                        ...current,
                        content: "",
                      }));
                    }
                  }}
                  height={420}
                  preview="live"
                  textareaProps={{
                    placeholder: "게시글 내용을 입력하세요",
                  }}
                />
              </div>
            </div>
            {errors.content && <div className="invalid-feedback d-block" style={{ display: "block" }}>{errors.content}</div>}
            {uploading && <div className="form-text text-info">이미지 업로드 중...</div>}
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label fw-semibold">태그</label>
            <input
              type="text"
              name="tags"
              className="form-control"
              placeholder="예: Spring, JPA, React"
              value={form.tags}
              onChange={handleChange}
            />
            <div className="form-text">쉼표로 구분해서 입력하세요.</div>
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label fw-semibold">썸네일 URL</label>
            <input
              type="url"
              name="thumbnail"
              className={`form-control ${errors.thumbnail ? "is-invalid" : ""}`}
              placeholder="https://example.com/thumbnail.jpg"
              value={form.thumbnail}
              onChange={handleChange}
            />
            {errors.thumbnail ? (
              <div className="invalid-feedback d-block">{errors.thumbnail}</div>
            ) : (
              <div className="form-text">선택 입력입니다.</div>
            )}
          </div>

          <div className="col-12 col-lg-4">
            <label className="form-label fw-semibold">공개 여부</label>
            <select
              name="isPublic"
              className={`form-select ${errors.isPublic ? "is-invalid" : ""}`}
              value={form.isPublic}
              onChange={handleChange}
            >
              <option value="Y">공개</option>
              <option value="N">비공개</option>
            </select>
            {errors.isPublic && <div className="invalid-feedback d-block">{errors.isPublic}</div>}
          </div>
        </div>
      </div>

      <div className="card-footer bg-white border-0 p-4 pt-0">
        <div className="d-flex flex-wrap gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary px-4" disabled={submitting || uploading} onClick={onCancel}>
            {cancelLabel}
          </button>
          {showTempSave && (
            <button type="button" className="btn btn-outline-success px-4" disabled={submitting || uploading} onClick={() => handleSubmit(true)}>
              {tempLabel}
            </button>
          )}
          <button type="button" className="btn btn-success px-4" disabled={submitting || uploading} onClick={() => handleSubmit(false)}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}