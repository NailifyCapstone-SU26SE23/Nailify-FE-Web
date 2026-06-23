import { LoaderCircle, PencilLine, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { UserManagementHeroCard } from "../components/UserManagementHeroCard";
import { UserManagementSnapshotCard } from "../components/UserManagementSnapshotCard";
import {
  deleteAdminUser,
  fetchAdminUserDetail,
  updateAdminUser,
} from "../services/userManagementService";

export function UserManagementDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [initialUser, setInitialUser] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.requestEdit));
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(
    Boolean(location.state?.requestDelete),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const user = await fetchAdminUserDetail(userId);

        if (!isMounted) {
          return;
        }

        const detailValues = {
          ...user,
          branch: user.salon,
          status: user.status,
          joinedAt: user.joinedAt,
          lastActive: user.lastActive,
          notes: "",
        };

        setInitialUser(detailValues);
        setFormValues(detailValues);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load user detail.";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center rounded-[24px] bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          Loading user detail...
        </div>
      </section>
    );
  }

  if (loadError || !initialUser || !formValues) {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  const handleChange = (field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === "firstName" || field === "lastName"
        ? {
            name: [
              field === "firstName" ? nextValue : current.firstName,
              field === "lastName" ? nextValue : current.lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .trim(),
          }
        : {}),
    }));
  };

  const displayName =
    [formValues.firstName, formValues.lastName].filter(Boolean).join(" ").trim() ||
    formValues.name ||
    "User profile";

  const handleSave = async () => {
    const firstName = String(formValues.firstName || "").trim();
    const lastName = String(formValues.lastName || "").trim();
    const email = String(formValues.email || "").trim();

    if (!firstName || !lastName || !email) {
      toast.error("First name, last name, and email are required.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateAdminUser(userId, formValues);
      const nextValues = {
        ...updatedUser,
        branch: updatedUser.salon,
        status: updatedUser.status,
        joinedAt: updatedUser.joinedAt,
        lastActive: updatedUser.lastActive,
        notes: formValues.notes || "",
      };

      setInitialUser(nextValues);
      setFormValues(nextValues);
      setShowSaveConfirm(false);
      setIsEditing(false);
      setFlashMessage("User information updated successfully.");
      toast.success("User updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAdminUser(userId);
      setShowDeleteConfirm(false);
      toast.success("User deleted successfully.");
      navigate(ROUTES.adminUsers, {
        state: {
          flashMessage: `${displayName || formValues.id} has been moved to inactive status.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <UserManagementHeroCard
        backLabel="Back to user list"
        backTo={ROUTES.adminUsers}
        badge="Users"
        title={displayName}
        description="Review the user profile loaded from the backend and manage this account from the admin detail page."
        panelIcon={<PencilLine size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="Detail data is loaded from API. Save and delete actions now call the backend user management endpoints."
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
              updateApiFieldsOnly
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isSaving ? "Saving..." : "Save changes"}</span>
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
                disabled={isDeleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
              >
                {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>{isDeleting ? "Deleting..." : "Delete user"}</span>
              </button>
          </div>
        </article>

        <UserManagementSnapshotCard
          formValues={formValues}
          notice="This profile is loaded from API. Save updates the account, and delete changes the account status to inactive."
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save User Changes"
        subtitle="This will update the user account in the backend."
        description="Confirm to apply the latest edits to this user profile."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[displayName, formValues.role || "Role pending", formValues.status || "Status pending"]}
        details={[
          { label: "Email", value: formValues.email || "No email entered" },
          { label: "Status", value: formValues.status || "Not set" },
        ]}
        warnings={["Only email, first name, last name, phone, and status are sent to the update API."]}
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
        subtitle="This will call the delete API and mark the account as inactive."
        description={`You are about to delete ${displayName || "this user"}. This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Keep User"
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: displayName || "User account",
          meta: `${formValues.role || "Role pending"} | ${formValues.branch || "Branch pending"}`,
          note: formValues.email || "No email entered",
        }}
        warnings={["The backend delete endpoint performs a soft delete by changing the account status to inactive."]}
      />
    </section>
  );
}
