import {
  USER_BRANCH_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_FILTERS,
} from "../services/mockUsers";

const FORM_STATUS_OPTIONS = USER_STATUS_FILTERS.filter((item) => item !== "All");
const INPUT_CLASSNAME =
  "w-full rounded-2xl border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]";
const DISABLED_INPUT_CLASSNAME = "cursor-not-allowed bg-[#f9f1ea] text-[#8f7c6d]";

export function UserManagementFormFields({
  formValues,
  onFieldChange,
  disabled = false,
}) {
  return (
    <>
      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Full name
        </span>
        <input
          value={formValues.name}
          onChange={onFieldChange("name")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Enter full name"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Email</span>
        <input
          value={formValues.email}
          onChange={onFieldChange("email")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Enter work email"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Phone</span>
        <input
          value={formValues.phone}
          onChange={onFieldChange("phone")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Enter phone number"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Joined date
        </span>
        <input
          type="date"
          value={formValues.joinedAt}
          onChange={onFieldChange("joinedAt")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Role</span>
        <select
          value={formValues.role}
          onChange={onFieldChange("role")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Branch</span>
        <select
          value={formValues.branch}
          onChange={onFieldChange("branch")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
        >
          {USER_BRANCH_OPTIONS.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Status</span>
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
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Last active
        </span>
        <input
          value={formValues.lastActive}
          onChange={onFieldChange("lastActive")}
          disabled={disabled}
          className={`${INPUT_CLASSNAME} ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Example: 10 min ago"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">Notes</span>
        <textarea
          value={formValues.notes}
          onChange={onFieldChange("notes")}
          rows={5}
          disabled={disabled}
          className={`w-full rounded-[22px] border border-[#f1d7c0] bg-[#fffdfb] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4] ${disabled ? DISABLED_INPUT_CLASSNAME : ""}`}
          placeholder="Add internal notes for this user"
        />
      </label>
    </>
  );
}
