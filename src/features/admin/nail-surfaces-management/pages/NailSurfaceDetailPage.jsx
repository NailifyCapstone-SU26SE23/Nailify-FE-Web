import {
  ArrowLeft,
  Clock3,
  Layers3,
  Pencil,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  deleteAdminNailSurface,
  fetchAdminNailSurfaceDetail,
  formatNailSurfaceCurrency,
  formatNailSurfaceDuration,
  updateAdminNailSurface,
} from "../services/nailSurfacesManagementService";
import { NailSurfacePreview } from "../components/NailSurfacePreview";
import { NailSurfacePainter } from "../components/NailSurfacePainter";
import { NailSurfaceShaderBuilder } from "../components/NailSurfaceShaderBuilder";
import {
  buildSurfacePayload,
  parseShaderParamToControls,
  syncSurfaceForm,
} from "../utils/surfaceShaderConfig";

function validateForm(formValues, language) {
  const isVi = language === "vi";
  if (!String(formValues.name || "").trim()) {
    return isVi ? "Tên bề mặt móng là bắt buộc." : "Nail surface name is required.";
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return isVi ? "Giá phải là một số hợp lệ." : "Price must be a valid number.";
  }

  if (Number(formValues.duration) <= 0 || Number.isNaN(Number(formValues.duration))) {
    return isVi ? "Thời lượng phải lớn hơn 0." : "Duration must be greater than 0.";
  }

  return "";
}

export function NailSurfaceDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { surfaceId } = useParams();
  const [surface, setSurface] = useState(null);
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

    const loadSurface = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailSurfaceDetail(surfaceId);

        if (!isMounted) {
          return;
        }

        setSurface(response);
        setDraft(syncSurfaceForm(parseShaderParamToControls(response.shaderParam, response)));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : (language === "vi" ? "Tải chi tiết bề mặt móng thất bại." : "Failed to load nail surface detail."));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSurface();

    return () => {
      isMounted = false;
    };
  }, [surfaceId]);

  const handleFieldChange = (field, value) => {
    setDraft((current) =>
      syncSurfaceForm({
        ...current,
        [field]: value,
      }),
    );

    if (error) {
      setError("");
    }
  };

  const handleStartEdit = () => {
    if (!surface) {
      return;
    }

    setDraft(syncSurfaceForm(parseShaderParamToControls(surface.shaderParam, surface)));
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!surface) {
      return;
    }

    setDraft(syncSurfaceForm(parseShaderParamToControls(surface.shaderParam, surface)));
    setError("");
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    const validationError = validateForm(draft, language);

    if (validationError) {
      setError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!surface || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedSurface = await updateAdminNailSurface(
        surface.nailSurfaceId,
        buildSurfacePayload(draft),
      );

      setSurface(updatedSurface);
      setDraft(syncSurfaceForm(parseShaderParamToControls(updatedSurface.shaderParam, updatedSurface)));
      setIsEditing(false);
      toast.success(language === "vi" ? `Đã cập nhật ${updatedSurface.name} thành công.` : `${updatedSurface.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : (language === "vi" ? "Cập nhật bề mặt móng thất bại." : "Failed to update nail surface.");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!surface) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailSurface(surface.nailSurfaceId);
      toast.success(language === "vi" ? `Đã xóa ${surface.name} thành công.` : `${surface.name} deleted successfully.`);
      navigate(ROUTES.adminNailSurfaces, {
        state: {
          flashMessage: language === "vi" ? `Bề mặt ${surface.name} đã được xóa thành công.` : `${surface.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : (language === "vi" ? "Xóa bề mặt móng thất bại." : "Failed to delete nail surface.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !surface) {
    return <Navigate to={ROUTES.adminNailSurfaces} replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-[1300px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminNailSurfaces}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{language === "vi" ? "Chi Tiết Bề Mặt Móng" : "Nail Surface Detail"}</h1>
            <p className="text-xs font-medium text-slate-400">
              {language === "vi" ? "Xem, chỉnh sửa và xóa bề mặt móng này tại một trang." : "Review, edit, and delete this nail surface from one page."}
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
            {language === "vi" ? "Xóa Bề Mặt" : "Delete Surface"}
          </button>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              >
                <X size={14} />
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleRequestSave}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
              >
                <Save size={14} />
                {language === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
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
              {language === "vi" ? "Chỉnh sửa Bề Mặt" : "Edit Surface"}
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
          <div className="text-center text-sm text-slate-600">{language === "vi" ? "Đang tải chi tiết bề mặt móng..." : "Loading nail surface details..."}</div>
        </div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {language === "vi" ? "Thông Tin Bề Mặt Móng" : "Nail Surface Information"}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Tên Bề Mặt" : "Surface Name"}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Layers3 size={14} className="shrink-0 text-rose-300" />
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
                <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Giá cả" : "Price"}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Wallet size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={draft?.price || ""}
                    onChange={(event) => handleFieldChange("price", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>

              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Thời lượng" : "Duration"}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Clock3 size={14} className="shrink-0 text-rose-300" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draft?.duration || ""}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                  />
                </div>
              </label>
            </div>
          </section>

          {draft ? (
            <NailSurfaceShaderBuilder
              formValues={draft}
              onFieldChange={handleFieldChange}
              disabled={!isEditing}
            />
          ) : null}

          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {language === "vi" ? "Xem Trước Bề Mặt" : "Surface Preview"}
            </h2>

            <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              {draft?.painterMode ? (
                <NailSurfacePainter 
                  brushType={draft.brushType || 'glossy'} 
                  brushSize={draft.brushSize || 20}
                  initialMaskDataUrl={draft.maskDataUrl}
                  onSave={(dataUrl) => handleFieldChange("maskDataUrl", dataUrl)}
                />
              ) : (
                <NailSurfacePreview
                  surface={{
                    ...surface,
                    ...draft,
                    price: Number(draft?.price || 0),
                    duration: Number(draft?.duration || 0),
                  }}
                />
              )}

              <div className="rounded-[20px] border border-rose-100 bg-[#fff8fb] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                  {language === "vi" ? "Tóm Tắt Bề Mặt" : "Surface Summary"}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] border border-rose-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                      {language === "vi" ? "Loại Bề Mặt" : "Surface Type"}
                    </p>
                    <p className="mt-2 text-sm font-bold capitalize text-[#432744]">
                      {draft?.surfacePreset || "--"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-rose-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                      {language === "vi" ? "Giá cả" : "Price"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">
                      {draft?.price ? formatNailSurfaceCurrency(draft.price) : "--"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-rose-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                      {language === "vi" ? "Thời lượng" : "Duration"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">
                      {draft?.duration ? formatNailSurfaceDuration(draft.duration) : "--"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-rose-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                      {language === "vi" ? "Độ Sáng" : "Lightness Offset"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">
                      {draft?.lightnessOffset || "0"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-rose-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                      {language === "vi" ? "Độ Bão Hòa" : "Saturation Offset"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">
                      {draft?.saturationOffset || "0"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={language === "vi" ? "Lưu Thay Đổi Bề Mặt Móng" : "Save Nail Surface Changes"}
        subtitle={language === "vi" ? "Hành động này sẽ cập nhật bề mặt móng trên hệ thống." : "This will update the nail surface in backend."}
        description={language === "vi" ? "Xác nhận để lưu các thay đổi mới nhất cho bề mặt móng này." : "Confirm to save the latest changes to this nail surface."}
        confirmText={language === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || surface?.name || (language === "vi" ? "Bề mặt móng" : "Nail surface")]}
        details={[
          { label: language === "vi" ? "Loại Bề Mặt" : "Surface Type", value: draft?.surfacePreset || "--" },
          { label: language === "vi" ? "Giá cả" : "Price", value: draft?.price ? formatNailSurfaceCurrency(draft.price) : "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={language === "vi" ? "Xóa Bề Mặt Móng" : "Delete Nail Surface"}
        subtitle={language === "vi" ? "Hành động này sẽ xóa vĩnh viễn bề mặt móng khỏi hệ thống." : "This will permanently remove the nail surface from backend."}
        description={language === "vi" ? `Bạn chuẩn bị xóa ${surface?.name || "bề mặt móng này"}. Hành động này không thể hoàn tác.` : `You are about to delete ${surface?.name || "this nail surface"}. This action cannot be undone.`}
        confirmText={language === "vi" ? "Xóa Bề Mặt" : "Delete Surface"}
        cancelText={language === "vi" ? "Giữ lại" : "Keep Surface"}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          surface
            ? {
              title: surface.name,
              meta: `${surface.shaderParam} • ${surface.priceLabel}`,
              note: (language === "vi" ? "Mã bề mặt: " : "Surface ID: ") + surface.nailSurfaceId,
            }
            : null
        }
        warnings={[language === "vi" ? "Hành động này gọi API xóa và xóa bản ghi vĩnh viễn." : "This action calls the backend delete endpoint and removes the record permanently."]}
      />
    </section>
  );
}
