import { ShieldAlert } from "lucide-react";
import { PropTypes } from "../../../shared/utils/propTypes";
import { USER_STATUS_STYLES } from "../services/mockUsers";

export function UserManagementSnapshotCard({ formValues, notice }) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
        User snapshot
      </p>

      <div className="mt-5 rounded-[22px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-semibold text-[#c84b91] shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
            {(formValues.name || "New User")
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0] ?? "")
              .join("")}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-ink)]">
              {formValues.name || "New internal account"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {formValues.email || "Email not set"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${USER_STATUS_STYLES[formValues.status]}`}
          >
            {formValues.status}
          </span>
          <span className="inline-flex rounded-full bg-[#fff] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            {formValues.role}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Branch:</span> {formValues.branch}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Phone:</span>{" "}
          {formValues.phone || "Not provided"}
        </div>
        <div className="rounded-2xl bg-[#fff7ef] px-4 py-4 text-sm leading-6 text-[var(--color-ink)]">
          <span className="font-semibold">Joined:</span> {formValues.joinedAt}
        </div>
      </div>

      <div className="mt-5 rounded-[22px] bg-[#fff0f5] p-5 text-sm leading-6 text-[#9b4b70]">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      </div>
    </article>
  );
}

UserManagementSnapshotCard.propTypes = {
  formValues: PropTypes.shape({
    branch: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    joinedAt: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  notice: PropTypes.string.isRequired,
};
