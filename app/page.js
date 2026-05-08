"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostList from "@/components/posts/PostList";
import Pagination from "@/components/common/Pagination";
import SearchBox from "@/components/common/SearchBox";
import { getPostList } from "@/api/postApi";

const PAGE_SIZE = 12;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPostList = async () => {
      try {
        setLoading(true);

        const data = await getPostList({
          page,
          size: PAGE_SIZE,
          keyword: searchKeyword,
        });

        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        console.error(error);
        alert("게시글 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPostList();
  }, [page, searchKeyword]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (keyword) => {
    setPage(1);
    setSearchKeyword(keyword);
  };

  return (
    <main>
      <section>
        <div className="post-section-header">
          <div className="post-tab-active">
            {searchKeyword ? "검색 결과" : "최신"}
          </div>

          <div className="post-header-search">
            <SearchBox onSearch={handleSearch} searchKeyword={searchKeyword} />
          </div>

          <Link href="/posts/write" className="btn slog-btn-write">
            새 글 작성
          </Link>
        </div>

        {searchKeyword && (
          <div className="slog-search-result-text">
            <strong className="text-dark">{searchKeyword}</strong> 검색 결과{" "}
            <strong>{totalCount}</strong>개
          </div>
        )}

        {loading ? (
          <div className="text-center py-5 text-muted">
            게시글을 불러오는 중...
          </div>
        ) : (
          <>
            <PostList
              posts={posts}
              emptyMessage={
                searchKeyword
                  ? "검색 결과가 없습니다."
                  : "등록된 게시글이 없습니다."
              }
            />

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