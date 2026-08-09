import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { UserManagementHeroCard } from "../components/UserManagementHeroCard";
import { UserManagementSnapshotCard } from "../components/UserManagementSnapshotCard";
import { createAdminUser } from "../services/userManagementService";

export function UserManagementCreatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(() => ({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    avatarUrl: "",
    role: "Receptionist",
  }));
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const displayName = [formValues.firstName, formValues.lastName].filter(Boolean).join(" ").trim();

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreate = async () => {
    if (isSubmitting) {
      return;
    }

    if (!formValues.firstName.trim() || !formValues.lastName.trim() || !formValues.email.trim() || !formValues.password.trim()) {
      setSubmitError(t("userManagement.detail.validationRequired"));
      return;
    }

    const isSalonRole = ["staff", "staff_artist", "receptionist", "manager"].includes(
      String(formValues.role || "").trim().toLowerCase()
    );

    if (isSalonRole && !formValues.salonId) {
      const errMsg = language === "vi" ? "Vui lòng chọn chi nhánh Salon." : "Please select a salon branch.";
      setSubmitError(errMsg);
      toast.error(errMsg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const createdUser = await createAdminUser(formValues);

      toast.success(t("userManagement.detail.createSuccess"));
      navigate(ROUTES.adminUsers, {
        state: {
          flashMessage: t("userManagement.detail.createFlashSuccess", { name: createdUser.name || displayName }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("userManagement.detail.createFailed");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setShowCreateConfirm(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <UserManagementHeroCard
        backLabel={t("userManagement.detail.backLabel") || t("back")}
        backTo={ROUTES.adminUsers}
        badge={t("menus.admin-users") || "Users"}
        title={t("userManagement.detail.createInternalUser")}
        description={t("userManagement.detail.createInternalUserDesc")}
        panelIcon={<UserPlus size={18} className="text-[#d45b9f]" />}
        panelTitle={t("userManagement.detail.createMode")}
        panelDescription={t("userManagement.detail.createPayloadDesc")}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <UserManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={isSubmitting}
              createApiFieldsOnly
            />
          </div>

          {submitError ? (
            <div className="mt-4 rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
              {submitError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowCreateConfirm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              <Save size={16} />
              <span>{isSubmitting ? t("userManagement.detail.creating") : t("userManagement.detail.createUser")}</span>
            </button>
          </div>
        </article>

        <UserManagementSnapshotCard
          formValues={formValues}
          notice={t("userManagement.detail.createNotice")}
        />
      </div>

      <ActionConfirmModal
        open={showCreateConfirm}
        intent="success"
        title={t("userManagement.detail.createUser")}
        subtitle={t("userManagement.detail.createNotice")}
        description={t("userManagement.detail.saveUserChangesDesc")}
        confirmText={t("userManagement.detail.createUser")}
        cancelText={t("userManagement.detail.reviewAgain")}
        confirmIcon={Save}
        loading={isSubmitting}
        onConfirm={handleCreate}
        onCancel={() => setShowCreateConfirm(false)}
        highlights={[displayName || "New user", formValues.role || "Role pending", formValues.email || "Email pending"]}
        details={[
          { label: t("userManagement.detail.email"), value: formValues.email || t("userManagement.detail.emailNotSet") },
          { label: t("userManagement.detail.phone"), value: formValues.phone || t("userManagement.detail.phoneNotProvided") },
        ]}
        warnings={[t("userManagement.detail.createNotice")]}
      />
    </section>
  );
}
