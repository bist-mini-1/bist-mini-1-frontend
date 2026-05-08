"use client";

import { getPostDetail, updatePost, isMyPost } from "@/api/postApi";
import PostForm from "@/components/posts/PostForm";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const toInitialValues = (post) => ({
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

const extractPost = (response) => response?.data ?? response?.post ?? response?.result ?? response ?? null;

export default function PostUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const { authInfo } = useAuth();
  const bno = useMemo(() => {
    const value = params?.bno;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  useEffect(() => {
    if (!bno) {
      return;
    }

    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getPostDetail(bno);
        const postData = extractPost(response);

        if (isMounted) {
          setInitialValues(postData);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError("게시글을 불러오지 못했습니다.");
          setInitialValues(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [bno]);

  useEffect(() => {
    if (!authInfo.isLogin || !initialValues?.postId) {
      return;
    }

    let isMounted = true;

    const checkOwnership = async () => {
      setCheckingPermission(true);

      try {
        const result = await isMyPost(initialValues.postId);
        console.log("isMyPost result:", result);
        if (isMounted) {
          const isOwner = result === true || result?.data === true;
          console.log("isOwner:", isOwner);
          setCanEdit(isOwner);
        }
      } catch (error) {
        console.error("isMyPost error:", error);
        if (isMounted) {
          setCanEdit(false);
        }
      } finally {
        if (isMounted) {
          setCheckingPermission(false);
        }
      }
    };

    checkOwnership();

    return () => {
      isMounted = false;
    };
  }, [authInfo.isLogin, initialValues?.postId]);

  const handleSubmit = async (payload) => {
    if (!authInfo.isLogin) {
      alert("게시글을 수정하려면 로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!payload) {
      return;
    }

    try {
      setSaving(true);

      const response = await updatePost(bno, payload);
      const updatedPost = extractPost(response);
      const nextPostId = updatedPost?.postId ?? updatedPost?.id ?? updatedPost?.post_id ?? bno;

      router.push(`/post/${nextPostId}`);
    } catch (submitError) {
      console.error(submitError);
      if (submitError?.response?.status === 403) {
        alert("작성자만 게시글을 수정할 수 있습니다.");
        router.push(`/post/${bno}`);
        return;
      }

      alert("게시글 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!bno) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        게시글 번호가 없습니다.
      </div>
    );
  }

  if (!authInfo.isLogin) {
    return (
      <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="fw-bold mb-1">로그인이 필요합니다.</div>
          <div className="text-muted small">게시글을 수정하려면 먼저 로그인하세요.</div>
        </div>
        <button type="button" className="btn btn-success px-4" onClick={() => router.push("/login")}>
          로그인하기
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-5 text-muted">게시글 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="alert alert-warning mb-0 rounded-4 border-0 shadow-sm">{error}</div>;
  }

  if (!initialValues) {
    return <div className="alert alert-secondary mb-0 rounded-4 border-0 shadow-sm">게시글이 없습니다.</div>;
  }

  if (checkingPermission) {
    return <div className="text-center py-5 text-muted">수정 권한을 확인하는 중...</div>;
  }

  if (!canEdit) {
    return (
      <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="fw-bold mb-1">수정 권한이 없습니다.</div>
          <div className="text-muted small">작성자만 게시글을 수정할 수 있습니다.</div>
        </div>
        <div className="d-flex gap-2">
          <Link href={`/post/${bno}`} className="btn btn-outline-secondary px-4">
            상세로 이동
          </Link>
          <Link href="/" className="btn btn-success px-4">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <PostForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/")}
        submitting={saving}
        showTempSave={false}
        title="게시글 수정"
        subtitle="POST UPDATE"
        badgeText="title / content / tags / thumbnail"
        submitLabel="수정"
        cancelLabel="취소"
      />
    </div>
  );
}
