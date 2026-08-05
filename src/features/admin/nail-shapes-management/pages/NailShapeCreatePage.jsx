import {
  ArrowLeft,
  Clock3,
  Image as ImageIcon,
  Save,
  Shapes,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminNailShapeDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminNailShape,
  formatNailShapeCurrency,
  formatNailShapeDuration,
} from "../services/nailShapesManagementService";

function createEmptyForm() {
  return {
    name: "",
    price: "",
    duration: "",
    image: null,
  };
}

function validateForm(formValues, language) {
  const isVi = language === "vi";
  if (!String(formValues.name || "").trim()) {
    return isVi ? "Tên dáng móng là bắt buộc." : "Nail shape name is required.";
  }

  if (Number(formValues.price) < 0 || Number.isNaN(Number(formValues.price))) {
    return isVi ? "Giá phải là một số hợp lệ." : "Price must be a valid number.";
  }

  if (Number(formValues.duration) <= 0 || Number.isNaN(Number(formValues.duration))) {
    return isVi ? "Thời lượng phải lớn hơn 0." : "Duration must be greater than 0.";
  }

  return "";
}

export function NailShapeCreatePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const summaryItems = useMemo(
    () => [
      [language === "vi" ? "Tên Dáng Móng" : "Shape Name", formValues.name || "--"],
      [language === "vi" ? "Giá cả" : "Price", formValues.price ? formatNailShapeCurrency(formValues.price) : "--"],
      [language === "vi" ? "Thời lượng" : "Duration", formValues.duration ? formatNailShapeDuration(formValues.duration) : "--"],
      [language === "vi" ? "Hình ảnh" : "Image", formValues.image ? formValues.image.name : (language === "vi" ? "Chưa chọn" : "Not selected")],
    ],
    [formValues.duration, formValues.image, formValues.name, formValues.price, language],
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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleFieldChange("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitRequest = () => {
    const validationError = validateForm(formValues, language);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleCreateShape = async () => {
    setIsSaving(true);

    try {
      const createdShape = await createAdminNailShape({
        ...formValues,
        price: Number(formValues.price),
        duration: Number(formValues.duration),
      });

      toast.success(language === "vi" ? `Đã tạo dáng móng ${createdShape.name} thành công.` : `${createdShape.name} created successfully.`);
      navigate(getAdminNailShapeDetailRoute(createdShape.nailShapeId), {
        state: {
          flashMessage: language === "vi" ? `Dáng móng ${createdShape.name} đã được tạo thành công.` : `${createdShape.name} has been created successfully.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : (language === "vi" ? "Tạo dáng móng thất bại." : "Failed to create nail shape.");
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
            to={ROUTES.adminNailShapes}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{language === "vi" ? "Thêm Dáng Móng Mới" : "Add New Nail Shape"}</h1>
            <p className="text-xs font-medium text-slate-400">
              {language === "vi" ? "Tạo dáng móng mới và tải lên hình ảnh xem trước." : "Create a new nail shape and upload its preview image."}
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
            {language === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {language === "vi" ? "Lưu Dáng Móng" : "Save Shape"}
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
            {language === "vi" ? "Chi Tiết Dáng Móng" : "Nail Shape Details"}
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2.5">
              <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Tên Dáng Móng" : "Shape Name"}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Shapes size={14} className="shrink-0 text-rose-300" />
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder={language === "vi" ? "Nhập tên dáng móng" : "Enter nail shape name"}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
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
                  value={formValues.price}
                  onChange={(event) => handleFieldChange("price", event.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5 md:col-span-2">
              <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Thời lượng" : "Duration"}</span>
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                <Clock3 size={14} className="shrink-0 text-rose-300" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formValues.duration}
                  onChange={(event) => handleFieldChange("duration", event.target.value)}
                  placeholder={language === "vi" ? "Số phút" : "Minutes"}
                  className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </div>
            </label>

            <label className="space-y-2.5 md:col-span-2">
              <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Hình Ảnh Xem Trước" : "Preview Image"}</span>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-[#fffafc] to-[#fff5f9] px-6 py-8 transition hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]">
                {imagePreview ? (
                  <img
                    crossOrigin="anonymous"
                    src={imagePreview}
                    alt="Nail shape preview"
                    className="h-48 w-full rounded-2xl object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] text-white shadow-lg">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-slate-700">{language === "vi" ? "Bấm để tải ảnh dáng móng lên" : "Click to upload shape image"}</p>
                      <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {language === "vi" ? "Xem trước" : "Preview"}
            </h2>

            <div className="space-y-4">
              <div className="flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8fb]">
                {imagePreview ? (
                  <img
                    crossOrigin="anonymous"
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-sm font-medium text-slate-400">
                    <ImageIcon size={24} className="mx-auto mb-3 text-rose-300" />
                    {language === "vi" ? "Chưa chọn hình ảnh" : "No image selected"}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                {summaryItems.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={language === "vi" ? "Hủy Tạo Dáng Móng" : "Cancel Nail Shape Creation"}
        subtitle={language === "vi" ? "Bạn đang rời biểu mẫu mà không lưu." : "You are leaving this form without saving."}
        description={language === "vi" ? "Tất cả thông tin dáng móng chưa lưu sẽ bị hủy." : "All unsaved nail shape details will be discarded."}
        confirmText={language === "vi" ? "Hủy Thay Đổi" : "Discard Changes"}
        cancelText={language === "vi" ? "Tiếp tục Chỉnh sửa" : "Keep Editing"}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminNailShapes)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={[language === "vi" ? "Dáng móng mới này chưa được tạo." : "This new nail shape has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={language === "vi" ? "Lưu Dáng Móng Mới" : "Save New Nail Shape"}
        subtitle={language === "vi" ? "Hành động này sẽ tạo dáng móng mới trên hệ thống." : "This will create the nail shape in backend."}
        description={language === "vi" ? "Xác nhận để thêm dáng móng này vào danh mục quản lý." : "Confirm to add this nail shape to the admin catalog."}
        confirmText={language === "vi" ? "Tạo Dáng Móng" : "Create Shape"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreateShape}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || (language === "vi" ? "Dáng móng mới" : "New nail shape")]}
        details={[
          { label: language === "vi" ? "Giá cả" : "Price", value: formValues.price ? formatNailShapeCurrency(formValues.price) : "--" },
          { label: language === "vi" ? "Thời lượng" : "Duration", value: formValues.duration ? formatNailShapeDuration(formValues.duration) : "--" },
        ]}
      />
    </section>
  );
}
