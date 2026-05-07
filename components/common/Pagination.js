export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageGroupSize = 10;

  const currentGroup = Math.ceil(page / pageGroupSize);
  const startPage = (currentGroup - 1) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const pageNumbers = [];

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const movePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const moveNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const movePrevGroup = () => {
    const targetPage = Math.max(page - pageGroupSize, 1);
    onPageChange(targetPage);
  };

  const moveNextGroup = () => {
    const targetPage = Math.min(page + pageGroupSize, totalPages);
    onPageChange(targetPage);
  };

  return (
    <nav className="slog-pagination-wrap" aria-label="게시글 페이지네이션">
      <button
        type="button"
        className="slog-page-button"
        onClick={movePrevGroup}
        disabled={page <= pageGroupSize}
      >
        &lt;&lt;
      </button>

      <button
        type="button"
        className="slog-page-button"
        onClick={movePrevPage}
        disabled={page === 1}
      >
        &lt;
      </button>

      {pageNumbers.map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          className={`slog-page-button ${
            page === pageNumber ? "active" : ""
          }`}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        className="slog-page-button"
        onClick={moveNextPage}
        disabled={page === totalPages}
      >
        &gt;
      </button>

      <button
        type="button"
        className="slog-page-button"
        onClick={moveNextGroup}
        disabled={page > totalPages - pageGroupSize}
      >
        &gt;&gt;
      </button>
    </nav>
  );
}