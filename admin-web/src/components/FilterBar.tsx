import "./FilterBar.css";

export type FilterField = {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
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
          <select
            id={field.id}
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export default FilterBar;
