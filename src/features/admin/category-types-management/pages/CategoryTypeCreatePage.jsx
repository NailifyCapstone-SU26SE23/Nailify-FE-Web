import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ArrowLeft, FolderTree, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminCategoryTypeDetailRoute } from "../../../../shared/constants/routes";
import { createAdminCategoryType } from "../services/categoryTypesManagementService";

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("adminCategoryTypes.nameRequired");
  }

  return "";
}

export function CategoryTypeCreatePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ name: "" });
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(() => [[t("adminCategoryTypes.categoryTypeName"), formValues.name || "--"]], [formValues.name]);

  const handleSubmitRequest = () => {
    const validationError = validateForm(formValues, t);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreate = async () => {
    setIsSaving(true);

    try {
      const createdCategoryType = await createAdminCategoryType(formValues);
      toast.success(t("adminCategoryTypes.createSuccess", { name: createdCategoryType.name }));
      navigate(getAdminCategoryTypeDetailRoute(createdCategoryType.categoryTypeId), {
        state: {
          flashMessage: t("adminCategoryTypes.createFlashSuccess", { name: createdCategoryType.name }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminCategoryTypes.createFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminCategoryTypes}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminCategoryTypes.addNewCategoryType")}</h1>
            <p className="text-xs font-medium text-slate-400">{t("adminCategoryTypes.addNewCategoryTypeDesc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {t("adminCategoryTypes.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminCategoryTypes.saveCategoryType")}
          </button>
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
          <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
            <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
            {t("adminCategoryTypes.categoryTypeDetails")}
          </h2>

          <label className="space-y-2.5">
            <span className="text-[13px] font-semibold text-slate-600">{t("adminCategoryTypes.categoryTypeName")}</span>
            <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
              <FolderTree size={14} className="shrink-0 text-rose-300" />
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => {
                  setFormValues({ name: event.target.value });
                  if (formError) {
                    setFormError("");
                  }
                }}
                placeholder={t("adminCategoryTypes.enterCategoryTypeName")}
                className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
              />
            </div>
          </label>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminCategoryTypes.preview")}
            </h2>

            <div className="space-y-3 rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
              {summaryItems.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="text-right font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={t("adminCategoryTypes.cancelCreateTitle")}
        subtitle={t("adminCategoryTypes.cancelCreateSubtitle")}
        description={t("adminCategoryTypes.cancelCreateDesc")}
        confirmText={t("adminCategoryTypes.discardChanges")}
        cancelText={t("adminCategoryTypes.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminCategoryTypes)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new category type has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminCategoryTypes.saveNewCategoryTypeTitle")}
        subtitle={t("adminCategoryTypes.saveNewCategoryTypeSubtitle")}
        description={t("adminCategoryTypes.saveNewCategoryTypeDesc")}
        confirmText={t("adminCategoryTypes.createCategoryType")}
        cancelText={t("adminCategoryTypes.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreate}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New category type"]}
      />
    </section>
  );
}
