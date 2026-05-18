"use client";

import { useState } from "react";

export default function SearchBox({ onSearch, searchKeyword }) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedKeyword = keyword.trim();
    onSearch(trimmedKeyword);
  };

  const handleClear = () => {
    setKeyword("");
    onSearch("");
  };

  return (
    <form className="slog-search-box" onSubmit={handleSubmit}>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>

        <input
          type="text"
          className="form-control border-start-0"
          placeholder="제목, 내용, 태그, 작성자로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        {searchKeyword && (
          <button
            type="button"
            className="btn slog-search-clear-button"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}

        <button type="submit" className="btn slog-btn-search">
          검색
        </button>
      </div>
    </form>
  );
}