import { Search } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

export function SearchBox({
  className = "",
  onChange,
  placeholder = "Search...",
  value = "",
}) {
  return (
    <label className={`relative block ${className}`.trim()}>
      <Search
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
      />
    </label>
  );
}

SearchBox.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};
