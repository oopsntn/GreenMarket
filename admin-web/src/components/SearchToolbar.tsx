import "./SearchToolbar.css";

type SearchToolbarProps = Readonly<{
  placeholder: string;
  searchValue?: string;
  onSearchChange?(searchText: string): void;
  onFilterClick?(): void;
}>;

function SearchToolbar({
  placeholder,
  searchValue = "",
  onSearchChange,
  onFilterClick,
}: SearchToolbarProps) {
  return (
    <div className="search-toolbar">
      <input
        className="search-toolbar__input"
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />

      <button
        className="search-toolbar__filter-btn"
        type="button"
        onClick={onFilterClick}
      >
        Filter
      </button>
    </div>
  );
}

export default SearchToolbar;
