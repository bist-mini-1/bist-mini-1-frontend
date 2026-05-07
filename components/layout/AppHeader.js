"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useAuth";
import Image from "next/image";

export default function AppHeader() {
  const router = useRouter();
  const { authInfo, logoutAuth } = useAuth();

  const handleLogout = () => {
    logoutAuth();
    router.push("/");
  };

  return (
    <nav className="navbar bg-white border-bottom">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <Image
            src="/images/slog-logo.png"
            alt="SLog 로고"
            width={350}
            height={50}
            priority
            style={{ objectFit: "contain" }}
          />
        </Link>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm">
            알림
          </button>

          {authInfo.isLogin ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/Mypage")}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3cb878, #2a9d5c)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(44,157,92,0.35)",
                  }}
                >
                  {authInfo.nickname ? authInfo.nickname.charAt(0).toUpperCase() : "U"}
                </div>
              </button>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-dark btn-sm">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
