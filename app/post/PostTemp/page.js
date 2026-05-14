"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { deleteTempPost, getTempPostList } from "@/api/postApi";

const extractPosts = (response) => {
  if (!response) {
    return [];
  }

  return response.data ?? response.post ?? response.result ?? response ?? [];
};

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PostTempPage() {
  const router = useRouter();
  const { authInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tempPosts, setTempPosts] = useState([]);

  const reloadTempPosts = async () => {
    try {
      const response = await getTempPostList();
      const posts = extractPosts(response);
      setTempPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error("임시저장 글 목록 조회 실패:", error);
      setTempPosts([]);
    }
  };

  useEffect(() => {
    if (!authInfo.isLogin) {
      setLoading(false);
      setTempPosts([]);
      return;
    }

    let isMounted = true;

    const loadTempPosts = async () => {
      try {
        const response = await getTempPostList();
        const posts = extractPosts(response);
        if (isMounted) {
          setTempPosts(Array.isArray(posts) ? posts : []);
        }
      } catch (error) {
        console.error("임시저장 글 목록 조회 실패:", error);
        if (isMounted) {
          setTempPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTempPosts();

    return () => {
      isMounted = false;
    };
  }, [authInfo.isLogin]);

  const handleDelete = async (postId, title) => {
    if (!postId) {
      return;
    }

    if (!window.confirm(`임시저장 글 '${title || "제목 없음"}'을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteTempPost(postId);
      await reloadTempPosts();
    } catch (error) {
      console.error("임시저장 글 삭제 실패:", error);
      alert("임시저장 글 삭제에 실패했습니다.");
    }
  };

  if (!authInfo.isLogin) {
    return (
      <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="fw-bold mb-1">로그인이 필요합니다.</div>
          <div className="text-muted small">임시저장 글을 보려면 먼저 로그인하세요.</div>
        </div>
        <button type="button" className="btn btn-success px-4" onClick={() => router.push("/login") }>
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">
        <div>
          <div className="text-muted small fw-semibold mb-1">POST TEMP</div>
          <h1 className="h3 fw-bold mb-0">임시저장함</h1>
        </div>
        <Link href="/post/PostWrite" className="btn btn-success px-4">
          새 글 작성
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">임시저장 글을 불러오는 중...</div>
      ) : tempPosts.length === 0 ? (
        <div className="alert alert-light border rounded-4 text-center py-5 mb-0">
          <i className="bi bi-inbox fs-1 d-block mb-3 text-muted"></i>
          <div className="fw-semibold mb-1">임시저장된 글이 없습니다.</div>
          <div className="text-muted small mb-3">작성 중인 글을 임시저장하면 여기서 다시 불러올 수 있습니다.</div>
          <Link href="/post/PostWrite" className="btn btn-outline-success px-4">
            게시글 작성하러 가기
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {tempPosts.map((post) => (
            <div key={post.postId} className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4 d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h2 className="h5 fw-bold mb-1 text-truncate">{post.title || "제목 없음"}</h2>
                      <div className="text-muted small text-truncate">{String(post.content || "").replace(/<[^>]+>/g, " ").slice(0, 120) || "내용 미리보기 없음"}</div>
                    </div>
                    <span className="badge text-bg-light border align-self-start">임시저장</span>
                  </div>

                  <div className="d-flex flex-wrap gap-2 text-muted small">
                    <span>공개 여부: {post.isPublic === "N" ? "비공개" : "공개"}</span>
                    <span>수정일: {formatDateTime(post.updatedAt)}</span>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-auto">
                    <Link href={`/post/PostWrite?draftId=${post.postId}`} className="btn btn-success px-4">
                      불러오기
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger px-4"
                      onClick={() => handleDelete(post.postId, post.title)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
