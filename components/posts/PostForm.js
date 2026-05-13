"use client";

import React, { memo, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { uploadFiles } from "@/api/fileApi";
import { getBackendAbsoluteUrl } from "@/utils/urlUtils";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="alert alert-info mb-0">에디터 로드 중...</div>,
});


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

const extractMarkdownImageUrls = (content) => {
  if (!content) {
    return [];
  }

  const pattern = /!\[.*?\]\((.*?)\)/g;
  return [...content.matchAll(pattern)].map((match) => match[1]).filter(Boolean);
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
  const imageInputRef = useRef(null);
  const [form, setForm] = useState(() => toFormValues(initialValues));
  const [content, setContent] = useState(() => initialValues?.content ?? "");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(() => extractMarkdownImageUrls(initialValues?.content));
  const initialContentImages = useMemo(() => extractMarkdownImageUrls(initialValues?.content), [initialValues?.content]);
  const allUploadedImages = useMemo(
    () => [...new Set([...initialContentImages, ...uploadedImages])],
    [initialContentImages, uploadedImages]
  );

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

      // 마크다운에는 상대 경로를 저장합니다 (환경 간 이식성 보장)
      // 실제 조회 시에는 프론트엔드에서 절대 경로로 변환하여 처리합니다.


      const altText = file.name?.replace(/\.[^.]+$/, "") || "image";
      const imageMarkdown = `![${altText}](${imageUrl})`;

      setContent((current) => {
        if (!current.trim()) {
          return imageMarkdown;
        }

        return `${current.trimEnd()}\n\n${imageMarkdown}`;
      });

      // 업로드된 이미지 목록에 추가 (썸네일 선택용)
      setUploadedImages((prev) => {
        const next = [...prev, imageUrl];
        // 썸네일이 아직 설정되지 않았다면, 첫 번째 업로드 이미지를 자동으로 썸네일로 설정
        setForm((f) => {
          if (!f.thumbnail || f.thumbnail.trim() === "") {
            return { ...f, thumbnail: imageUrl };
          }
          return f;
        });
        return next;
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

  // 서버 응답에서 첨부 id 추출 (여러 필드명에 대응)
  const extractAttachmentId = (item) => {
    return item?.attachmentId || item?.id || item?.attachment_id || item?.fileId || item?.file_id || null;
  };

  const humanFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return bytes + " B";
    const units = ["KB", "MB", "GB", "TB"];
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + " " + units[u];
  };

  const insertMarkdownAtEnd = (markdown) => {
    setContent((current) => {
      if (!current.trim()) return markdown;
      return `${current.trimEnd()}\n\n${markdown}`;
    });
  };

  const handleFilesUploadAndInsert = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map((file) => {
        const isImage = String(file.type || "").startsWith("image/");
        return uploadFiles([file], isImage ? "IMAGE" : "FILE").then((res) => ({ res, file, isImage }));
      });

      const results = await Promise.all(uploadPromises);

      results.forEach(({ res, file, isImage }) => {
        const info = res?.[0] ?? {};
        const attachmentId = extractAttachmentId(info);
        const fileUrl = info?.fileUrl || info?.url || null;

        if (isImage) {
          if (attachmentId) {
            const altText = file.name?.replace(/\.[^.]+$/, "") || "image";
            insertMarkdownAtEnd(`![${altText}](/api/attachments/${attachmentId}/image)`);
            setUploadedImages((prev) => [...new Set([...prev, `/api/attachments/${attachmentId}/image`])]);
            setForm((f) => {
              if (!f.thumbnail || f.thumbnail.trim() === "") {
                return { ...f, thumbnail: `/api/attachments/${attachmentId}/image` };
              }
              return f;
            });
          } else if (fileUrl) {
            const altText = file.name?.replace(/\.[^.]+$/, "") || "image";
            insertMarkdownAtEnd(`![${altText}](${fileUrl})`);
            setUploadedImages((prev) => [...new Set([...prev, fileUrl])]);
          }
        } else {
          if (attachmentId) {
            const html = `<div class="attachment-block"><a class="attachment-download" href="/api/attachments/${attachmentId}/download" data-attachment-id="${attachmentId}"><div class="attachment-icon">📎</div><div class="attachment-info"><div class="attachment-name">${file.name}</div><div class="attachment-meta">${humanFileSize(file.size)}</div></div></a></div>`;
            insertMarkdownAtEnd(html);
          } else if (fileUrl) {
            const html = `<div class="attachment-block"><a class="attachment-download" href="${fileUrl}" data-attachment-name="${file.name}"><div class="attachment-icon">📎</div><div class="attachment-info"><div class="attachment-name">${file.name}</div><div class="attachment-meta">${humanFileSize(file.size)}</div></div></a></div>`;
            insertMarkdownAtEnd(html);
          }
        }
      });
    } catch (err) {
      console.error("파일 업로드 중 오류:", err);
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e) => {
    if (!e?.clipboardData) return;
    const items = e.clipboardData.items;
    if (!items) return;

    const files = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file") {
        const file = it.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await handleFilesUploadAndInsert(files);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = dt.files;
    if (files && files.length > 0) {
      await handleFilesUploadAndInsert(files);
    }
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
                <PostMDEditor
                  content={content}
                  setContent={setContent}
                  getBackendAbsoluteUrl={getBackendAbsoluteUrl}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
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

          <div className="col-12">
            <label className="form-label fw-semibold">썸네일 선택</label>


            {allUploadedImages.length > 0 ? (
              <div className="mt-2">
                <div className="small text-muted mb-2">본문에 삽입된 이미지 중 하나를 썸네일로 선택할 수 있습니다 (첫 번째 이미지가 기본값):</div>
                <div className="d-flex flex-wrap gap-2">
                  {allUploadedImages.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn p-0 border rounded-3 overflow-hidden position-relative ${
                        form.thumbnail === url ? "border-primary border-3 shadow-sm" : "border-light-subtle"
                      }`}
                      style={{ width: "80px", height: "80px", transition: "all 0.2s" }}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, thumbnail: url }))
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBackendAbsoluteUrl(url)}
                        alt="Thumbnail suggestion"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {form.thumbnail === url && (
                        <div className="position-absolute top-0 end-0 bg-primary text-white p-1 rounded-bottom-start shadow-sm" style={{ lineHeight: 1 }}>
                          <i className="bi bi-check-lg small" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="alert alert-light border border-dashed py-3 text-center mb-0">
                <i className="bi bi-image text-muted d-block fs-2 mb-2"></i>
                <span className="text-muted small">이미지를 업로드하면 자동으로 썸네일로 설정됩니다.</span>
              </div>
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

// 에디터 글자 지워짐/커서 점프 현상 방지를 위해 메모이제이션 컴포넌트로 분리
const PostMDEditor = memo(({ content, setContent, getBackendAbsoluteUrl, onPaste, onDrop }) => {
  const previewOptions = useMemo(() => ({
    components: {
      img: ({ src, alt }) => {
        if (!src || !String(src).trim()) return null;
        let absoluteSrc = src;
        if (src.startsWith("/api/attachments")) {
          absoluteSrc = getBackendAbsoluteUrl(src);
        }
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={absoluteSrc} 
            alt={alt || "이미지"} 
            style={{ maxWidth: "100%", borderRadius: "8px" }} 
            loading="lazy"
          />
        );
      },
    },
  }), [getBackendAbsoluteUrl]);

  return (
    <MDEditor
      value={content}
      onChange={setContent}
      height={420}
      preview="live"
      previewOptions={previewOptions}
      textareaProps={{
        placeholder: "게시글 내용을 입력하세요",
        spellCheck: false,
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        onPaste: onPaste,
        onDrop: onDrop,
        onDragOver: (e) => e.preventDefault(),
        style: {
          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: "15px",
          lineHeight: "1.6",
        }
      }}
    />
  );
});

PostMDEditor.displayName = "PostMDEditor";
