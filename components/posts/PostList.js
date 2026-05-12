import PostCard from "./PostCard";

export default function PostList({
  posts,
  onLikeChanged,
  emptyMessage = "등록된 게시글이 없습니다.",
}) {
  if (!posts || posts.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center text-muted py-5">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      {posts.map((post) => (
        <div className="col-sm-6 col-lg-4 col-xl-3 mb-4" key={post.postId}>
          <PostCard post={post} onLikeChanged={onLikeChanged} />
        </div>
      ))}
    </div>
  );
}