"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useAuth";
import Image from "next/image";
import NotificationBell from "../notification/NotificationBell";

export default function AppHeader() {
  const router = useRouter();
  const { authInfo, logoutAuth } = useAuth();

  const handleLogout = () => {
    logoutAuth();
    router.push("/");
  };

  return (
    <nav
      className="navbar bg-white border-bottom"
      style={{
        height: "80px",
      }}
    >
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="/" className="navbar-brand d-flex align-items-center m-0">
          <div className="slog-header-logo-wrap">
            <Image
              src="/images/slog-logo.png"
              alt="SLog 로고"
              fill
              priority
              sizes="150px"
              style={{
                objectFit: "contain",
              }}
            />
          </div>
        </Link>

        <div className="d-flex align-items-center gap-2">
          <NotificationBell />

          {authInfo.isLogin ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/Mypage/character")}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#198754",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(25,135,84,0.3)",
                  }}
                >
                  {authInfo.nickname
                    ? authInfo.nickname.charAt(0).toUpperCase()
                    : "U"}
                </div>
              </button>

              <button
                type="button"
                className="btn btn-sm slog-btn-outline"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-sm slog-btn-outline">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
