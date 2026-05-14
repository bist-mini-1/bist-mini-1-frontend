import { Suspense } from "react";
import PostWriteClient from "./PostWriteClient";

export default function PostWritePage() {
  return (
    <Suspense fallback={<div className="py-2 text-center text-muted">게시글 작성 화면을 불러오는 중...</div>}>
      <PostWriteClient />
    </Suspense>
  );
}