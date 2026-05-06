import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <div className="card-header fw-bold">404</div>

      <div className="card-body">
        <h4>페이지를 찾을 수 없습니다.</h4>
        <p>요청한 주소가 존재하지 않습니다.</p>

        <Link href="/" className="btn btn-dark btn-sm">
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}