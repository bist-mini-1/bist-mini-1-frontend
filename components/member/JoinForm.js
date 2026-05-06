"use client";

import useJoinForm from "../../hooks/useJoinForm";

export default function JoinForm() {
  const {
    joinForm,
    errorMessage,
    successMessage,
    handleChange,
    handleCheckLoginId,
    handleCheckEmail,
    handleCheckNickname,
    handleJoin,
  } = useJoinForm();

  return (
    <div className="card mx-auto" style={{ maxWidth: "500px" }}>
      <div className="card-header fw-bold">회원가입</div>

      <div className="card-body">
        {errorMessage && (
          <div className="alert alert-danger py-2" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success py-2" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleJoin}>
          <div className="mb-3">
            <label className="form-label">아이디</label>
            <div className="input-group">
              <input
                type="text"
                name="loginId"
                className="form-control"
                value={joinForm.loginId}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCheckLoginId}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={joinForm.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">이메일</label>
            <div className="input-group">
              <input
                type="email"
                name="email"
                className="form-control"
                value={joinForm.email}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCheckEmail}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">닉네임</label>
            <div className="input-group">
              <input
                type="text"
                name="nickname"
                className="form-control"
                value={joinForm.nickname}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCheckNickname}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">자기소개</label>
            <textarea
              name="bio"
              className="form-control"
              rows="3"
              value={joinForm.bio}
              onChange={handleChange}
              placeholder="자기소개를 입력하세요"
            />
          </div>

          <button type="submit" className="btn btn-dark w-100">
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}