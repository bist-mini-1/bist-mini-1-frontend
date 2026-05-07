"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostList from "@/components/posts/PostList";
import Pagination from "@/components/common/Pagination";
import { getPostList } from "@/api/postApi";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchPostList = async (pageNumber) => {
    try {
      setLoading(true);

      const data = await getPostList({
        page: pageNumber,
        size,
      });

      setPosts(data.posts || []);
      setPage(data.page || pageNumber);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert("게시글 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostList(page);
  }, [page]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <section>
        <div className="post-section-header">
          <div className="post-tab-active">최신</div>

          <Link href="/posts/write" className="btn slog-btn-write">
            새 글 작성
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted">
            게시글을 불러오는 중...
          </div>
        ) : (
          <>
            <PostList posts={posts} />

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </main>
  );
}