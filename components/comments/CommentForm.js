"use client";

import { useState, useEffect, useRef } from "react";

function CommentForm({ 
  onSubmit, 
  initialContent = "", 
  placeholder = "댓글을 작성하세요", 
  buttonText = "댓글 작성",
  onCancel = null
}) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef(null);

  // 내용에 따라 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    if (!initialContent) setContent(""); // 등록일 때만 초기화
  };

  const formContainerStyle = {
    marginBottom: initialContent ? 16 : 32,
  };

  const textareaStyle = {
    width: "100%",
    height: initialContent ? "80px" : "100px",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #e1e1e1",
    fontSize: "1rem",
    lineHeight: "1.6",
    resize: "none",
    outline: "none",
    overflow: "hidden", // 스크롤바 숨김
    transition: "border-color 0.2s",
    marginBottom: "12px",
    display: "block",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  };

  const submitButtonStyle = {
    backgroundColor: "var(--slog-green)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
  };

  const cancelButtonStyle = {
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
  };

  return (
    <div style={formContainerStyle}>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--slog-green)")}
          onBlur={(e) => (e.target.style.borderColor = "#e1e1e1")}
        />
        <div style={buttonContainerStyle}>
          {onCancel && (
            <button type="button" style={cancelButtonStyle} onClick={onCancel}>
              취소
            </button>
          )}
          <button 
            type="submit" 
            style={submitButtonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "var(--slog-green-dark)")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "var(--slog-green)")}
            onMouseDown={(e) => (e.target.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommentForm;
