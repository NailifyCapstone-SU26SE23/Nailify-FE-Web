import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ArrowLeft, BadgePercent, CalendarRange, ImagePlus, Save, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES, getAdminPromotionDetailRoute } from "../../../../shared/constants/routes";
import {
  createAdminPromotion,
  fetchPromotionCategoryOptions,
  fetchPromotionCategoryTypeOptions,
  fetchPromotionNailDesignOptions,
  PROMOTION_DISCOUNT_TYPE_OPTIONS,
  PROMOTION_SCOPE_OPTIONS,
  PROMOTION_TYPE_OPTIONS,
} from "../services/promotionManagementService";

function toInputDateTime(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function validateForm(formValues, t) {
  if (!String(formValues.name || "").trim()) {
    return t("promotionDetail.validations.nameRequired");
  }

  if (!String(formValues.description || "").trim()) {
    return t("promotionDetail.validations.descRequired");
  }

  if (!String(formValues.type || "").trim()) {
    return t("promotionDetail.validations.typeRequired");
  }

  if (!String(formValues.scope || "").trim()) {
    return t("promotionDetail.validations.scopeRequired");
  }

  if (!String(formValues.discountType || "").trim()) {
    return t("promotionDetail.validations.discountTypeRequired");
  }

  if (!(Number(formValues.discountValue) > 0)) {
    return t("promotionDetail.validations.discountValueGreaterZero");
  }

  if (!formValues.startDate || !formValues.endDate) {
    return t("promotionDetail.validations.dateRequired");
  }

  if (new Date(formValues.startDate).getTime() >= new Date(formValues.endDate).getTime()) {
    return t("promotionDetail.validations.endDateLater");
  }

  if (formValues.scope === "Category" && !Number(formValues.categoryId)) {
    return t("promotionDetail.validations.categoryRequired");
  }

  if (formValues.scope === "CategoryType" && !Number(formValues.categoryTypeId)) {
    return t("promotionDetail.validations.categoryTypeRequired");
  }

  if (formValues.scope === "NailDesign" && !Number(formValues.nailDesignId)) {
    return t("promotionDetail.validations.nailDesignRequired");
  }

  return "";
}

function FormField({ label, children }) {
  return (
    <label className="space-y-2.5">
      <span className="text-[13px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PanelCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[24px] border border-rose-50 bg-white/80 p-6 shadow-[0_24px_60px_rgba(226,93,143,0.1)] backdrop-blur">
      <h2 className="mb-5 flex items-center gap-2 text-[20px] font-bold text-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fff0f7] text-[#cf3d74]">
          <Icon size={16} />
        </div>
        {title}
      </h2>
      {children}
    </section>
  );
}

function buildInitialFormValues() {
  return {
    name: "",
    description: "",
    type: "",
    scope: "",
    discountType: "",
    discountValue: "",
    categoryId: "",
    categoryTypeId: "",
    nailDesignId: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    userLimit: "",
    imageFile: null,
  };
}

export function PromotionCreatePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(buildInitialFormValues);
  const [formError, setFormError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupOptions, setLookupOptions] = useState({
    categories: [],
    categoryTypes: [],
    nailDesigns: [],
  });
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        setIsLoadingLookups(true);
        const [categories, categoryTypes, nailDesigns] = await Promise.all([
          fetchPromotionCategoryOptions(),
          fetchPromotionCategoryTypeOptions(),
          fetchPromotionNailDesignOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        setLookupOptions({
          categories,
          categoryTypes,
          nailDesigns,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFormError(error instanceof Error ? error.message : t("promotionDetail.loadOptionsFailed"));
      } finally {
        if (isMounted) {
          setIsLoadingLookups(false);
        }
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryItems = useMemo(
    () => [
      [t("promotionDetail.promotionName"), formValues.name],
      [t("promotionDetail.scope"), formValues.scope],
      [t("promotionDetail.discountValue"), formValues.discountValue ? `${formValues.discountValue} (${formValues.discountType})` : "--"],
      [t("promotionDetail.startDate"), formValues.startDate && formValues.endDate ? `${formValues.startDate} → ${formValues.endDate}` : "--"],
    ],
    [formValues.discountType, formValues.discountValue, formValues.endDate, formValues.name, formValues.scope, formValues.startDate],
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

  const handleScopeChange = (value) => {
    setFormValues((current) => ({
      ...current,
      scope: value,
      categoryId: value === "Category" ? current.categoryId : "",
      categoryTypeId: value === "CategoryType" ? current.categoryTypeId : "",
      nailDesignId: value === "NailDesign" ? current.nailDesignId : "",
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

    setFormValues((current) => ({
      ...current,
      imageFile: file,
    }));

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setImagePreview(loadEvent.target?.result || "");
    };
    reader.readAsDataURL(file);
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
      const createdPromotion = await createAdminPromotion({
        ...formValues,
        startDate: toApiDateTime(formValues.startDate),
        endDate: toApiDateTime(formValues.endDate),
      });
      toast.success(t("promotionDetail.createSuccess", { name: createdPromotion.name }));
      navigate(getAdminPromotionDetailRoute(createdPromotion.promotionId), {
        state: {
          flashMessage: t("promotionDetail.createFlashSuccess", { name: createdPromotion.name }),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("promotionDetail.createFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1350px] flex-col gap-4 text-slate-700">
      <header className="flex flex-col gap-4 rounded-[24px] bg-white/70 px-5 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminPromotions}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#cf3d74]">{t("promotionDetail.addNewPromotion")}</h1>
            <p className="text-xs font-medium text-slate-400">{t("promotionDetail.addNewPromotionDesc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <X size={14} />
            {t("promotionDetail.messages.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmitRequest}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
          >
            <Save size={14} />
            {t("promotionDetail.savePromotionBtn")}
          </button>
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="space-y-4">
          <PanelCard title={t("promotionDetail.promotionDetails")} icon={BadgePercent}>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label={t("promotionDetail.promotionName")}>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder={t("promotionDetail.enterPromotionName")}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </FormField>

              <FormField label={t("promotionDetail.promotionType")}>
                <select
                  value={formValues.type}
                  onChange={(event) => handleFieldChange("type", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none"
                >
                  <option value="">{t("promotionDetail.selectType")}</option>
                  {PROMOTION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t("promotionDetail.scope")}>
                <select
                  value={formValues.scope}
                  onChange={(event) => handleScopeChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none"
                >
                  <option value="">{t("promotionDetail.selectScope")}</option>
                  {PROMOTION_SCOPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t("promotionDetail.discountType")}>
                <select
                  value={formValues.discountType}
                  onChange={(event) => handleFieldChange("discountType", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none"
                >
                  <option value="">{t("promotionDetail.selectDiscountType")}</option>
                  {PROMOTION_DISCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t("promotionDetail.discountValue")}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.discountValue}
                  onChange={(event) => handleFieldChange("discountValue", event.target.value)}
                  placeholder={t("promotionDetail.enterDiscountValue")}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </FormField>

              <FormField label={t("promotionDetail.usageLimit")}>
                <input
                  type="number"
                  min="0"
                  value={formValues.usageLimit}
                  onChange={(event) => handleFieldChange("usageLimit", event.target.value)}
                  placeholder={t("promotionDetail.optionalUsageLimit")}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </FormField>

              <FormField label={t("promotionDetail.userLimit")}>
                <input
                  type="number"
                  min="0"
                  value={formValues.userLimit}
                  onChange={(event) => handleFieldChange("userLimit", event.target.value)}
                  placeholder={t("promotionDetail.optionalUserLimit")}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
                />
              </FormField>

              <FormField label={t("promotionDetail.startDate")}>
                <input
                  type="datetime-local"
                  value={formValues.startDate}
                  onChange={(event) => handleFieldChange("startDate", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none"
                />
              </FormField>

              <FormField label={t("promotionDetail.endDate")}>
                <input
                  type="datetime-local"
                  value={formValues.endDate}
                  onChange={(event) => handleFieldChange("endDate", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none"
                />
              </FormField>

              {formValues.scope === "Category" ? (
                <FormField label={t("promotionDetail.categoryId")}>
                  <select
                    value={formValues.categoryId}
                    onChange={(event) => handleFieldChange("categoryId", event.target.value)}
                    disabled={isLoadingLookups}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:opacity-60"
                  >
                    <option value="">{t("promotionDetail.selectCategory")}</option>
                    {lookupOptions.categories.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              {formValues.scope === "CategoryType" ? (
                <FormField label={t("promotionDetail.categoryTypeId")}>
                  <select
                    value={formValues.categoryTypeId}
                    onChange={(event) => handleFieldChange("categoryTypeId", event.target.value)}
                    disabled={isLoadingLookups}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:opacity-60"
                  >
                    <option value="">{t("promotionDetail.selectCategoryType")}</option>
                    {lookupOptions.categoryTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              {formValues.scope === "NailDesign" ? (
                <FormField label={t("promotionDetail.nailDesignId")}>
                  <select
                    value={formValues.nailDesignId}
                    onChange={(event) => handleFieldChange("nailDesignId", event.target.value)}
                    disabled={isLoadingLookups}
                    className="h-12 w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 text-[14px] font-medium text-slate-800 outline-none disabled:opacity-60"
                  >
                    <option value="">{t("promotionDetail.selectNailDesign")}</option>
                    {lookupOptions.nailDesigns.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormField>
              ) : null}
            </div>

            <FormField label={t("promotionDetail.description")}>
              <textarea
                rows={5}
                value={formValues.description}
                onChange={(event) => handleFieldChange("description", event.target.value)}
                placeholder={t("promotionDetail.enterDescription")}
                className="w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-4 py-3.5 text-[14px] font-medium text-slate-800 outline-none placeholder:text-rose-300"
              />
            </FormField>
          </PanelCard>

          <PanelCard title={t("promotionDetail.promotionImage")} icon={ImagePlus}>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-rose-200 bg-[#fff8fb] px-4 py-8 transition hover:border-[#cf3d74]">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Promotion preview"
                  className="h-40 w-full max-w-[420px] rounded-[18px] border border-rose-100 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f7] text-[#cf3d74]">
                  <ImagePlus size={22} />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">{t("promotionDetail.uploadImage")}</p>
                <p className="mt-1 text-xs text-slate-400">{t("promotionDetail.uploadDesc")}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </PanelCard>
        </div>


      </div>

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={t("promotionDetail.cancelCreateTitle")}
        subtitle={t("promotionDetail.cancelCreateSubtitle")}
        description={t("promotionDetail.cancelCreateDesc")}
        confirmText={t("promotionDetail.discardChanges")}
        cancelText={t("promotionDetail.keepEditing")}
        confirmIcon={X}
        onConfirm={() => navigate(ROUTES.adminPromotions)}
        onCancel={() => setShowCancelConfirm(false)}
        warnings={["This new promotion has not been created yet."]}
      />

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("promotionDetail.saveNewPromotionTitle")}
        subtitle={t("promotionDetail.saveNewPromotionSubtitle")}
        description={t("promotionDetail.saveNewPromotionDesc")}
        confirmText={t("promotionDetail.createPromotion")}
        cancelText={t("promotionDetail.reviewAgain")}
        confirmIcon={Save}
        loading={isSaving}
        onConfirm={handleCreate}
        onCancel={() => !isSaving && setShowSaveConfirm(false)}
        highlights={[formValues.name || "New promotion"]}
        details={[
          { label: "Scope", value: formValues.scope },
          { label: "Type", value: formValues.type },
          { label: "Discount", value: formValues.discountValue },
          { label: "Period", value: formValues.startDate && formValues.endDate ? `${toInputDateTime(formValues.startDate)} → ${toInputDateTime(formValues.endDate)}` : "--" },
        ]}
      />
    </section>
  );
}
