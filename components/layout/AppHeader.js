"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useAuth";

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
        <Link href="/" className="navbar-brand fw-bold">
          StudyLog
        </Link>

        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm">
            알림
          </button>

          {authInfo.isLogin ? (
            <>
              <span className="small text-muted">{authInfo.nickname}님</span>
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
