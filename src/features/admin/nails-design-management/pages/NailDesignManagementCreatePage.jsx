import { Check, Copy, FileImage, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { createEmptyNailDesign } from "../services/mockNailDesigns";
import {
  createAdminNailDesign,
  createAdminNailVariant,
  fetchAdminCategories,
  fetchAdminNailVariantReferences,
} from "../services/nailDesignManagementService";

const VARIANT_COLOR_OPTIONS = [
  { label: "Cherry Red", swatch: "linear-gradient(135deg,#d61f4b 0%,#8e0e22 100%)", hex: "#d61f4b" },
  { label: "Wine Red", swatch: "linear-gradient(135deg,#9c2438 0%,#5f1120 100%)", hex: "#9c2438" },
  { label: "Rose Gold", swatch: "linear-gradient(135deg,#e2a3b8 0%,#bb5f79 100%)", hex: "#e2a3b8" },
  { label: "Pearl White", swatch: "linear-gradient(135deg,#fff8fb 0%,#d9b8c8 100%)", hex: "#fff8fb" },
  { label: "Champagne Gold", swatch: "linear-gradient(135deg,#f0d28c 0%,#b98522 100%)", hex: "#f0d28c" },
  { label: "Soft Pink", swatch: "linear-gradient(135deg,#ffd9ea 0%,#e47fb0 100%)", hex: "#ffd9ea" },
];

function normalizeLookupValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildVariantColorJson(colorHex) {
  return JSON.stringify({
    mode: "solid",
    color: String(colorHex || "").trim() || "#d61f4b",
    gradient: null,
  });
}

function formatOptionLabel(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getShapeStyle(shapeName) {
  const normalizedShape = normalizeLookupValue(shapeName);

  if (normalizedShape.includes("stiletto")) {
    return { clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", borderRadius: "20px 20px 10px 10px" };
  }

  if (normalizedShape.includes("ballerina") || normalizedShape.includes("coffin")) {
    return { clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)", borderRadius: "18px 18px 10px 10px" };
  }

  if (normalizedShape.includes("square")) {
    return { borderRadius: "12px 12px 8px 8px" };
  }

  if (normalizedShape.includes("squoval")) {
    return { borderRadius: "18px 18px 10px 10px" };
  }

  if (normalizedShape.includes("round")) {
    return { borderRadius: "999px 999px 18px 18px" };
  }

  return { borderRadius: "999px 999px 22px 22px" };
}

function getSurfaceVisual(variant) {
  const normalizedName = normalizeLookupValue(variant?.finish);
  const normalizedShader = normalizeLookupValue(variant?.surfaceShaderParam);

  if (
    normalizedName.includes("trang guong")
    || normalizedName.includes("chrome")
    || normalizedShader.includes("metallic")
  ) {
    return {
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(232,232,236,1) 22%, rgba(160,164,176,1) 50%, rgba(249,228,241,1) 78%, rgba(255,255,255,0.96) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 20px rgba(120,120,140,0.22)",
      overlayClassName: "bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.78)_45%,transparent_80%)] opacity-90",
    };
  }

  if (normalizedName.includes("bong") || normalizedName.includes("glossy") || normalizedShader.includes("standard")) {
    return {
      background: variant?.colorHex || "#d61f4b",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.82), 0 10px 18px rgba(214,31,75,0.16)",
      overlayClassName: "bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.08)_45%,transparent_75%)] opacity-100",
    };
  }

  return {
    background: variant?.colorHex || "#d61f4b",
    boxShadow: "0 8px 18px rgba(67,39,68,0.08)",
    overlayClassName: "bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,transparent_70%)] opacity-70",
  };
}

function createEmptyVariant(index) {
  return {
    code: index === 0 ? "BASE" : `VAR ${index}`,
    name: "",
    color: VARIANT_COLOR_OPTIONS[0].label,
    colorHex: VARIANT_COLOR_OPTIONS[0].hex,
    shape: "Almond",
    finish: "Glossy",
    surfaceShaderParam: "",
    imageFile: null,
    badgeTone: index === 0 ? "bg-[#ea4f93] text-white" : "bg-[#f2e9ff] text-[#8b5cf6]",
  };
}

function SectionCard({ step, title, subtitle, icon, children }) {
  return (
    <section className="rounded-[24px] border border-[#f6dbe8] bg-white p-5 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
      <div className="flex items-start gap-3">
        <div className="rounded-[16px] bg-[#fff0f7] p-3 text-[#ea4f93]">{icon}</div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c694ad]">Step {step}</div>
          <h3 className="mt-1 text-lg font-extrabold text-[#432744]">{title}</h3>
          <p className="mt-1 text-sm text-[#a88a9d]">{subtitle}</p>
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
      <div className="rounded-[20px] bg-[radial-gradient(circle_at_top,#ffe2ef_0%,#fff8fb_42%,#fff_100%)] p-5">
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
  const [variants, setVariants] = useState([createEmptyVariant(0)]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [designImageFiles, setDesignImageFiles] = useState([]);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [variantReferences, setVariantReferences] = useState({ shapes: [], surfaces: [] });
  const shapeOptions = variantReferences.shapes;
  const surfaceOptions = variantReferences.surfaces;

  useEffect(() => {
    let isMounted = true;

    const loadReferences = async () => {
      try {
        const [categoryResponse, variantReferenceResponse] = await Promise.all([
          fetchAdminCategories({ pageNumber: 1, pageSize: 100 }),
          fetchAdminNailVariantReferences(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategoryRecords(categoryResponse.items);
        setVariantReferences(variantReferenceResponse);
        setFormValues((current) =>
          !current.category && categoryResponse.items.length > 0
            ? {
              ...current,
              category: categoryResponse.items[0].name,
            }
            : current,
        );
        setVariants((current) =>
          current.map((variant) => {
            const matchedShape = variantReferenceResponse.shapes.find(
              (item) => normalizeLookupValue(item.name) === normalizeLookupValue(variant.shape),
            );
            const matchedSurface = variantReferenceResponse.surfaces.find(
              (item) => normalizeLookupValue(item.name) === normalizeLookupValue(variant.finish),
            );

            return {
              ...variant,
              shape: matchedShape?.name || variantReferenceResponse.shapes[0]?.name || variant.shape,
              finish: matchedSurface?.name || variantReferenceResponse.surfaces[0]?.name || variant.finish,
              surfaceShaderParam: matchedSurface?.shaderParam || variant.surfaceShaderParam || "",
            };
          }),
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSubmitError(
          loadError instanceof Error
            ? loadError.message
            : (t("adminNailsDesignManagement.failedToLoadNailDesignReferenc")),
        );
      }
    };

    void loadReferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const updateVariant = (index, field, value) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const addVariant = () => {
    setVariants((current) => {
      const nextIndex = current.length;
      return [
        ...current,
        {
          ...createEmptyVariant(nextIndex),
          shape: shapeOptions[0]?.name || "Almond",
          finish: surfaceOptions[0]?.name || "Glossy",
          surfaceShaderParam: surfaceOptions[0]?.shaderParam || "",
        },
      ];
    });
    setActiveVariantIndex(variants.length);
  };

  const duplicateVariant = (index) => {
    setVariants((current) => {
      const source = current[index];
      return [
        ...current,
        {
          ...source,
          code: `VAR ${current.length}`,
          name: source.name ? `${source.name} Copy` : `Variant ${current.length}`,
          badgeTone: "bg-[#f2e9ff] text-[#8b5cf6]",
        },
      ];
    });
  };

  const removeVariant = (index) => {
    setVariants((current) => {
      if (current.length === 1) {
        return current;
      }

      const next = current.filter((_, variantIndex) => variantIndex !== index);
      setActiveVariantIndex((currentIndex) => Math.max(0, Math.min(currentIndex, next.length - 1)));
      return next;
    });
  };

  const handleCreate = async () => {
    setShowCreateConfirm(false);
    setSubmitError("");

    const normalizedName = String(formValues.name || "").trim();
    const normalizedDescription = String(formValues.description || "").trim();
    const isVi = language === "vi";

    if (!normalizedName) {
      setSubmitError(isVi ? "Tên thiết kế móng là bắt buộc." : "Nail design name is required.");
      return;
    }

    const selectedCategory = categoryRecords.find(
      (item) => normalizeLookupValue(item.name) === normalizeLookupValue(formValues.category),
    );

    if (!selectedCategory?.categoryId) {
      setSubmitError(isVi ? `Danh mục "${formValues.category}" không có sẵn từ danh mục của API.` : `Category "${formValues.category}" is not available from API categories.`);
      return;
    }

    const shapeByName = new Map(
      variantReferences.shapes.map((item) => [normalizeLookupValue(item.name), item]),
    );
    const surfaceByName = new Map(
      variantReferences.surfaces.flatMap((item) => {
        const entries = [[normalizeLookupValue(item.name), item]];

        if (normalizeLookupValue(item.name) === "bong") {
          entries.push(["glossy", item]);
        }

        return entries;
      }),
    );

    const unresolvedVariant = variants.find((variant) => {
      const shapeMatch = shapeByName.get(normalizeLookupValue(variant.shape));
      const surfaceMatch = surfaceByName.get(normalizeLookupValue(variant.finish));
      return !shapeMatch || !surfaceMatch;
    });

    if (unresolvedVariant) {
      setSubmitError(
        isVi
          ? `Biến thể "${unresolvedVariant.name || unresolvedVariant.code}" có dáng móng hoặc bề mặt không được hỗ trợ để tạo API.`
          : `Variant "${unresolvedVariant.name || unresolvedVariant.code}" has unsupported shape or surface mapping for API create.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const createdDesign = await createAdminNailDesign({
        name: normalizedName,
        description: normalizedDescription,
        categoryIds: [selectedCategory.categoryId],
        images: designImageFiles,
      });

      const createdVariants = await Promise.all(
        variants.map((variant, index) => {
          const shapeMatch = shapeByName.get(normalizeLookupValue(variant.shape));
          const surfaceMatch = surfaceByName.get(normalizeLookupValue(variant.finish));

          return createAdminNailVariant({
            name: String(variant.name || "").trim() || `Variant ${index + 1}`,
            nailShapeId: shapeMatch?.nailShapeId,
            nailSurfaceId: surfaceMatch?.nailSurfaceId,
            nailDesignId: createdDesign.nailDesignId,
            colorJson: buildVariantColorJson(variant.colorHex),
            image: variant.imageFile,
          });
        }),
      );

      navigate(ROUTES.adminNailDesigns, {
        state: {
          flashMessage: language === "vi"
            ? `Tạo thành công ${normalizedName} với ${createdVariants.length} biến thể.`
            : `Created ${normalizedName} with ${createdVariants.length} variants successfully.`,
        },
      });
    } catch (createError) {
      setSubmitError(
        createError instanceof Error ? createError.message : (t("adminNailsDesignManagement.failedToCreateNailDesign")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVariant = variants[activeVariantIndex] ?? variants[0];
  const previewTitle = `${activeVariant?.name || "New Variant"} / ${formatOptionLabel(activeVariant?.shape || "Shape")}`;

  return (
    <section className="flex min-h-full flex-col gap-4 flex min-h-full flex-col gap-4">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.7rem] font-extrabold text-[#432744]">
              {t("adminNailsDesignManagement.createNewNailDesign")}
            </h2>
            <p className="mt-1 text-sm text-[#c694ad]">
              {t("adminNailsDesignManagement.uiDaDuocRutGonTheoDungPayloadA")
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateConfirm(true)}
            disabled={isSubmitting}
            className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
          >
            <Sparkles size={13} className="mr-1.5 inline" />
            {isSubmitting ? (t("adminNailsDesignManagement.publishing")) : (t("adminNailsDesignManagement.publishDesign"))}
          </button>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-[16px] bg-[#fff1f5] px-4 py-3 text-sm font-medium text-[#d14c84]">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard
            step="1"
            title={t("adminNailsDesignManagement.designInformation")}
            subtitle="Payload: Name, Description, CategoryIds"
            icon={<Sparkles size={18} />}
          >
            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">
                  {t("adminNailsDesignManagement.nailDesignName")} <span className="text-[#ea4f93]">*</span>
                </span>
                <input
                  value={formValues.name}
                  onChange={handleChange("name")}
                  placeholder={t("adminNailsDesignManagement.egRubyBowRomance")}
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">
                  {t("adminNailsDesignManagement.category")} <span className="text-[#ea4f93]">*</span>
                </span>
                <select
                  value={formValues.category}
                  onChange={handleChange("category")}
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                >
                  {categoryRecords.length ? (
                    categoryRecords.map((item) => (
                      <option key={item.categoryId} value={item.name}>
                        {item.name}
                      </option>
                    ))
                  ) : (
                    <option value={formValues.category || ""}>{formValues.category || (t("adminNailsDesignManagement.loading"))}</option>
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">{t("adminNailsDesignManagement.description")}</span>
                <textarea
                  value={formValues.description}
                  onChange={handleChange("description")}
                  rows={4}
                  placeholder={t("adminNailsDesignManagement.describeTheStyleAndKeyDetails")}
                  className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            step="2"
            title={t("adminNailsDesignManagement.variants")}
            subtitle="Payload: Name, NailShapeId, NailSurfaceId, NailDesignId, ColorJson, image"
            icon={<Copy size={18} />}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={addVariant}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
              >
                <Plus size={13} className="mr-1.5 inline" />
                {t("adminNailsDesignManagement.addNewVariant")}
              </button>
            </div>

            <div className="space-y-5">
              {variants.map((variant, index) => (
                <div
                  key={variant.code}
                  className={`rounded-[22px] border p-4 transition ${activeVariantIndex === index
                    ? "border-[#ef6bb4] bg-[#fff0f6] shadow-[0_12px_24px_rgba(236,72,153,0.12)]"
                    : "border-[#f7d7e5] bg-[#fff3f8]"
                    }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveVariantIndex(index)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${variant.badgeTone}`}>
                        {variant.code}
                      </span>
                      <h4 className="font-extrabold text-[#432744]">{variant.name || (language === "vi" ? `Biến thể ${index + 1}` : `Variant ${index + 1}`)}</h4>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateVariant(index)}
                        className="rounded-xl bg-white p-2 text-[#d58aa8]"
                        title={t("adminNailsDesignManagement.duplicateVariant")}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="rounded-xl bg-white p-2 text-[#ea4f93]"
                        title={t("adminNailsDesignManagement.removeVariant")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-4">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-[#5c4559]">{t("adminNailsDesignManagement.variantName")}</span>
                        <input
                          value={variant.name}
                          onChange={(event) => updateVariant(index, "name", event.target.value)}
                          placeholder={language === "vi" ? `Biến thể ${index + 1}` : `Variant ${index + 1}`}
                          className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                        />
                      </label>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">{t("adminNailsDesignManagement.color")}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {VARIANT_COLOR_OPTIONS.map((item) => (
                            <ColorSwatchButton
                              key={item.label}
                              active={variant.color === item.label}
                              label={item.label}
                              swatch={item.swatch}
                              onClick={() => {
                                updateVariant(index, "color", item.label);
                                updateVariant(index, "colorHex", item.hex);
                                updateVariant(
                                  index,
                                  "surfaceShaderParam",
                                  surfaceOptions.find(
                                    (surface) =>
                                      normalizeLookupValue(surface.name) === normalizeLookupValue(variant.finish),
                                  )?.shaderParam || "",
                                );
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                          <input
                            type="color"
                            value={variant.colorHex || "#d61f4b"}
                            onChange={(event) => updateVariant(index, "colorHex", event.target.value)}
                            className="h-11 w-full cursor-pointer rounded-2xl border border-[#f4d4e2] bg-white p-1"
                          />
                          <input
                            value={variant.colorHex || ""}
                            onChange={(event) => updateVariant(index, "colorHex", event.target.value)}
                            placeholder="#d61f4b"
                            className="h-11 w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 text-sm text-[#432744] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">{t("adminNailsDesignManagement.shape")}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {shapeOptions.map((item) => (
                            <PillButton
                              key={item.nailShapeId}
                              active={normalizeLookupValue(variant.shape) === normalizeLookupValue(item.name)}
                              onClick={() => updateVariant(index, "shape", item.name)}
                            >
                              {formatOptionLabel(item.name)}
                            </PillButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c694ad]">{t("adminNailsDesignManagement.surface")}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {surfaceOptions.map((item) => (
                            <PillButton
                              key={item.nailSurfaceId}
                              active={normalizeLookupValue(variant.finish) === normalizeLookupValue(item.name)}
                              onClick={() => {
                                updateVariant(index, "finish", item.name);
                                updateVariant(index, "surfaceShaderParam", item.shaderParam || "");
                              }}
                            >
                              {formatOptionLabel(item.name)}
                            </PillButton>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[18px] border border-[#f4d4e2] bg-white p-4">
                        <p className="text-sm font-semibold text-[#5c4559]">{t("adminNailsDesignManagement.colorJsonPreview")}</p>
                        <textarea
                          value={buildVariantColorJson(variant.colorHex)}
                          readOnly
                          rows={4}
                          className="mt-3 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffafb] px-4 py-3 text-xs text-[#6b5367] outline-none"
                        />
                      </div>

                      <div className="rounded-[18px] border border-dashed border-[#f4bfd6] bg-white px-4 py-6 text-center">
                        <FileImage size={20} className="mx-auto text-[#ea4f93]" />
                        <p className="mt-4 font-bold text-[#432744]">{t("adminNailsDesignManagement.variantImage")}</p>
                        <p className="mt-1 text-xs text-[#c694ad]">
                          {t("adminNailsDesignManagement.optionalImageForThisVariant")}
                        </p>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`variant-image-input-${index}`)?.click()}
                          className="mt-4 rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                        >
                          <Upload size={13} className="mr-1.5 inline" />
                          {t("adminNailsDesignManagement.uploadVariantImage")}
                        </button>
                        <input
                          id={`variant-image-input-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => updateVariant(index, "imageFile", event.target.files?.[0] ?? null)}
                        />
                        <p className="mt-3 text-xs text-[#b2879f]">
                          {variant.imageFile ? variant.imageFile.name : (t("adminNailsDesignManagement.noVariantImageSelected"))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            step="3"
            title={t("adminNailsDesignManagement.designImages")}
            subtitle={t("adminNailsDesignManagement.optionalImagesFilesForPostApin")}
            icon={<FileImage size={18} />}
          >
            <div className="rounded-[18px] border border-[#f7d7e5] bg-white px-4 py-4 text-center">
              <button
                type="button"
                onClick={() => document.getElementById("design-images-input")?.click()}
                className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
              >
                <Upload size={13} className="mr-1.5 inline" />
                {t("adminNailsDesignManagement.chooseDesignImages")}
              </button>
              <input
                id="design-images-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => setDesignImageFiles(Array.from(event.target.files ?? []))}
              />
              <p className="mt-3 text-xs text-[#b2879f]">
                {designImageFiles.length
                  ? `${designImageFiles.length} ${t("adminNailsDesignManagement.files")}: ${designImageFiles.map((file) => file.name).join(", ")}`
                  : (t("adminNailsDesignManagement.noDesignImagesSelected"))}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            step="4"
            title={t("adminNailsDesignManagement.finalReview")}
            subtitle={t("adminNailsDesignManagement.quickCheckBeforePublish")}
            icon={<Check size={18} />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [formValues.name, t("adminNailsDesignManagement.designName")],
                [formValues.category, t("adminNailsDesignManagement.category")],
                [String(variants.length), t("adminNailsDesignManagement.variants")],
                [String(designImageFiles.length), t("adminNailsDesignManagement.designImages")],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-[#f7d7e5] bg-[#fff3f8] px-4 py-5 text-center"
                >
                  <p className="text-2xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-xs text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowCreateConfirm(true)}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
              >
                <Sparkles size={13} className="mr-1.5 inline" />
                {t("adminNailsDesignManagement.publishDesign")}
              </button>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-[#f8d3e2] bg-[linear-gradient(180deg,#fff7fb_0%,#fff1f6_100%)] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#432744]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#ff477f]" />
              {t("adminNailsDesignManagement.livePreview")}
            </div>
            <div className="mt-4">
              <LivePreview variant={activeVariant} title={previewTitle} />
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f8d3e2] bg-[#fff7fb] p-4 shadow-[0_14px_34px_rgba(236,72,153,0.06)]">
            <h3 className="font-extrabold text-[#432744]">{t("adminNailsDesignManagement.currentVariant")}</h3>
            <div className="mt-4 space-y-2 text-sm text-[#8c7085]">
              <div className="flex items-center justify-between gap-3">
                <span>{t("adminNailsDesignManagement.name")}</span>
                <span className="font-semibold text-[#432744]">{activeVariant.name || (t("adminNailsDesignManagement.notSet"))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t("adminNailsDesignManagement.color")}</span>
                <span className="font-semibold text-[#432744]">{activeVariant.colorHex || (t("adminNailsDesignManagement.notSet"))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t("adminNailsDesignManagement.shape")}</span>
                <span className="font-semibold text-[#432744]">{formatOptionLabel(activeVariant.shape || (t("adminNailsDesignManagement.notSet")))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t("adminNailsDesignManagement.surface")}</span>
                <span className="font-semibold text-[#432744]">{formatOptionLabel(activeVariant.finish || (t("adminNailsDesignManagement.notSet")))}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <ActionConfirmModal
        open={showCreateConfirm}
        intent="success"
        title={t("adminNailsDesignManagement.publishNailDesign")}
        subtitle={t("adminNailsDesignManagement.thisWillCallPostApinaildesigns")}
        description={t("adminNailsDesignManagement.confirmToCreateTheNailDesignFi")}
        confirmText={t("adminNailsDesignManagement.publishDesign")}
        cancelText={t("adminNailsDesignManagement.reviewAgain")}
        confirmIcon={Sparkles}
        width={520}
        loading={isSubmitting}
        onConfirm={handleCreate}
        onCancel={() => !isSubmitting && setShowCreateConfirm(false)}
        highlights={[formValues.name || (t("adminNailsDesignManagement.newNailDesign")), formValues.category || (t("adminNailsDesignManagement.categoryPending")), language === "vi" ? `${variants.length} biến thể` : `${variants.length} variant(s)`]}
        details={[
          { label: t("adminNailsDesignManagement.designImages1"), value: designImageFiles.length ? (language === "vi" ? `${designImageFiles.length} ảnh` : String(designImageFiles.length)) : (t("adminNailsDesignManagement.noImage")) },
          { label: t("adminNailsDesignManagement.activeVariant"), value: activeVariant?.name || (t("adminNailsDesignManagement.variant1")) },
        ]}
        warnings={[t("adminNailsDesignManagement.categoryShapeAndSurfaceValuesM")]}
      />
    </section>
  );
}
