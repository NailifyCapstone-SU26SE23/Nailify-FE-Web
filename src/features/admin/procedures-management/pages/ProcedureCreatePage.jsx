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

function validateForm(formValues) {
  if (!String(formValues.name || "").trim()) {
    return "Procedure name is required.";
  }

  if (!String(formValues.description || "").trim()) {
    return "Procedure description is required.";
  }

  if (Number(formValues.duration) < 0 || Number.isNaN(Number(formValues.duration))) {
    return "Duration must be a valid number.";
  }

  return "";
}

export function ProcedureCreatePage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      ["Procedure Name", formValues.name || "--"],
      ["Duration", formValues.duration !== "" ? formatProcedureDuration(formValues.duration) : "--"],
      ["Required", formValues.isRequired ? "Required" : "Optional"],
      ["Description", formValues.description || "--"],
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
    const validationError = validateForm(formValues);

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

      toast.success(`${createdProcedure.name} created successfully.`);
      navigate(getAdminProcedureDetailRoute(createdProcedure.procedureId), {
        state: {
          flashMessage: `${createdProcedure.name} has been created successfully.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create procedure.";
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
            <h1 className="text-2xl font-black tracking-tight text-[#cf3d74]">Add New Procedure</h1>
            <p className="text-xs font-medium text-slate-400">
              Create a new standard nail procedure step for admin management.
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            Save Procedure
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
            Procedure Details
          </h2>

          <div className="grid gap-5">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Procedure Name</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <ClipboardList size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Enter procedure name"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">Description</span>
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <FileText size={14} className="mt-0.5 shrink-0 text-rose-300" />
                <textarea
                  rows={5}
                  value={formValues.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  placeholder="Describe this standard procedure step"
                  className="w-full resize-none bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Duration</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formValues.duration}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    placeholder="Minutes"
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">Requirement</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={formValues.isRequired ? "true" : "false"}
                    onChange={(event) => handleFieldChange("isRequired", event.target.value === "true")}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none"
                  >
                    <option value="true">Required</option>
                    <option value="false">Optional</option>
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
              Preview
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
        title="Cancel Procedure Creation"
        subtitle="You are leaving this form without saving."
        description="All unsaved procedure details will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminProcedures)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new procedure has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save New Procedure"
        subtitle="This will create the procedure in backend."
        description="Confirm to add this standard procedure step to admin management."
        confirmText="Create Procedure"
        cancelText="Review Again"
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
