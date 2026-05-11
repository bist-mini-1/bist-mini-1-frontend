"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PostForm from "@/components/posts/PostForm";
import useAuth from "@/hooks/useAuth";
import { createPost } from "@/api/postApi";

const initialValues = {
  title: "",
  content: "",
  tags: [],
  thumbnail: "",
  isPublic: "Y",
};

const extractPost = (response) => {
  if (!response) {
    return null;
  }

  return response.data ?? response.post ?? response.result ?? response;
};

export default function PostWritePage() {
  const router = useRouter();
  const { authInfo } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload, meta) => {
    if (!authInfo.isLogin) {
      alert("게시글을 작성하려면 로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!payload) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await createPost(payload);
      const createdPost = extractPost(response);
      const nextPostId = createdPost?.postId ?? createdPost?.id ?? createdPost?.post_id;

      if (!nextPostId) {
        alert("게시글은 저장되었지만 상세 페이지 이동 정보를 찾지 못했습니다.");
        router.push("/");
        return;
      }

      router.push(`/post/${nextPostId}`);
    } catch (error) {
      console.error(error);
      alert("게시글 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-2">
      {!authInfo.isLogin ? (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="fw-bold mb-1">로그인이 필요합니다.</div>
            <div className="text-muted small">게시글을 작성하거나 임시저장하려면 먼저 로그인하세요.</div>
          </div>
          <button type="button" className="btn btn-success px-4" onClick={() => router.push("/login")}>
            로그인하기
          </button>
        </div>
      ) : (
        <PostForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitting={submitting}
          title="게시글 생성"
          subtitle=""
          badgeText=""
          submitLabel="게시글 생성"
          tempLabel="임시 저장"
          cancelLabel="작성 취소"
        />
      )}
    </div>
  );
}