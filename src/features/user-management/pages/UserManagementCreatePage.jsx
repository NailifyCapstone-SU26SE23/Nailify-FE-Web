import { ArrowLeft, Save, ShieldAlert, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { createEmptyUser, USER_STATUS_STYLES } from "../services/mockUsers";

export function UserManagementCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyUser);

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreate = () => {
    navigate(ROUTES.adminUsers, {
      state: {
        flashMessage: `Mock create completed for ${formValues.name || "new user"}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between md:p-8">
          <div className="max-w-full md:max-w-[32rem]">
            <Link
              to={ROUTES.adminUsers}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#d45b9f] transition hover:text-[#c73a87]"
            >
              <ArrowLeft size={16} />
              <span>Back to user list</span>
            </Link>
            <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
              User Management
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              Create internal user
            </h2>
            <p className="mt-3 text-base leading-8 text-[var(--color-muted)]">
              Set up a mock internal account with role, branch, and onboarding
              status from a dedicated create page.
            </p>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-4 text-sm text-[var(--color-muted)] shadow-[0_14px_30px_rgba(94,76,62,0.06)] sm:p-5 md:max-w-[22rem]">
            <div className="flex items-center gap-3 text-[var(--color-ink)]">
              <div className="rounded-2xl bg-white p-3 shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
                <UserPlus size={18} className="text-[#d45b9f]" />
              </div>
              <div>
                <p className="font-semibold">Create mode</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                  Mock CRUD
                </p>
              </div>
            </div>
            <p className="mt-4 leading-6">
              This page is dedicated to creating a user, while detail pages stay
              focused on reviewing and editing an existing account.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <UserManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
            >
              <Save size={16} />
              <span>Create user</span>
            </button>
          </div>
        </article>

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
              <p>
                This is mock CRUD only. Create action updates the UI flow, but it
                does not persist data outside this screen.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
