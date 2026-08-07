import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ArrowLeft, FileText, FolderTree, Pencil, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  deleteAdminSkillType,
  fetchAdminSkillTypeDetail,
  updateAdminSkillType,
} from "../services/skillTypesManagementService";

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("adminSkillTypes.nameRequired");
  }

  if (!String(formValues.description || "").trim()) {
    return t("adminSkillTypes.descriptionRequired");
  }

  return "";
}

export function SkillTypeDetailPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { skillTypeId } = useParams();
  const [skillType, setSkillType] = useState(null);
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
    if (!skillTypeId) {
      navigate(ROUTES.adminSkillTypes, { replace: true });
    }
  }, [navigate, skillTypeId]);

  useEffect(() => {
    if (!location.state?.flashMessage && !location.state?.startInEdit) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadSkillType = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminSkillTypeDetail(skillTypeId);

        if (!isMounted) {
          return;
        }

        setSkillType(response);
        setDraft({
          name: response.name,
          description: response.description,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : t("adminSkillTypes.loadDetailFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSkillType();

    return () => {
      isMounted = false;
    };
  }, [skillTypeId]);

  const summaryItems = useMemo(() => {
    if (!skillType || !draft) {
      return [];
    }

    return [
      [t("adminSkillTypes.skillTypeIdLabel"), skillType.skillTypeId],
      [t("adminSkillTypes.status"), skillType.status || "--"],
      [t("adminSkillTypes.description"), draft.description || "--"],
    ];
  }, [draft, skillType]);

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
    if (!skillType) {
      return;
    }

    setDraft({
      name: skillType.name,
      description: skillType.description,
    });
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!skillType) {
      return;
    }

    setDraft({
      name: skillType.name,
      description: skillType.description,
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
    if (!skillType || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedSkillType = await updateAdminSkillType(skillType.skillTypeId, draft);
      setSkillType(updatedSkillType);
      setDraft({
        name: updatedSkillType.name,
        description: updatedSkillType.description,
      });
      setIsEditing(false);
      toast.success(t("adminSkillTypes.updateSuccess", { name: updatedSkillType.name }));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("adminSkillTypes.updateFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!skillType) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminSkillType(skillType.skillTypeId);
      toast.success(t("adminSkillTypes.deleteSuccess", { name: skillType.name }));
      navigate(ROUTES.adminSkillTypes, {
        state: {
          flashMessage: t("adminSkillTypes.deleteFlashSuccess", { name: skillType.name }),
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t("adminSkillTypes.deleteFailed");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("adminSkillTypes.skillTypeDetail")}</h1>
            <p className="text-xs font-medium text-slate-400">{t("adminSkillTypes.skillTypeDetailDesc")}</p>
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
            {t("adminSkillTypes.deleteSkillType")}
          </button>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                {t("adminSkillTypes.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                {t("adminSkillTypes.saveChanges")}
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
              {t("adminSkillTypes.editSkillType")}
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
          <div className="text-center text-sm text-slate-600">{t("adminSkillTypes.loadingDetails")}</div>
        </div>
      ) : !skillType ? (
        <div className="rounded-[24px] border border-rose-100 bg-white/85 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-lg font-bold text-slate-800">{t("adminSkillTypes.unableToLoad")}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {error || t("adminSkillTypes.unableToLoadDesc")}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to={ROUTES.adminSkillTypes}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
              >
                {t("adminSkillTypes.backToSkillTypes")}
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(226,93,143,0.24)]"
              >
                {t("adminSkillTypes.retry")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {t("adminSkillTypes.skillTypeInformation")}
            </h2>

            <div className="grid gap-5">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{t("adminSkillTypes.skillTypeName")}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <FolderTree size={14} className="shrink-0 text-rose-300" />
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
                <span className="text-[13px] font-semibold text-slate-600">{t("adminSkillTypes.description")}</span>
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

              <div className="rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0 text-rose-300" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-600">{t("adminSkillTypes.currentStatus")}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{skillType?.status || "--"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
                {t("adminSkillTypes.summary")}
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
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("adminSkillTypes.saveChangesTitle")}
        subtitle={t("adminSkillTypes.saveChangesSubtitle")}
        description={t("adminSkillTypes.saveChangesDesc")}
        confirmText={t("adminSkillTypes.saveChanges")}
        cancelText={t("adminSkillTypes.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || skillType?.name || "Skill type"]}
        details={[
          { label: "Status", value: skillType?.status || "--" },
          { label: "Description", value: draft?.description || "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={t("adminSkillTypes.deleteSkillTypeTitle")}
        subtitle={t("adminSkillTypes.deleteConfirmSubtitle")}
        description={t("adminSkillTypes.deleteConfirmDesc", { name: skillType?.name || "this skill type" })}
        confirmText={t("adminSkillTypes.deleteSkillType")}
        cancelText={t("adminSkillTypes.keepSkillType")}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          skillType
            ? {
              title: skillType.name,
              meta: skillType.status,
              note: `Skill Type ID: ${skillType.skillTypeId}`,
            }
            : null
        }
        warnings={[t("adminSkillTypes.deleteWarning")]}
      />
    </section>
  );
}
