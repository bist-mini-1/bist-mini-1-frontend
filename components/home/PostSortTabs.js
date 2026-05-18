"use client";

export default function PostSortTabs({ sort, onSortChange, isLogin }) {
  const tabs = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
  ];

  if (isLogin) {
    tabs.push({ value: "recommend", label: "추천순" });
  }

  return (
    <div className="slog-main-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`slog-main-tab ${sort === tab.value ? "active" : ""}`}
          onClick={() => onSortChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}