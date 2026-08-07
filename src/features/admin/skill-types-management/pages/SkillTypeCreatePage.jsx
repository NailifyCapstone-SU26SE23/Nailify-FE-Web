import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ArrowLeft, FileText, FolderTree, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminSkillTypeDetailRoute } from "../../../../shared/constants/routes";
import { createAdminSkillType } from "../services/skillTypesManagementService";

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("adminSkillTypes.nameRequired");
  }

  if (!String(formValues.description || "").trim()) {
    return t("adminSkillTypes.descriptionRequired");
  }

  return "";
}

export function SkillTypeCreatePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      [t("adminSkillTypes.skillTypeName"), formValues.name || "--"],
      [t("adminSkillTypes.description"), formValues.description || "--"],
    ],
    [formValues.description, formValues.name],
  );

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

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
      const createdSkillType = await createAdminSkillType(formValues);
      toast.success(t("adminSkillTypes.createSuccess", { name: createdSkillType.name }));
      navigate(getAdminSkillTypeDetailRoute(createdSkillType.skillTypeId), {
        state: {
          flashMessage: t("adminSkillTypes.createFlashSuccess", { name: createdSkillType.name }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminSkillTypes.createFailed");
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
            to={ROUTES.adminSkillTypes}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminSkillTypes.addNewSkillType")}</h1>
            <p className="text-xs font-medium text-slate-400">{t("adminSkillTypes.addNewSkillTypeDesc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {t("adminSkillTypes.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminSkillTypes.saveSkillType")}
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
            {t("adminSkillTypes.skillTypeDetails")}
          </h2>

          <div className="grid gap-5">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminSkillTypes.skillTypeName")}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FolderTree size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder={t("adminSkillTypes.enterSkillTypeName")}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminSkillTypes.description")}</span>
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FileText size={14} className="mt-0.5 shrink-0 text-rose-300" />
                <textarea
                  rows={5}
                  value={formValues.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  placeholder="Enter skill type description"
                  className="w-full resize-none bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminSkillTypes.preview")}
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
        title={t("adminSkillTypes.cancelCreateTitle")}
        subtitle={t("adminSkillTypes.cancelCreateSubtitle")}
        description={t("adminSkillTypes.cancelCreateDesc")}
        confirmText={t("adminSkillTypes.discardChanges")}
        cancelText={t("adminSkillTypes.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminSkillTypes)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new skill type has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminSkillTypes.saveNewSkillTypeTitle")}
        subtitle={t("adminSkillTypes.saveNewSkillTypeSubtitle")}
        description={t("adminSkillTypes.saveNewSkillTypeDesc")}
        confirmText={t("adminSkillTypes.createSkillType")}
        cancelText={t("adminSkillTypes.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreate}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New skill type"]}
        details={[{ label: "Description", value: formValues.description || "--" }]}
      />
    </section>
  );
}
