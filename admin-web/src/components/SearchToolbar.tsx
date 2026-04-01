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
}>;

function SearchToolbar({
  placeholder,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  submitLabel,
  onFilterClick,
  filterLabel = "Filter",
  filterSummary,
}: SearchToolbarProps) {
  const hasActions = Boolean(onSearchSubmit || onFilterClick);

  return (
    <div className="search-toolbar">
      <div className="search-toolbar__main">
        <input
          className="search-toolbar__input"
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearchSubmit?.();
            }
          }}
        />

        {filterSummary ? (
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
              {submitLabel ?? "Search"}
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
