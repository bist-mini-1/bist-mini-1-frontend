"use client";

import { useEffect, useState } from "react";
import { getRecommendedPosts } from "@/api/postApi";
import PostCard from "@/components/posts/PostCard";

export default function RecommendedPostList({ postId }) {
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      return;
    }

    let isMounted = true;

    const fetchRecommendedPosts = async () => {
      try {
        setLoading(true);

        const data = await getRecommendedPosts(postId, 4);
        const posts = data?.data ?? data ?? [];

        if (isMounted) {
          setRecommendedPosts(Array.isArray(posts) ? posts : []);
        }
      } catch (error) {
        console.error("recommended posts error:", error);

        if (isMounted) {
          setRecommendedPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendedPosts();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleLikeChanged = ({ postId, isLiked, likeCount }) => {
    setRecommendedPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === postId
          ? {
              ...post,
              isLiked,
              likeCount,
            }
          : post
      )
    );
  };

  if (loading) {
    return (
      <section className="recommended-post-section">
        <div className="recommended-post-header">
          <h3 className="recommended-post-title">추천 게시물</h3>
          <p className="recommended-post-subtitle">
            비슷한 태그를 가진 게시물을 찾고 있어요.
          </p>
        </div>

        <div className="recommended-post-loading">
          추천 게시물을 불러오는 중...
        </div>
      </section>
    );
  }

  if (recommendedPosts.length === 0) {
    return null;
  }

  return (
    <section className="recommended-post-section">
      <div className="recommended-post-header">
        <h3 className="recommended-post-title">추천 게시물</h3>
        <p className="recommended-post-subtitle">
          비슷한 태그를 가진 게시물이에요.
        </p>
      </div>

      <div className="row recommended-post-grid">
        {recommendedPosts.map((post) => (
          <div className="col-md-6 mb-4" key={post.postId}>
            <PostCard post={post} onLikeChanged={handleLikeChanged} />
          </div>
        ))}
      </div>
    </section>
  );
}