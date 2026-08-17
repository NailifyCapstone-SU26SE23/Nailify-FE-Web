import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ArrowLeft,
  ClipboardList,
  Clock3,
  FileText,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  deleteAdminProcedure,
  fetchAdminProcedureDetail,
  formatProcedureDate,
  formatProcedureDuration,
  PROCEDURE_STATUS_OPTIONS,
  updateAdminProcedure,
} from "../services/proceduresManagementService";

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

  if (!String(formValues.status || "").trim()) {
    return t("adminProcedures.statusRequired");
  }

  return "";
}

export function ProcedureDetailPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { procedureId } = useParams();
  const [procedure, setProcedure] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.startInEdit));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage && !location.state?.startInEdit) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadProcedure = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminProcedureDetail(procedureId);

        if (!isMounted) {
          return;
        }

        setProcedure(response);
        setDraft({
          name: response.name,
          description: response.description,
          duration: String(response.duration),
          status: response.status,
          isRequired: response.isRequired,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : t("adminProcedures.loadDetailFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProcedure();

    return () => {
      isMounted = false;
    };
  }, [procedureId]);

  const summaryItems = useMemo(() => {
    if (!procedure || !draft) {
      return [];
    }

    return [
      [t("adminProcedures.procedureNameLabel"), procedure.name],
      [t("adminProcedures.createdAtLabel"), formatProcedureDate(procedure.createAt)],
      [t("adminProcedures.duration"), draft.duration !== "" ? formatProcedureDuration(draft.duration) : "--"],
      [t("adminProcedures.status"), draft.status],
      [t("adminProcedures.required"), draft.isRequired ? t("adminProcedures.required") : t("adminProcedures.optional")],
    ];
  }, [draft, procedure]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleStartEdit = () => {
    if (!procedure) {
      return;
    }

    setDraft({
      name: procedure.name,
      description: procedure.description,
      duration: String(procedure.duration),
      status: procedure.status,
      isRequired: procedure.isRequired,
    });
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!procedure) {
      return;
    }

    setDraft({
      name: procedure.name,
      description: procedure.description,
      duration: String(procedure.duration),
      status: procedure.status,
      isRequired: procedure.isRequired,
    });
    setError("");
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    const validationError = validateForm(draft, t);

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!procedure || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedProcedure = await updateAdminProcedure(procedure.procedureId, {
        ...draft,
        duration: Number(draft.duration),
      });

      setProcedure(updatedProcedure);
      setDraft({
        name: updatedProcedure.name,
        description: updatedProcedure.description,
        duration: String(updatedProcedure.duration),
        status: updatedProcedure.status,
        isRequired: updatedProcedure.isRequired,
      });
      setIsEditing(false);
      toast.success(t("adminProcedures.updateSuccess", { name: updatedProcedure.name }));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("adminProcedures.updateFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!procedure) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminProcedure(procedure.procedureId);
      toast.success(t("adminProcedures.deleteSuccess", { name: procedure.name }));
      navigate(ROUTES.adminProcedures, {
        state: {
          flashMessage: t("adminProcedures.deleteFlashSuccess", { name: procedure.name }),
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("adminProcedures.deleteFailed");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !procedure) {
    return <Navigate to={ROUTES.adminProcedures} replace />;
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminProcedures.procedureDetail")}</h1>
            <p className="text-xs font-medium text-slate-400">
              {t("adminProcedures.procedureDetailDesc")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            {t("adminProcedures.deleteProcedure")}
          </button>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                {t("adminProcedures.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                {t("adminProcedures.saveChanges")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil size={14} />
              {t("adminProcedures.editProcedure")}
            </button>
          )}
        </div>
      </header>

      {flashMessage ? (
        <div className="rounded-[16px] border border-[#d8f5e7] bg-[#eefcf5] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[24px] bg-white/80 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
          <div className="text-center text-sm text-slate-600">{t("adminProcedures.loadingDetails")}</div>
        </div>
      ) : (
        <div className="grid gap-4 ">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminProcedures.procedureInformation")}
            </h2>

            <div className="grid gap-5">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.procedureName")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ClipboardList size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="text"
                    value={draft?.name || ""}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.description")}</span>
                <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <FileText size={14} className="mt-0.5 shrink-0 text-rose-300" />
                  <textarea
                    rows={5}
                    value={draft?.description || ""}
                    onChange={(event) => handleFieldChange("description", event.target.value)}
                    disabled={!isEditing}
                    className="w-full resize-none bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
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
                      value={draft?.duration || ""}
                      onChange={(event) => handleFieldChange("duration", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    />
                  </div>
                </label>

                <label className="space-y-2.5">
                  <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.status")}</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                    <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                    <select
                      value={draft?.status || PROCEDURE_STATUS_OPTIONS[0]}
                      onChange={(event) => handleFieldChange("status", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      {PROCEDURE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminProcedures.requirement")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <select
                    value={draft?.isRequired ? "true" : "false"}
                    onChange={(event) => handleFieldChange("isRequired", event.target.value === "true")}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  >
                    <option value="true">{t("adminProcedures.required")}</option>
                    <option value="false">{t("adminProcedures.optional")}</option>
                  </select>
                </div>
              </label>
            </div>
          </section>

          {/* <aside className="space-y-4">
            <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
                Summary
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
          </aside> */}
        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminProcedures.saveChangesTitle")}
        subtitle={t("adminProcedures.saveChangesSubtitle")}
        description={t("adminProcedures.saveChangesDesc")}
        confirmText={t("adminProcedures.saveChanges")}
        cancelText={t("adminProcedures.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || procedure?.name || "Procedure"]}
        details={[
          { label: "Status", value: draft?.status },
          { label: "Required", value: draft?.isRequired ? "Required" : "Optional" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={t("adminProcedures.deleteProcedureTitle")}
        subtitle={t("adminProcedures.deleteConfirmSubtitle")}
        description={t("adminProcedures.deleteConfirmDesc", { name: procedure?.name || "this procedure" })}
        confirmText={t("adminProcedures.deleteProcedure")}
        cancelText={t("adminProcedures.keepProcedure")}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          procedure
            ? {
              title: procedure.name,
              meta: `${procedure.durationLabel} | ${procedure.status}`,

            }
            : null
        }
        warnings={[t("adminProcedures.deleteWarning")]}
      />
    </section>
  );
}
