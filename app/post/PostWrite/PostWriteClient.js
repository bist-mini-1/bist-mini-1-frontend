"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PostForm from "@/components/posts/PostForm";
import useAuth from "@/hooks/useAuth";
import { createPost, getTempPostDetail, getTempPostList, updatePost } from "@/api/postApi";

const initialValuesDefaults = {
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

const toFormValues = (post) => ({
  title: post?.title ?? "",
  content: post?.content ?? "",
  tags: Array.isArray(post?.tags)
    ? post.tags
        .map((tag) => {
          if (typeof tag === "string") {
            return tag;
          }

          return tag?.name ?? tag?.tag ?? tag?.label ?? tag?.title ?? "";
        })
        .filter(Boolean)
    : [],
  thumbnail: post?.thumbnailUrl ?? post?.thumbnail ?? "",
  isPublic: post?.isPublic ?? post?.is_public ?? "Y",
});

export default function PostWriteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authInfo } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [tempPosts, setTempPosts] = useState([]);
  const [formValues, setFormValues] = useState(initialValuesDefaults);
  const [formKey, setFormKey] = useState("new");
  const [activeDraftId, setActiveDraftId] = useState(null);
  const draftId = searchParams.get("draftId");

  useEffect(() => {
    let isMounted = true;

    const loadTempPosts = async () => {
      if (!authInfo.isLogin) {
        if (isMounted) {
          setTempPosts([]);
        }
        return;
      }

      try {
        const response = await getTempPostList();
        const posts = extractPost(response) ?? [];
        if (isMounted) {
          setTempPosts(Array.isArray(posts) ? posts : []);
        }
      } catch (error) {
        console.error("임시저장 목록 불러오기 실패:", error);
        if (isMounted) {
          setTempPosts([]);
        }
      }
    };

    void loadTempPosts();

    return () => {
      isMounted = false;
    };
  }, [authInfo.isLogin]);

  useEffect(() => {
    if (!authInfo.isLogin || !draftId) {
      return;
    }

    let isMounted = true;

    const loadDraft = async () => {
      try {
        const response = await getTempPostDetail(draftId);
        const draft = extractPost(response);
        if (draft && isMounted) {
          setFormValues(toFormValues(draft));
          setActiveDraftId(draft.postId);
          setFormKey(String(draft.postId));
        }
      } catch (error) {
        console.error("임시저장 불러오기 실패:", error);
        if (isMounted) {
          setFormValues(initialValuesDefaults);
          setActiveDraftId(null);
          setFormKey("new");
        }
      }
    };

    void loadDraft();

    return () => {
      isMounted = false;
    };
  }, [authInfo.isLogin, draftId]);

  const handleLoadTempDraft = (draft) => {
    if (!draft) {
      return;
    }

    setFormValues(toFormValues(draft));
    setActiveDraftId(draft.postId);
    setFormKey(String(draft.postId));
    router.replace(`/post/PostWrite?draftId=${draft.postId}`);
  };

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

      const response = activeDraftId ? await updatePost(activeDraftId, payload) : await createPost(payload);
      const createdPost = extractPost(response);
      const nextPostId = createdPost?.postId ?? createdPost?.id ?? createdPost?.post_id;

      if (!nextPostId) {
        alert("게시글은 저장되었지만 상세 페이지 이동 정보를 찾지 못했습니다.");
        router.push("/");
        return;
      }

      if (meta?.isTemp) {
        setActiveDraftId(nextPostId);
        setFormKey(String(nextPostId));
        router.replace(`/post/PostWrite?draftId=${nextPostId}`);
        alert("저장 완료되었습니다.");
        setActiveDraftId(null);
        setFormKey("new");
        router.push("/");
        return;
      }

      setActiveDraftId(null);
      setFormKey("new");
      router.replace("/post/PostWrite");
      if (authInfo.isLogin) {
        const response = await getTempPostList();
        const posts = extractPost(response) ?? [];
        setTempPosts(Array.isArray(posts) ? posts : []);
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
          key={formKey}
          initialValues={formValues}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitting={submitting}
          tempDrafts={tempPosts}
          onSelectTempDraft={handleLoadTempDraft}
          draftId={activeDraftId}
          title="게시글 생성"
          subtitle="POST WRITE"
          submitLabel="게시글 생성"
          tempLabel="임시 저장"
          cancelLabel="작성 취소"
        />
      )}
    </div>
  );
}