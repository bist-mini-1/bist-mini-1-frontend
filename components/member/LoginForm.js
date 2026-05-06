"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "../../api/memberApi";
import useAuth from "../../hooks/useAuth";

export default function LoginForm() {
  const router = useRouter();
  const { loginAuth } = useAuth();

  const [loginForm, setLoginForm] = useState({
    loginId: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    setLoginForm((prevLoginForm) => ({
      ...prevLoginForm,
      [event.target.name]: event.target.value,
    }));

    setErrorMessage("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginForm.loginId.trim()) {
      setErrorMessage("아이디를 입력해주세요.");
      return;
    }

    if (!loginForm.password.trim()) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const data = await login(loginForm);

      loginAuth(data);

      router.push("/");
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message || "아이디 또는 비밀번호가 일치하지 않습니다.";

      setErrorMessage(message);
    }
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: "420px" }}>
      <div className="card-header fw-bold">로그인</div>

      <div className="card-body">
        {errorMessage && (
          <div className="alert alert-danger py-2" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">아이디</label>
            <input
              type="text"
              name="loginId"
              className="form-control"
              value={loginForm.loginId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={loginForm.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button type="submit" className="btn btn-dark w-100">
            로그인
          </button>

          <div className="text-center mt-3">
            <span className="text-muted small">아직 회원이 아니신가요? </span>
            <Link href="/join" className="small">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}