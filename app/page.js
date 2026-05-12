"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostList from "@/components/posts/PostList";
import Pagination from "@/components/common/Pagination";
import SearchBox from "@/components/common/SearchBox";
import PostSortTabs from "@/components/home/PostSortTabs";
import { getPostList } from "@/api/postApi";
import useAuth from "@/hooks/useAuth";

const PAGE_SIZE = 12;

export default function Home() {
  const { authInfo } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    getPostList({
      page,
      size: PAGE_SIZE,
      keyword: searchKeyword,
      sort,
    })
      .then((data) => {
        if (!isActive) {
          return;
        }

        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(error);
        alert("게시글 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [page, searchKeyword, sort]);

  const handleLikeChanged = ({ postId, isLiked, likeCount }) => {
    setPosts((prevPosts) => {
      const updatedPosts = prevPosts.map((post) =>
        post.postId === postId
          ? {
              ...post,
              isLiked,
              likeCount,
            }
          : post,
      );

      if (sort !== "popular") {
        return updatedPosts;
      }

      return [...updatedPosts].sort((a, b) => {
        const likeDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);

        if (likeDiff !== 0) {
          return likeDiff;
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === page) {
      return;
    }

    setLoading(true);
    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (keyword) => {
    if (keyword === searchKeyword && page === 1) {
      return;
    }

    setLoading(true);
    setPage(1);
    setSearchKeyword(keyword);
  };

  const handleSortChange = (nextSort) => {
    if (nextSort === sort && page === 1) {
      return;
    }

    setLoading(true);
    setPage(1);
    setSort(nextSort);
  };

  return (
    <main>
      <section>
        <div className="post-section-header">
          <PostSortTabs
            sort={sort}
            onSortChange={handleSortChange}
            isLogin={authInfo.isLogin}
          />

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
              onLikeChanged={handleLikeChanged}
              emptyMessage={
                searchKeyword
                  ? "검색 결과가 없습니다."
                  : sort === "recommend"
                    ? "관심 태그와 일치하는 추천 게시글이 없습니다."
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