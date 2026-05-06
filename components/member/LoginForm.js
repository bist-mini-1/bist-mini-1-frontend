"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../api/memberApi";

export default function LoginForm() {
  const router = useRouter();

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

      // 백엔드 응답 형태에 따라 수정 가능
      // 예: data.accessToken 또는 data.token
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("nickname", data.nickname);

      window.dispatchEvent(new Event("authChanged"));

      router.push("/");
    } catch (error) {
      console.log(error);
      setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
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
        </form>
      </div>
    </div>
  );
}
