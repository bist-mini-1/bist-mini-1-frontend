"use client";

import { useRef, useState } from "react";
import { Editor as ToastEditor } from "@toast-ui/react-editor";
import fileApi from "../../api/fileApi";

const emptyForm = {
  title: "",
  content: "",
  tags: "",
  thumbnail: "",
  isPublic: "Y",
};

const toFormValues = (initialValues) => ({
  title: initialValues?.title ?? "",
  content: initialValues?.content ?? "",
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
});

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8080";
  }

  const { hostname } = window.location;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:8080`;
  }

  return "http://127.0.0.1:8080";
};

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
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => toFormValues(initialValues));
  const editorRef = useRef(null);

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

  const handleEditorChange = () => {
    const markdown = editorRef.current?.getInstance?.().getMarkdown?.() ?? "";

    setForm((current) => (current.content === markdown ? current : { ...current, content: markdown }));
    setErrors((current) => ({ ...current, content: "" }));
  };

  const handleImageBlobHook = async (blob, callback) => {
    try {
      const response = await fileApi.uploadTempAttachments([blob], "INLINE_IMAGE");
      const items = Array.isArray(response) ? response : response?.data ?? [];
      const item = items[0];
      if (!item) {
        throw new Error("이미지 업로드 응답이 비어 있습니다.");
      }

      const tempId = item.tempId || item.temp_id || item.id;
      const url = item.fileUrl || item.file_url || item.url || (tempId ? `/api/attachments/temp/${tempId}` : "");
      if (!url) {
        throw new Error("이미지 URL을 찾을 수 없습니다.");
      }

      callback(url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`, item.originalName || item.original_name || "image");
      setErrors((current) => ({ ...current, content: "" }));
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  const validate = (content) => {
    const nextErrors = {};
    const currentContent = content ?? form.content;

    if (!form.title.trim()) {
      nextErrors.title = "제목을 입력해주세요.";
    } else if (form.title.trim().length > 200) {
      nextErrors.title = "제목은 200자 이내로 입력해주세요.";
    }

    if (!currentContent.trim()) {
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
    const currentContent = editorRef.current?.getInstance?.().getMarkdown?.() ?? form.content;

    if (!validate(currentContent)) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: currentContent.trim(),
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
            {subtitle ? <div className="text-muted small fw-semibold mb-1">{subtitle}</div> : null}
            <h1 className="h3 fw-bold mb-0">{title}</h1>
          </div>
          {badgeText ? (
            <div className="badge rounded-pill text-bg-light border text-dark px-3 py-2">{badgeText}</div>
          ) : null}
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

          <div className="col-12">
            <label className="form-label fw-semibold">내용</label>
            <div className={`post-editor-shell ${errors.content ? "is-invalid" : ""}`}>
              <ToastEditor
                ref={editorRef}
                initialValue={form.content}
                initialEditType="markdown"
                previewStyle="vertical"
                height="420px"
                usageStatistics={false}
                hooks={{ addImageBlobHook: handleImageBlobHook }}
                onChange={handleEditorChange}
              />
            </div>
            {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
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
          <button type="button" className="btn btn-outline-secondary px-4" disabled={submitting} onClick={onCancel}>
            {cancelLabel}
          </button>
          {showTempSave && (
            <button type="button" className="btn btn-outline-success px-4" disabled={submitting} onClick={() => handleSubmit(true)}>
              {tempLabel}
            </button>
          )}
          <button type="button" className="btn btn-success px-4" disabled={submitting} onClick={() => handleSubmit(false)}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}