"use client";

import useJoinForm from "../../hooks/useJoinForm";

export default function JoinForm() {
  const {
    joinForm,
    tags,
    errorMessage,
    successMessage,
    handleChange,
    handleToggleInterestTag,
    handleCheckLoginId,
    handleCheckEmail,
    handleCheckNickname,
    handleJoin,
  } = useJoinForm();

  return (
    <div className="slog-auth-card mx-auto">
      <div className="slog-auth-header">
        <h2 className="slog-auth-title">회원가입</h2>
        <p className="slog-auth-subtitle">
          관심 있는 주제를 선택하고 SLog를 시작해보세요.
        </p>
      </div>

      <div className="slog-auth-body">
        {errorMessage && (
          <div className="alert alert-danger py-2 small" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success py-2 small" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleJoin}>
          <div className="mb-3">
            <label className="form-label slog-form-label">아이디</label>
            <div className="input-group">
              <input
                type="text"
                name="loginId"
                className="form-control slog-form-control"
                value={joinForm.loginId}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
              />
              <button
                type="button"
                className="btn slog-btn-check"
                onClick={handleCheckLoginId}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label slog-form-label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="form-control slog-form-control"
              value={joinForm.password}
              onChange={handleChange}
              placeholder="영문, 숫자, 특수문자 포함 8~20자"
            />
          </div>

          <div className="mb-3">
            <label className="form-label slog-form-label">이메일</label>
            <div className="input-group">
              <input
                type="email"
                name="email"
                className="form-control slog-form-control"
                value={joinForm.email}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
              />
              <button
                type="button"
                className="btn slog-btn-check"
                onClick={handleCheckEmail}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label slog-form-label">닉네임</label>
            <div className="input-group">
              <input
                type="text"
                name="nickname"
                className="form-control slog-form-control"
                value={joinForm.nickname}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                className="btn slog-btn-check"
                onClick={handleCheckNickname}
              >
                중복확인
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label slog-form-label">자기소개</label>
            <textarea
              name="bio"
              className="form-control slog-form-control"
              rows="3"
              value={joinForm.bio}
              onChange={handleChange}
              placeholder="자기소개를 입력하세요"
            />
          </div>

          <div className="slog-interest-box mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <label className="form-label slog-form-label mb-1">
                  관심 태그
                </label>
                <p className="slog-help-text mb-0">
                  선택한 태그는 추천순 게시글에 반영됩니다.
                </p>
              </div>

              <span className="slog-selected-count">
                {joinForm.interestTagIds.length}개 선택
              </span>
            </div>

            {tags.length > 0 ? (
              <div className="d-flex flex-wrap gap-2 mt-3 slog-interest-tags">
                {tags.map((tag) => {
                  const selected = joinForm.interestTagIds.includes(tag.tagId);

                  return (
                    <button
                      key={tag.tagId}
                      type="button"
                      className={`btn btn-sm rounded-pill slog-tag-select ${
                        selected ? "active" : ""
                      }`}
                      onClick={() => handleToggleInterestTag(tag.tagId)}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="slog-empty-tags">선택 가능한 태그가 없습니다.</div>
            )}
          </div>

          <button type="submit" className="btn slog-btn-submit w-100">
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}