import { Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { UserManagementHeroCard } from "../components/UserManagementHeroCard";
import { UserManagementSnapshotCard } from "../components/UserManagementSnapshotCard";
import { createEmptyUser } from "../services/mockUsers";

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
      <UserManagementHeroCard
        backLabel="Back to user list"
        backTo={ROUTES.adminUsers}
        badge="Users"
        title="Create internal user"
        description="Set up a mock internal account with role, branch, and onboarding status from a dedicated create page."
        panelIcon={<UserPlus size={18} className="text-[#d45b9f]" />}
        panelTitle="Create mode"
        panelDescription="This page is dedicated to creating a user, while detail pages stay focused on reviewing and editing an existing account."
      />

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

        <UserManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Create action updates the UI flow, but it does not persist data outside this screen."
        />
      </div>
    </section>
  );
}
