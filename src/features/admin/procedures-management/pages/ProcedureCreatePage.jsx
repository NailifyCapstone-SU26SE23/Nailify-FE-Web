import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  ClipboardList,
  Clock3,
  FileText,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminProcedureDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminProcedure,
  formatProcedureDuration,
} from "../services/proceduresManagementService";

function createEmptyForm() {
  return {
    name: "",
    description: "",
    duration: "",
    isRequired: true,
  };
}

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("adminProcedures.nameRequired");
  }

  if (!String(formValues.description || "").trim()) {
    return t("adminProcedures.descriptionRequired");
  }

  if (Number(formValues.duration) < 0 || Number.isNaN(Number(formValues.duration))) {
    return t("adminProcedures.durationInvalid");
  }

  return "";
}

export function ProcedureCreatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      [t("adminProcedures.procedureName"), formValues.name],
      [t("adminProcedures.duration"), formValues.duration !== "" ? formatProcedureDuration(formValues.duration) : "--"],
      [t("adminProcedures.required"), formValues.isRequired ? t("adminProcedures.required") : t("adminProcedures.optional")],
      [t("adminProcedures.description"), formValues.description],
    ],
    [formValues.description, formValues.duration, formValues.isRequired, formValues.name],
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

  const handleCreateProcedure = async () => {
    setIsSaving(true);

    try {
      const createdProcedure = await createAdminProcedure({
        ...formValues,
        duration: Number(formValues.duration),
      });

      toast.success(t("adminProcedures.createSuccess", { name: createdProcedure.name }));
      navigate(getAdminProcedureDetailRoute(createdProcedure.procedureId), {
        state: {
          flashMessage: t("adminProcedures.createFlashSuccess", { name: createdProcedure.name }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminProcedures.createFailed");
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
            to={ROUTES.adminProcedures}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminProcedures.addNewProcedure")}</h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminProcedures.addNewProcedureDesc")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {t("adminProcedures.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("adminProcedures.saveProcedure")}
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
            {t("adminProcedures.procedureDetails")}
          </h2>

          <div className="grid gap-5">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.procedureName")}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <ClipboardList size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder={t("adminProcedures.enterProcedureName")}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.description")}</span>
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FileText size={14} className="mt-0.5 shrink-0 text-rose-300" />
                <textarea
                  rows={5}
                  value={formValues.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  placeholder={t("adminProcedures.describeStep")}
                  className="w-full resize-none bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.duration")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formValues.duration}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    placeholder={t("adminProcedures.minutes")}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.requirement")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={formValues.isRequired ? "true" : "false"}
                    onChange={(event) => handleFieldChange("isRequired", event.target.value === "true")}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none"
                  >
                    <option value="true">{t("adminProcedures.required")}</option>
                    <option value="false">{t("adminProcedures.optional")}</option>
                  </select>
                </div>
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminProcedures.preview")}
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
        title={t("adminProcedures.cancelCreateTitle")}
        subtitle={t("adminProcedures.cancelCreateSubtitle")}
        description={t("adminProcedures.cancelCreateDesc")}
        confirmText={t("adminProcedures.discardChanges")}
        cancelText={t("adminProcedures.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminProcedures)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new procedure has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminProcedures.saveNewProcedureTitle")}
        subtitle={t("adminProcedures.saveNewProcedureSubtitle")}
        description={t("adminProcedures.saveNewProcedureDesc")}
        confirmText={t("adminProcedures.createProcedure")}
        cancelText={t("adminProcedures.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateProcedure}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New procedure"]}
        details={[
          { label: "Duration", value: formValues.duration !== "" ? formatProcedureDuration(formValues.duration) : "--" },
          { label: "Required", value: formValues.isRequired ? "Required" : "Optional" },
        ]}
      />
    </section>
  );
}
