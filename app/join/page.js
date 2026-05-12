import Image from "next/image";
import JoinForm from "@/components/member/JoinForm";

export default function JoinPage() {
  return (
    <main className="slog-join-page">
      <div className="container">
        <div className="slog-join-layout">
          <section className="slog-join-intro">
            <div className="slog-join-logo-wrap">
              <div className="slog-join-logo-box">
                <Image
                  src="/images/slog-logo.png"
                  alt="SLog 로고"
                  fill
                  priority
                  sizes="180px"
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>

            <h1 className="slog-join-heading">
              나의 개발 기록이
              <br />
              자라는 공간
            </h1>

            <p className="slog-join-description">
              관심 태그를 선택하면 내가 좋아하는 주제의 게시글을 더 쉽게 찾아볼
              수 있어요.
            </p>

            <div className="slog-join-feature-list">
              <div className="slog-join-feature-item">
                <span className="slog-join-feature-icon">🌱</span>
                <div>
                  <strong>개발 기록 작성</strong>
                  <p>배운 내용과 프로젝트 과정을 기록</p>
                </div>
              </div>

              <div className="slog-join-feature-item">
                <span className="slog-join-feature-icon">#</span>
                <div>
                  <strong>관심 태그 추천</strong>
                  <p>선택한 태그 기반으로 추천순 제공</p>
                </div>
              </div>

              <div className="slog-join-feature-item">
                <span className="slog-join-feature-icon">♡</span>
                <div>
                  <strong>좋아요와 북마크</strong>
                  <p>다시 보고 싶은 글을 저장</p>
                </div>
              </div>
            </div>
          </section>

          <section className="slog-join-form-section">
            <JoinForm />
          </section>
        </div>
      </div>
    </main>
  );
}
