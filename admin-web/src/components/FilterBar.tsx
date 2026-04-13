import "./FilterBar.css";

export type FilterField = {
  id: string;
  label: string;
  type?: "select" | "date";
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  optionLabels?: Record<string, string>;
};

type FilterBarProps = {
  fields: FilterField[];
};

function FilterBar({ fields }: FilterBarProps) {
  return (
    <div className="filter-bar">
      {fields.map((field) => (
        <div key={field.id} className="filter-bar__field">
          <label htmlFor={field.id}>{field.label}</label>

          {field.type === "date" ? (
            <input
              id={field.id}
              type="date"
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          ) : (
            <select
              id={field.id}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {field.optionLabels?.[option] ?? option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}

export default FilterBar;
