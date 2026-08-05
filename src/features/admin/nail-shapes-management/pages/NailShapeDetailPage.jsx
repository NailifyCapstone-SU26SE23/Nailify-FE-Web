import {
  ArrowLeft,
  Clock3,
  Image as ImageIcon,
  Pencil,
  Save,
  Shapes,
  Trash2,
  Upload,
  Wallet,
  X,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import {
  deleteAdminNailShape,
  fetchAdminNailShapeDetail,
  formatNailShapeCurrency,
  formatNailShapeDuration,
  updateAdminNailShape,
} from "../services/nailShapesManagementService";
import {
  fetchAdminShapeMethodConfigsByNailShape,
  createAdminShapeMethodConfig,
  updateAdminShapeMethodConfig,
  deleteAdminShapeMethodConfig,
} from "../../shape-method-configs-management/services/shapeMethodConfigsManagementService";
import { Image, Table, Modal, Form, Input, InputNumber, Switch, Button, Popconfirm } from "antd";

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

export function NailShapeDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { shapeId } = useParams();
  const [shape, setShape] = useState(null);
  const [draft, setDraft] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.startInEdit));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  const [configs, setConfigs] = useState([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configForm] = Form.useForm();

  const handleOpenConfigModal = (config = null) => {
    setEditingConfig(config);
    if (config) {
      configForm.setFieldsValue({
        name: config.name,
        price: config.price,
        duration: config.duration,
        status: config.status === "Active",
      });
    } else {
      configForm.resetFields();
      configForm.setFieldsValue({ status: true });
    }
    setIsConfigModalVisible(true);
  };

  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      setIsSavingConfig(true);
      const toastId = toast.loading(language === "vi" ? (editingConfig ? "Đang cập nhật cấu hình..." : "Đang tạo cấu hình...") : (editingConfig ? "Updating config..." : "Creating config..."));

      const payload = {
        nailShapeId: Number(shapeId),
        name: values.name.trim(),
        price: Number(values.price),
        duration: Number(values.duration),
        status: values.status ? "Active" : "Inactive",
      };

      if (editingConfig) {
        const updatedConfig = await updateAdminShapeMethodConfig(editingConfig.shapeMethodConfigId, payload);
        setConfigs((prev) => prev.map(c => c.shapeMethodConfigId === updatedConfig.shapeMethodConfigId ? updatedConfig : c));
        toast.success(language === "vi" ? "Cập nhật cấu hình thành công" : "Config updated successfully", { id: toastId });
      } else {
        const newConfig = await createAdminShapeMethodConfig(payload);
        setConfigs((prev) => [...prev, newConfig]);
        toast.success(language === "vi" ? "Tạo cấu hình thành công" : "Config created successfully", { id: toastId });
      }

      setIsConfigModalVisible(false);
    } catch (error) {
      if (error.name === 'ValidationError') return;
      toast.error(error instanceof Error ? error.message : (language === "vi" ? "Lưu cấu hình thất bại." : "Failed to save config."));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteConfig = async (configId) => {
    const toastId = toast.loading(language === "vi" ? "Đang xóa cấu hình..." : "Deleting config...");
    try {
      await deleteAdminShapeMethodConfig(configId);
      setConfigs((prev) => prev.filter((c) => c.shapeMethodConfigId !== configId));
      toast.success(language === "vi" ? "Xóa cấu hình thành công" : "Config deleted successfully", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === "vi" ? "Xóa cấu hình thất bại." : "Failed to delete config."), { id: toastId });
    }
  };

  useEffect(() => {
    if (!location.state?.flashMessage && !location.state?.startInEdit) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadShape = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminNailShapeDetail(shapeId);

        if (!isMounted) {
          return;
        }

        setShape(response);
        setDraft({
          name: response.name,
          price: String(response.price),
          duration: String(response.duration),
          image: null,
        });
        setImagePreview(response.imageUrl || "");

        // Fetch configs for this shape
        try {
          const configData = await fetchAdminShapeMethodConfigsByNailShape(shapeId);
          if (isMounted) setConfigs(configData);
        } catch (configError) {
          console.error("Failed to load configs", configError);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : (language === "vi" ? "Tải chi tiết dáng móng thất bại." : "Failed to load nail shape detail."));
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingConfigs(false);
        }
      }
    };

    void loadShape();

    return () => {
      isMounted = false;
    };
  }, [shapeId]);

  const summaryItems = useMemo(() => {
    if (!shape || !draft) {
      return [];
    }

    return [
      [language === "vi" ? "Mã Dáng Móng" : "Shape ID", String(shape.nailShapeId)],
      [language === "vi" ? "Tên Dáng Móng" : "Shape Name", draft.name || "--"],
      [language === "vi" ? "Giá cả" : "Price", draft.price ? formatNailShapeCurrency(draft.price) : "--"],
      [language === "vi" ? "Thời lượng" : "Duration", draft.duration ? formatNailShapeDuration(draft.duration) : "--"],
    ];
  }, [draft, shape]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setDraft((current) => ({
      ...current,
      image: file,
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleStartEdit = () => {
    if (!shape) {
      return;
    }

    setDraft({
      name: shape.name,
      price: String(shape.price),
      duration: String(shape.duration),
      image: null,
    });
    setImagePreview(shape.imageUrl || "");
    setError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!shape) {
      return;
    }

    setDraft({
      name: shape.name,
      price: String(shape.price),
      duration: String(shape.duration),
      image: null,
    });
    setImagePreview(shape.imageUrl || "");
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
    if (!shape || !draft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedShape = await updateAdminNailShape(shape.nailShapeId, {
        ...draft,
        price: Number(draft.price),
        duration: Number(draft.duration),
      });

      setShape(updatedShape);
      setDraft({
        name: updatedShape.name,
        price: String(updatedShape.price),
        duration: String(updatedShape.duration),
        image: null,
      });
      setImagePreview(updatedShape.imageUrl || imagePreview);
      setIsEditing(false);
      toast.success(language === "vi" ? `Đã cập nhật dáng móng ${updatedShape.name} thành công.` : `${updatedShape.name} updated successfully.`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : (language === "vi" ? "Cập nhật dáng móng thất bại." : "Failed to update nail shape.");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!shape) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminNailShape(shape.nailShapeId);
      toast.success(language === "vi" ? `Đã xóa dáng móng ${shape.name} thành công.` : `${shape.name} deleted successfully.`);
      navigate(ROUTES.adminNailShapes, {
        state: {
          flashMessage: language === "vi" ? `Dáng móng ${shape.name} đã được xóa thành công.` : `${shape.name} has been deleted successfully.`,
        },
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : (language === "vi" ? "Xóa dáng móng thất bại." : "Failed to delete nail shape.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isLoading && !shape) {
    return <Navigate to={ROUTES.adminNailShapes} replace />;
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{language === "vi" ? "Chi Tiết Dáng Móng" : "Nail Shape Detail"}</h1>
            <p className="text-xs font-medium text-slate-400">
              {language === "vi" ? "Xem, chỉnh sửa và xóa dáng móng này tại một trang." : "Review, edit, and delete this nail shape from one page."}
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
            {language === "vi" ? "Xóa Dáng Móng" : "Delete Shape"}
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
              {language === "vi" ? "Chỉnh sửa Dáng Móng" : "Edit Shape"}
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
          <div className="text-center text-sm text-slate-600">{language === "vi" ? "Đang tải chi tiết dáng móng..." : "Loading nail shape details..."}</div>
        </div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
            <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
              <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74]" />
              {language === "vi" ? "Thông Tin Dáng Móng" : "Nail Shape Information"}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Tên Dáng Móng" : "Shape Name"}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5">
                  <Shapes size={14} className="shrink-0 text-rose-300" />
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

              <label className="space-y-2.5 md:col-span-2">
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

              <label className="space-y-2.5 md:col-span-2">
                <span className="text-[13px] font-semibold text-slate-600">{language === "vi" ? "Hình Ảnh Xem Trước" : "Preview Image"}</span>
                <label
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-200 px-6 py-8 ${isEditing
                    ? "cursor-pointer bg-gradient-to-br from-[#fffafc] to-[#fff5f9] transition hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(226,93,143,0.12)]"
                    : "bg-gradient-to-br from-[#fffafc] to-[#fff5f9]"
                    }`}
                >
                  {imagePreview ? (
                    <Image
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
                        <p className="text-base font-semibold text-slate-700">
                          {isEditing ? (language === "vi" ? "Bấm để tải ảnh dáng móng lên" : "Click to upload shape image") : (language === "vi" ? "Chưa có hình ảnh xem trước" : "No preview image")}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB</p>
                      </div>
                    </>
                  )}
                  {isEditing ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  ) : null}
                </label>
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{language === "vi" ? "Cấu Hình Phương Pháp" : "Shape Method Configs"}</h2>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => handleOpenConfigModal()}
                className="bg-rose-500 hover:bg-rose-600 border-none rounded-full px-5 shadow-md shadow-rose-200"
              >
                {language === "vi" ? "Thêm Cấu Hình" : "Add Config"}
              </Button>
            </div>
            <Table
              dataSource={configs}
              rowKey="shapeMethodConfigId"
              pagination={false}
              loading={isLoadingConfigs}
              columns={[
                {
                  title: language === "vi" ? "Tên" : "Name",
                  dataIndex: 'name',
                  key: 'name',
                  render: (text) => <span className="font-semibold text-slate-700">{text}</span>
                },
                {
                  title: language === "vi" ? "Giá" : "Price",
                  dataIndex: 'price',
                  key: 'price',
                  render: (val) => <span className="text-emerald-600 font-medium">{formatNailShapeCurrency(val)}</span>
                },
                {
                  title: language === "vi" ? "Thời gian" : "Duration",
                  dataIndex: 'duration',
                  key: 'duration',
                  render: (val) => <span className="text-blue-600 font-medium">{formatNailShapeDuration(val)}</span>
                },
                {
                  title: language === "vi" ? "Trạng thái" : "Status",
                  dataIndex: 'status',
                  key: 'status',
                  render: (val) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${val === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {val}
                    </span>
                  )
                },
                {
                  title: language === "vi" ? "Thao tác" : "Actions",
                  key: 'actions',
                  align: 'right',
                  render: (_, record) => (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="text"
                        icon={<Pencil size={16} />}
                        onClick={() => handleOpenConfigModal(record)}
                        className="text-slate-500 hover:text-blue-600"
                      />
                      <Popconfirm
                        title={language === "vi" ? "Xóa Cấu Hình" : "Delete Config"}
                        description={language === "vi" ? "Bạn có chắc chắn muốn xóa cấu hình này?" : "Are you sure you want to delete this config?"}
                        onConfirm={() => handleDeleteConfig(record.shapeMethodConfigId)}
                        okText={language === "vi" ? "Có" : "Yes"}
                        cancelText={language === "vi" ? "Không" : "No"}
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                      </Popconfirm>
                    </div>
                  )
                }
              ]}
              className="border border-slate-100 rounded-xl overflow-hidden"
            />
          </section>

        </div>
      )}

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={language === "vi" ? "Lưu Thay Đổi Dáng Móng" : "Save Nail Shape Changes"}
        subtitle={language === "vi" ? "Hành động này sẽ cập nhật dáng móng trên hệ thống." : "This will update the nail shape in backend."}
        description={language === "vi" ? "Xác nhận để lưu các thay đổi mới nhất cho dáng móng này." : "Confirm to save the latest changes to this nail shape."}
        confirmText={language === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
        cancelText={language === "vi" ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleSave}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[draft?.name || shape?.name || (language === "vi" ? "Dáng móng" : "Nail shape")]}
        details={[
          { label: language === "vi" ? "Giá cả" : "Price", value: draft?.price ? formatNailShapeCurrency(draft.price) : "--" },
          { label: language === "vi" ? "Thời lượng" : "Duration", value: draft?.duration ? formatNailShapeDuration(draft.duration) : "--" },
        ]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={language === "vi" ? "Xóa Dáng Móng" : "Delete Nail Shape"}
        subtitle={language === "vi" ? "Hành động này sẽ xóa vĩnh viễn dáng móng khỏi hệ thống." : "This will permanently remove the nail shape from backend."}
        description={language === "vi" ? `Bạn chuẩn bị xóa ${shape?.name || "dáng móng này"}. Hành động này không thể hoàn tác.` : `You are about to delete ${shape?.name || "this nail shape"}. This action cannot be undone.`}
        confirmText={language === "vi" ? "Xóa Dáng Móng" : "Delete Shape"}
        cancelText={language === "vi" ? "Giữ lại" : "Keep Shape"}
        confirmIcon={Trash2}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        item={
          shape
            ? {
              image: shape.imageUrl || undefined,
              title: shape.name,
              meta: `${shape.priceLabel} • ${shape.durationLabel}`,
              note: (language === "vi" ? "Mã dáng móng: " : "Shape ID: ") + shape.nailShapeId,
            }
            : null
        }
        warnings={[language === "vi" ? "Hành động này gọi API xóa và xóa bản ghi vĩnh viễn." : "This action calls the backend delete endpoint and removes the record permanently."]}
      />

      <Modal
        title={
          <h3 className="text-lg font-bold text-slate-800">
            {editingConfig ? (language === "vi" ? "Chỉnh Sửa Cấu Hình" : "Edit Shape Method Config") : (language === "vi" ? "Thêm Cấu Hình" : "Add Shape Method Config")}
          </h3>
        }
        open={isConfigModalVisible}
        onCancel={() => !isSavingConfig && setIsConfigModalVisible(false)}
        footer={null}
        destroyOnClose
        className="rounded-2xl"
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          className="mt-6"
        >
          <Form.Item
            name="name"
            label={<span className="text-sm font-semibold text-slate-700">{language === "vi" ? "Tên" : "Name"}</span>}
            rules={[{ required: true, message: language === "vi" ? "Vui lòng nhập tên" : "Please enter a name" }]}
          >
            <Input className="rounded-xl border-slate-200 py-2 hover:border-rose-300 focus:border-rose-400 focus:ring-rose-100" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label={<span className="text-sm font-semibold text-slate-700">{language === "vi" ? "Giá (VND)" : "Price (VND)"}</span>}
              rules={[{ required: true, message: language === "vi" ? "Vui lòng nhập giá" : "Please enter price" }]}
            >
              <InputNumber
                className="w-full rounded-xl border-slate-200 hover:border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                min={0}
                step={1000}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value?.replace(/\$\s?|(,*)/g, '') || ''}
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label={<span className="text-sm font-semibold text-slate-700">{language === "vi" ? "Thời gian (phút)" : "Duration (mins)"}</span>}
              rules={[{ required: true, message: language === "vi" ? "Vui lòng nhập thời gian" : "Please enter duration" }]}
            >
              <InputNumber
                className="w-full rounded-xl border-slate-200 hover:border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                min={1}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label={<span className="text-sm font-semibold text-slate-700">{language === "vi" ? "Trạng thái Hoạt động" : "Status Active"}</span>}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              onClick={() => setIsConfigModalVisible(false)}
              disabled={isSavingConfig}
              className="rounded-full px-6 font-semibold"
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSavingConfig}
              className="rounded-full bg-rose-500 px-6 font-semibold shadow-md shadow-rose-200 hover:bg-rose-600"
            >
              {language === "vi" ? "Lưu Cấu Hình" : "Save Config"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
}
