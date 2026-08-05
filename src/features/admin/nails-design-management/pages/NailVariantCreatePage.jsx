import { ArrowLeft, FileImage, LoaderCircle, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { createPlacedNailComponent } from "../../../../services/nailDesign.service";
import {
  getAdminNailDesignDetailRoute,
  getAdminNailVariantCreateRoute,
  getAdminNailVariantCreateTryOnRoute,
  getAdminNailVariantDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import {
  createAdminNailVariant,
  fetchAdminNailVariantReferences,
} from "../services/nailDesignManagementService";

const DEFAULT_FORM = {
  name: "",
  image: null,
  tryOnConfig: null,
};

import {
  buildColorJsonFromTryOn,
  createVariantNailComponents,
  findShapeId,
  findSurfaceId,
} from "../utils/variantTryOnUtils";

export function NailVariantCreatePage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const location = useLocation();
  const routeState = location.state ?? {};
  const [formValues, setFormValues] = useState(() => ({
    ...DEFAULT_FORM,
    ...routeState.draftValues,
    tryOnConfig: routeState.tryOnConfig ?? null,
  }));
  const [references, setReferences] = useState({ shapes: [], surfaces: [] });
  const [isLoadingReferences, setIsLoadingReferences] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const previewImageUrl = useMemo(
    () => (formValues.image ? URL.createObjectURL(formValues.image) : ""),
    [formValues.image],
  );

  useEffect(() => {
    let isMounted = true;

    const loadReferences = async () => {
      setIsLoadingReferences(true);
      setError("");

      try {
        const nextReferences = await fetchAdminNailVariantReferences();

        if (!isMounted) {
          return;
        }

        setReferences(nextReferences);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : (t("adminNailsDesignManagement.failedToLoadNailVariantReferen")),
        );
      } finally {
        if (isMounted) {
          setIsLoadingReferences(false);
        }
      }
    };

    void loadReferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  if (!designId) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  const handleSetUpTryOn = () => {
    navigate(getAdminNailVariantCreateTryOnRoute(designId), {
      state: {
        draftValues: {
          name: formValues.name,
        },
        returnTo: getAdminNailVariantCreateRoute(designId),
        tryOnConfig: formValues.tryOnConfig ?? undefined,
      },
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedName = String(formValues.name || "").trim();
    const isVi = language === "vi";

    if (!normalizedName) {
      setError(isVi ? "Tên biến thể là bắt buộc." : "Variant name is required.");
      return;
    }

    if (!formValues.image) {
      setError(isVi ? "Tệp hình ảnh biến thể là bắt buộc." : "Variant image file is required.");
      return;
    }

    const nailShapeId = findShapeId(references.shapes, formValues.tryOnConfig);
    const nailSurfaceId = findSurfaceId(references.surfaces, formValues.tryOnConfig);

    if (!nailShapeId || !nailSurfaceId) {
      setError(isVi ? "Cần thiết lập dáng móng và bề mặt móng trước khi lưu." : "Nail shape and surface references are required before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const savedVariant = await createAdminNailVariant({
        name: normalizedName,
        nailShapeId,
        nailSurfaceId,
        nailDesignId: Number(designId),
        colorJson: buildColorJsonFromTryOn(formValues.tryOnConfig),
        image: formValues.image,
      });
      const savedVariantId = savedVariant?.nailVariantId ?? savedVariant?.id;

      if (savedVariantId && formValues.tryOnConfig) {
        await createVariantNailComponents(savedVariantId, formValues.tryOnConfig);
      }

      navigate(
        savedVariantId
          ? getAdminNailVariantDetailRoute(designId, savedVariantId)
          : getAdminNailDesignDetailRoute(designId),
        {
          state: {
            flashMessage: isVi ? `Đã tạo biến thể "${normalizedName}".` : `Created variant "${normalizedName}".`,
          },
        },
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (isVi ? "Tạo biến thể móng thất bại." : "Failed to create nail variant."));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedShape = references.shapes.find(
    (shape) => Number(shape.nailShapeId) === Number(findShapeId(references.shapes, formValues.tryOnConfig)),
  );
  const selectedSurface = references.surfaces.find(
    (surface) => Number(surface.nailSurfaceId) === Number(findSurfaceId(references.surfaces, formValues.tryOnConfig)),
  );

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              {t("adminNailsDesignManagement.nailDesigns")}<span className="text-[#ea4f93]">{t("adminNailsDesignManagement.addNailVariant")}</span>
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#432744]">
              {t("adminNailsDesignManagement.addNailVariant")}
            </h1>
            <p className="mt-1 text-sm text-[#8c7085]">
              {t("adminNailsDesignManagement.setUpTryonDataFirstIfNeededNot")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(getAdminNailDesignDetailRoute(designId))}
            className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#8c7085]"
          >
            <ArrowLeft size={14} className="mr-1.5 inline" />
            {t("adminNailsDesignManagement.backToDesign")}
          </button>
        </div>
      </div>

      <form
        onSubmit={(event) => void handleSave(event)}
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-4">
          <section className="rounded-[22px] border border-[#f8d3e2] bg-white p-5 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
            <div className="flex items-start gap-3">
              <div className="rounded-[16px] bg-[#fff0f7] p-3 text-[#ea4f93]">
                <FileImage size={18} />
              </div>
              <div>
                <h2 className="font-extrabold text-[#432744]">{t("adminNailsDesignManagement.variantInformation")}</h2>
                <p className="mt-1 text-sm text-[#a88a9d]">
                  {t("adminNailsDesignManagement.nameAndImageFileAreRequired")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">
                  {t("adminNailsDesignManagement.variantName")} <span className="text-[#ea4f93]">*</span>
                </span>
                <input
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t("adminNailsDesignManagement.egPearlChromeAccent")}
                  className="h-12 w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5c4559]">
                  {t("adminNailsDesignManagement.imageFile")} <span className="text-[#ea4f93]">*</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      image: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#f4d4e2] bg-[#fffdfd] px-4 py-3 text-sm text-[#432744] outline-none transition focus:border-[#ef6bb4]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#f8d3e2] bg-white p-5 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-[16px] bg-[#fff0f7] p-3 text-[#ea4f93]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#432744]">{t("adminNailsDesignManagement.nailTryonSetup")}</h2>
                  <p className="mt-1 text-sm text-[#a88a9d]">
                    {t("adminNailsDesignManagement.cachedInBrowserRouteStateUntil")
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSetUpTryOn}
                disabled={isLoadingReferences}
                className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("adminNailsDesignManagement.setUpNailTryOn")}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                [t("adminNailsDesignManagement.setupStatus"), formValues.tryOnConfig ? (t("adminNailsDesignManagement.configured")) : (t("adminNailsDesignManagement.notConfigured"))],
                [t("adminNailsDesignManagement.shape"), selectedShape?.name || (t("adminNailsDesignManagement.default"))],
                [t("adminNailsDesignManagement.surface"), selectedSurface?.name || (t("adminNailsDesignManagement.default"))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {error ? (
            <div className="rounded-[18px] border border-[#f4bfd2] bg-[#fff1f6] px-5 py-3 text-sm font-semibold text-[#d14c84]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || isLoadingReferences}
              className="rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <LoaderCircle size={14} className="mr-1.5 inline animate-spin" />
                  {t("adminNailsDesignManagement.saving")}
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1.5 inline" />
                  {t("adminNailsDesignManagement.saveVariant")}
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[22px] border border-[#f8d3e2] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
            <h2 className="font-extrabold text-[#432744]">{t("adminNailsDesignManagement.preview")}</h2>
            <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f6edf2]">
              {previewImageUrl ? (
                <img
                  crossOrigin="anonymous"
                  src={previewImageUrl}
                  alt={formValues.name || "Variant preview"}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#b2879f]">
                  {t("adminNailsDesignManagement.noImageSelected")}
                </div>
              )}
            </div>
            <p className="mt-4 text-sm font-extrabold text-[#432744]">{formValues.name || (t("adminNailsDesignManagement.unnamedVariant"))}</p>
            <p className="mt-1 text-xs text-[#a88a9d]">
              {t("adminNailsDesignManagement.theUploadedImageAndCachedTryon")
              }
            </p>
          </section>
        </aside>
      </form>
    </section>
  );
}
