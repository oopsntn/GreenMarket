import "./SearchToolbar.css";

type SearchToolbarProps = Readonly<{
  placeholder: string;
  searchValue?: string;
  onSearchChange?(searchText: string): void;
  onSearchSubmit?(): void;
  submitLabel?: string;
  onFilterClick?(): void;
  filterLabel?: string;
  filterSummary?: string;
  filterSummaryLabel?: string;
  filterSummaryItems?: string[];
}>;

function SearchToolbar({
  placeholder,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  submitLabel,
  onFilterClick,
  filterLabel = "Bộ lọc",
  filterSummary,
  filterSummaryLabel = "Bộ lọc hiện tại",
  filterSummaryItems,
}: SearchToolbarProps) {
  const hasActions = Boolean(onSearchSubmit || onFilterClick);
  const summaryItems = filterSummaryItems?.filter(Boolean) ?? [];
  const hasSummaryItems = summaryItems.length > 0;

  return (
    <div className="search-toolbar">
      <div className="search-toolbar__main">
        <input
          className="search-toolbar__input"
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearchSubmit?.();
            }
          }}
        />

        {hasSummaryItems ? (
          <div className="search-toolbar__summary">
            <span className="search-toolbar__summary-label">
              {filterSummaryLabel}
            </span>

            <div className="search-toolbar__summary-tags">
              {summaryItems.map((item) => (
                <span
                  key={item}
                  className={`search-toolbar__summary-tag${
                    item === "All" || item === "Tất cả"
                      ? " search-toolbar__summary-tag--muted"
                      : ""
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : filterSummary ? (
          <p className="search-toolbar__summary">{filterSummary}</p>
        ) : null}
      </div>

      {hasActions ? (
        <div className="search-toolbar__actions">
          {onSearchSubmit ? (
            <button
              className="search-toolbar__submit-btn"
              type="button"
              onClick={onSearchSubmit}
            >
              {submitLabel ?? "Tìm kiếm"}
            </button>
          ) : null}

          {onFilterClick ? (
            <button
              className="search-toolbar__filter-btn"
              type="button"
              onClick={onFilterClick}
            >
              {filterLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default SearchToolbar;
