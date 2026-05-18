import Link from "next/link";

export default function NotFound() {
  return (
    <main className="slog-error-page">
      <section className="slog-error-card">
        <div className="slog-error-icon">🌱</div>

        <div className="slog-error-code">404</div>

        <h1 className="slog-error-title">페이지를 찾을 수 없습니다</h1>

        <p className="slog-error-description">
          요청하신 주소가 변경되었거나 존재하지 않는 페이지입니다.
          <br />
          홈으로 이동해 다시 확인해주세요.
        </p>

        <Link href="/" className="btn slog-btn-submit slog-error-home-button">
          홈으로 이동
        </Link>
      </section>
    </main>
  );
}