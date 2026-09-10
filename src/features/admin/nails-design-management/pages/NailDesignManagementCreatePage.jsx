import { FileImage, Sparkles, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROUTES } from "../../../../shared/constants/routes";
import { createEmptyNailDesign } from "../services/mockNailDesigns";
import {
  createAdminNailDesign,
  fetchAdminCategoryTypes,
} from "../services/nailDesignManagementService";

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-[22px] border border-[#f6dbe8] bg-white p-5 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
      <div className="flex items-start gap-3">
        <div className="rounded-[16px] bg-[#fff0f7] p-3 text-[#ea4f93]">{icon}</div>
        <div>
          <h3 className="text-lg font-extrabold text-[#432744]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[#a88a9d]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PillButton({ active = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold transition ${active
        ? "border-[#ea4f93] bg-[linear-gradient(180deg,#f25b99_0%,#d92f7b_100%)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)]"
        : "border-[#f4c6da] bg-white text-[#8c7085] hover:border-[#ef6bb4] hover:text-[#ea4f93]"
        }`}
    >
      {children}
    </button>
  );
}

function ColorSwatchButton({ active = false, label, onClick, swatch }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[92px] flex-col items-center gap-2 rounded-[18px] border px-3 py-3 text-center transition ${active
        ? "border-[#ea4f93] bg-[#fff0f7] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
        : "border-[#f4c6da] bg-white hover:border-[#ef6bb4]"
        }`}
    >
      <span
        className="h-9 w-9 rounded-full border border-white shadow-[0_6px_14px_rgba(67,39,68,0.12)]"
        style={{ background: swatch }}
      />
      <span className={`text-[11px] font-bold ${active ? "text-[#ea4f93]" : "text-[#7e6075]"}`}>
        {label}
      </span>
    </button>
  );
}

function LivePreview({ variant, title }) {
  const shapeStyle = getShapeStyle(variant?.shape);
  const surfaceVisual = getSurfaceVisual(variant);

  return (
    <div className="rounded-[22px] border border-[#f6dbe8] bg-white p-4">
      <div className="rounded-lg bg-[radial-gradient(circle_at_top,#ffe2ef_0%,#fff8fb_42%,#fff_100%)] p-5">
        <div className="mx-auto grid max-w-[220px] grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="relative h-20 overflow-hidden border border-white"
              style={{
                ...shapeStyle,
                background: surfaceVisual.background,
                boxShadow: surfaceVisual.boxShadow,
              }}
            >
              <div className={`absolute inset-[8%] rounded-full blur-[10px] ${surfaceVisual.overlayClassName}`} />
              <div className="absolute left-[16%] top-[10%] h-[28%] w-[24%] rounded-full bg-white/35 blur-[3px]" />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm font-extrabold text-[#432744]">{title}</p>
      <p className="mt-1 text-xs text-[#a88a9d]">
        {variant?.shape} / {variant?.finish}
      </p>
    </div>
  );
}

export function NailDesignManagementCreatePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formValues, setFormValues] = useState(createEmptyNailDesign);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [designImagePreviewUrl, setDesignImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categoryTypeRecords, setCategoryTypeRecords] = useState([]);
  const [selectedCategoryTypeId, setSelectedCategoryTypeId] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCategoryTypes = async () => {
      try {
        const categoryTypeResponse = await fetchAdminCategoryTypes({ pageNumber: 1, pageSize: 100 });

        if (isMounted) {
          setCategoryTypeRecords(categoryTypeResponse.items);
          setSelectedCategoryTypeId((current) =>
            current || String(categoryTypeResponse.items[0]?.categoryTypeId || ""),
          );
        }
      } catch (loadError) {
        if (!isMounted) return;

        setSubmitError(
          loadError instanceof Error
            ? loadError.message
            : t("adminNailsDesignManagement.failedToLoadNailDesignReferenc"),
        );
      }
    };

    void loadCategoryTypes();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!designImageFile) {
      setDesignImagePreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(designImageFile);
    setDesignImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [designImageFile]);

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId],
    );
  };

  const selectedCategoryType = categoryTypeRecords.find(
    (item) => String(item.categoryTypeId) === String(selectedCategoryTypeId),
  );
  const visibleCategoryRecords = selectedCategoryType?.categories || [];
  const selectedCategoryRecords = categoryTypeRecords
    .flatMap((item) => item.categories || [])
    .filter((item) => selectedCategoryIds.includes(item.categoryId));

  const handleCreate = async () => {
    setSubmitError("");

    const normalizedName = String(formValues.name || "").trim();
    const normalizedDescription = String(formValues.description || "").trim();
    const isVi = language === "vi";

    if (!normalizedName) {
      setSubmitError(isVi ? "Ten thiet ke mong la bat buoc." : "Nail design name is required.");
      return;
    }

    if (!selectedCategoryIds.length) {
      setSubmitError(isVi ? "Vui long chon it nhat mot danh muc." : "Select at least one category.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAdminNailDesign({
        name: normalizedName,
        description: normalizedDescription,
        categoryIds: selectedCategoryIds,
        image: designImageFile,
      });

      navigate(ROUTES.adminNailDesigns, {
        state: {
          flashMessage: isVi
            ? `Tao thanh cong ${normalizedName}.`
            : `Created ${normalizedName} successfully.`,
        },
      });
    } catch (createError) {
      setSubmitError(
        createError instanceof Error ? createError.message : t("adminNailsDesignManagement.failedToCreateNailDesign"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4 flex min-h-full flex-col gap-4">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.7rem] font-extrabold text-[#432744]">
              {t("adminNailsDesignManagement.createNewNailDesign")}
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              Payload: Name, Description, CategoryIds, image
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isSubmitting}
            className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={13} className="mr-1.5 inline" />
            {isSubmitting ? t("adminNailsDesignManagement.publishing") : t("adminNailsDesignManagement.publishDesign")}
          </button>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
          {submitError}
        </div>
      ) : null}

      <SectionCard
        title={t("adminNailsDesignManagement.designInformation")}
        subtitle="Create the design first. Add variants from the design detail page after it exists."
        icon={<Sparkles size={18} />}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#5c4559]">
                {t("adminNailsDesignManagement.nailDesignName")} <span className="text-[#ea4f93]">*</span>
              </span>
              <input
                value={formValues.name}
                onChange={handleChange("name")}
                placeholder={t("adminNailsDesignManagement.egRubyBowRomance")}
                className="h-12 mt-2 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
              />
            </label>

            <div className="space-y-2 mt-2">
              <span className="text-sm font-semibold text-[#5c4559]">
                {t("adminNailsDesignManagement.category")} <span className="text-[#ea4f93]">*</span>
              </span>
              <div className="mt-2 grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
                <select
                  value={selectedCategoryTypeId}
                  onChange={(event) => setSelectedCategoryTypeId(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm font-semibold text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                >
                  {!categoryTypeRecords.length ? (
                    <option value="">{t("adminNailsDesignManagement.loading")}</option>
                  ) : null}
                  {categoryTypeRecords.map((item) => (
                    <option key={item.categoryTypeId} value={String(item.categoryTypeId)}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-2xl border border-[#f4d4e2] bg-[#fff9fc] px-3 py-2">
                  {visibleCategoryRecords.length ? visibleCategoryRecords.map((item) => (
                    <button
                      key={item.categoryId}
                      type="button"
                      onClick={() => toggleCategory(item.categoryId)}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition ${selectedCategoryIds.includes(item.categoryId)
                        ? "border-[#ea4f93] bg-[#fff0f7] text-[#ea4f93]"
                        : "border-[#f4c6da] bg-white text-[#8c7085] hover:border-[#ef6bb4]"
                        }`}
                    >
                      {item.name}
                    </button>
                  )) : (
                    <p className="text-sm text-[#b2879f]">
                      {categoryTypeRecords.length
                        ? (language === "vi" ? "Loại danh mục này chưa có danh mục." : "This category type has no categories.")
                        : t("adminNailsDesignManagement.loading")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-dashed border-[#f4c6da] bg-[#fffafb] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c896af]">
                  {language === "vi" ? "Danh mục đã chọn" : "Selected Categories"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCategoryRecords.length ? selectedCategoryRecords.map((item) => (
                    <button
                      key={item.categoryId}
                      type="button"
                      onClick={() => toggleCategory(item.categoryId)}
                      className="rounded-full border border-[#ea4f93] bg-[#fff0f7] px-3 py-1.5 text-xs font-bold text-[#ea4f93]"
                    >
                      {item.name}
                    </button>
                  )) : (
                    <p className="text-sm text-[#b2879f]">
                      {language === "vi" ? "Chưa chọn danh mục nào." : "No categories selected yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#5c4559]">{t("adminNailsDesignManagement.description")}</span>
              <textarea
                value={formValues.description}
                onChange={handleChange("description")}
                rows={4}
                placeholder={t("adminNailsDesignManagement.describeTheStyleAndKeyDetails")}
                className="w-full rounded-2xl mt-2 border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-[18px] border border-[#f7d7e5] bg-[#fff7fb]">
              {designImagePreviewUrl ? (
                <img
                  src={designImagePreviewUrl}
                  alt={formValues.name || t("adminNailsDesignManagement.designImages")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#c694ad]">
                  <FileImage size={34} />
                  <span className="text-xs font-bold">{t("adminNailsDesignManagement.noDesignImagesSelected")}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("design-image-input")?.click()}
              className="w-full rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <Upload size={13} className="mr-1.5 inline" />
              {t("adminNailsDesignManagement.chooseDesignImages")}
            </button>
            <input
              id="design-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setDesignImageFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-center text-xs text-[#b2879f]">
              {designImageFile ? designImageFile.name : t("adminNailsDesignManagement.noDesignImagesSelected")}
            </p>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
