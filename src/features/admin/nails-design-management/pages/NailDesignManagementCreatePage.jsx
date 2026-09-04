import { FileImage, Sparkles, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROUTES } from "../../../../shared/constants/routes";
import { createEmptyNailDesign } from "../services/mockNailDesigns";
import {
  createAdminNailDesign,
  fetchAdminCategories,
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

export function NailDesignManagementCreatePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formValues, setFormValues] = useState(createEmptyNailDesign);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [designImagePreviewUrl, setDesignImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categoryRecords, setCategoryRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categoryResponse = await fetchAdminCategories({ pageNumber: 1, pageSize: 100 });

        if (isMounted) {
          setCategoryRecords(categoryResponse.items);
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

    void loadCategories();

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
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
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
              <div className="flex flex-wrap gap-2 mt-2">
                {categoryRecords.length ? categoryRecords.map((item) => (
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
                  <p className="text-sm text-[#b2879f]">{t("adminNailsDesignManagement.loading")}</p>
                )}
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
