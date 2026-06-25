import {
  NAIL_DESIGN_CATEGORY_OPTIONS,
  NAIL_DESIGN_COLLECTION_OPTIONS,
  NAIL_DESIGN_POPULARITY_OPTIONS,
  NAIL_DESIGN_STATUS_FILTERS,
} from "../services/mockNailDesigns";
import { PropTypes } from "../../../../shared/utils/propTypes";

const FORM_STATUS_OPTIONS = NAIL_DESIGN_STATUS_FILTERS.filter(
  (item) => item !== "All",
);
const INPUT_CLASSNAME =
  "w-full rounded-2xl border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]";
const DISABLED_INPUT_CLASSNAME = "cursor-not-allowed bg-[#f9f1ea] text-[#8f7c6d]";

export function NailDesignManagementFormFields({
  formValues,
  onFieldChange,
  disabled = false,
}) {
  return (
    <>
      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Design name
        </span>
        <input
          value={formValues.name}
          onChange={onFieldChange("name")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Enter design name"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Collection
        </span>
        <select
          value={formValues.collection}
          onChange={onFieldChange("collection")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {NAIL_DESIGN_COLLECTION_OPTIONS.map((collection) => (
            <option key={collection} value={collection}>
              {collection}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Category
        </span>
        <select
          value={formValues.category}
          onChange={onFieldChange("category")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {NAIL_DESIGN_CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Status
        </span>
        <select
          value={formValues.status}
          onChange={onFieldChange("status")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {FORM_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Price</span>
        <input
          value={formValues.price}
          onChange={onFieldChange("price")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Example: 420,000 VND"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Duration
        </span>
        <input
          value={formValues.duration}
          onChange={onFieldChange("duration")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Example: 75 min"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Lead artist
        </span>
        <input
          value={formValues.artist}
          onChange={onFieldChange("artist")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Enter lead artist name"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Popularity
        </span>
        <select
          value={formValues.popularity}
          onChange={onFieldChange("popularity")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {NAIL_DESIGN_POPULARITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Updated date
        </span>
        <input
          type="date"
          value={formValues.updatedAt}
          onChange={onFieldChange("updatedAt")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Color palette
        </span>
        <input
          value={formValues.palette}
          onChange={onFieldChange("palette")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Example: pearl white, blush pink, silver"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Tags</span>
        <input
          value={formValues.tags}
          onChange={onFieldChange("tags")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Example: chrome, bridal, glossy"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Description
        </span>
        <textarea
          value={formValues.description}
          onChange={onFieldChange("description")}
          rows={4}
          disabled={disabled}
          className={`w-full rounded-[22px] border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4] ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Describe the design concept"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Admin notes
        </span>
        <textarea
          value={formValues.notes}
          onChange={onFieldChange("notes")}
          rows={5}
          disabled={disabled}
          className={`w-full rounded-[22px] border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4] ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Add merchandising or publishing notes"
        />
      </label>
    </>
  );
}

NailDesignManagementFormFields.propTypes = {
  formValues: PropTypes.shape({
    artist: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    collection: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    palette: PropTypes.string.isRequired,
    popularity: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    tags: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
