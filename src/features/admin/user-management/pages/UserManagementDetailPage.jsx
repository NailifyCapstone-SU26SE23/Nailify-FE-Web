import { PencilLine, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { UserManagementHeroCard } from "../components/UserManagementHeroCard";
import { UserManagementSnapshotCard } from "../components/UserManagementSnapshotCard";
import { getMockUserById } from "../services/mockUsers";

export function UserManagementDetailPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const initialUser = getMockUserById(userId);
  const [formValues, setFormValues] = useState(initialUser);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!initialUser) {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    setShowSaveConfirm(false);
    setIsEditing(false);
    setFlashMessage("Mock update completed. Changes are local to this detail screen.");
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialUser);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    navigate(ROUTES.adminUsers, {
      state: {
        flashMessage: `Mock delete completed for ${formValues.name || formValues.id}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <UserManagementHeroCard
        backLabel="Back to user list"
        backTo={ROUTES.adminUsers}
        badge="Users"
        title={formValues.name}
        description="Review the user profile, update fields, or perform a mock delete from this detail page."
        panelIcon={<PencilLine size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="All actions here are UI-only and do not persist outside this feature."
      />

      {flashMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <UserManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
              >
                <PencilLine size={16} />
                <span>Edit user</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>Delete user</span>
            </button>
          </div>
        </article>

        <UserManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save User Changes"
        subtitle="This will update the user in the current mock detail flow."
        description="Confirm to apply the latest edits to this user profile."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.name || "User profile", formValues.role || "Role pending", formValues.branch || "Branch pending"]}
        details={[
          { label: "Email", value: formValues.email || "No email entered" },
          { label: "Status", value: formValues.status || "Not set" },
        ]}
        warnings={["This mock update changes the UI flow only and does not persist outside this screen."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Discard User Edits"
        subtitle="You are about to leave edit mode without saving."
        description="Unsaved changes on this user profile will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: "Editing Mode", value: "User profile detail" },
          { label: "Result", value: "Revert to last loaded values" },
        ]}
        warnings={["Any unsaved changes to this user will be lost immediately."]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete User"
        subtitle="This will remove the user from the current mock admin flow."
        description={`You are about to delete ${formValues.name || "this user"}. This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Keep User"
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: formValues.name || "User account",
          meta: `${formValues.role || "Role pending"} • ${formValues.branch || "Branch pending"}`,
          note: formValues.email || "No email entered",
        }}
        warnings={["This mock delete updates the navigation flow only and does not persist outside this feature."]}
      />
    </section>
  );
}
