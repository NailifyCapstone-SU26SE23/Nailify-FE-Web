import {
  ArrowLeft,
  Camera,
  Eye,
  Image,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getAdminNailDesignDetailRoute,
  getAdminNailVariantDetailRoute,
  getAdminNailVariantTryOnRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import {
  assignProceduresToVariant,
  fetchAdminNailVariantDetail,
  fetchProceduresByVariant,
} from "../services/nailDesignManagementService";

const DESIGN_PREVIEW_IMAGE =
  "https://i0.wp.com/greenweddingshoes.com/wp-content/uploads/2025/12/red-cat-eye-christmas-holiday-nails-with-bow.webp?fit=1024%2C9999";

function isHexColor(value) {
  return /^#(?:[0-9a-f]{3}){1,2}$/i.test(String(value || "").trim());
}

function extractVariantColors(colorJson) {
  const rawValue = String(colorJson || "").trim();
  const parsedColors = [];

  const collectColors = (value) => {
    if (Array.isArray(value)) {
      value.forEach(collectColors);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(collectColors);
      return;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      if (isHexColor(normalized)) {
        parsedColors.push(normalized);
      }
    }
  };

  try {
    collectColors(JSON.parse(rawValue));
  } catch {
    collectColors(rawValue);
  }

  return [...new Set(parsedColors)];
}

function Pill({ children, tone = "default" }) {
  const toneMap = {
    default: "border-[#f4c6da] bg-white text-[#8c7085]",
    pink: "border-[#ffd1e3] bg-[#fff0f7] text-[#ea4f93]",
    purple: "border-[#ead8ff] bg-[#f5ecff] text-[#8b5cf6]",
    blue: "border-[#dce7ff] bg-[#eef4ff] text-[#4a72d8]",
    yellow: "border-[#f8e3b3] bg-[#fff4df] text-[#d9871c]",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

function DetailCard({ title, children }) {
  return (
    <article className="rounded-[20px] border border-[#f7d7e5] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
      <h2 className="font-extrabold text-[#432744]">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

export function NailVariantDetailPage() {
  const { designId, variantId } = useParams();
  const navigate = useNavigate();
  const [variant, setVariant] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProcedures, setIsSavingProcedures] = useState(false);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const colors = extractVariantColors(variant?.colorJson);

  useEffect(() => {
    let isMounted = true;

    const loadVariant = async () => {
      setIsLoading(true);
      setError("");
      setIsNotFound(false);

      try {
        const [detail, loadedProcedures] = await Promise.all([
          fetchAdminNailVariantDetail(variantId),
          fetchProceduresByVariant(variantId),
        ]);

        if (!isMounted) return;
        setVariant(detail);
        setProcedures(loadedProcedures);
      } catch (loadError) {
        if (!isMounted) return;

        const statusCode = loadError && typeof loadError === "object" ? loadError.response?.status : undefined;
        if (statusCode === 404) {
          setIsNotFound(true);
        } else {
          setError(loadError instanceof Error ? loadError.message : "Failed to load nail variant detail.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadVariant();

    return () => {
      isMounted = false;
    };
  }, [variantId]);

  const updateProcedureDraft = (index, value) => {
    setProcedures((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            stepOrder: value,
          }
          : item,
      ),
    );
  };

  const addProcedureDraft = () => {
    setProcedures((current) => [
      ...current,
      {
        procedureId: "",
        name: "",
        description: "",
        duration: 0,
        durationLabel: "--",
        status: "--",
        isRequired: false,
        stepOrder: current.length + 1,
      },
    ]);
  };

  const saveProcedureSteps = async () => {
    if (!variant?.nailVariantId) return;

    setIsSavingProcedures(true);
    setError("");

    try {
      await assignProceduresToVariant(
        variant.nailVariantId,
        procedures.map((item, index) => ({
          procedureId: item.procedureId,
          stepOrder: Number(item.stepOrder || index + 1),
        })),
      );
      setProcedures(await fetchProceduresByVariant(variant.nailVariantId));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save procedure steps.");
    } finally {
      setIsSavingProcedures(false);
    }
  };

  const openTryOn = (mode) => {
    navigate(getAdminNailVariantTryOnRoute(designId, variantId, mode), {
      state: {
        returnTo: getAdminNailVariantDetailRoute(designId, variantId),
      },
    });
  };

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[#fff7fb] px-4 py-10">
        <div className="flex items-center gap-3 rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          Loading nail variant detail...
        </div>
      </section>
    );
  }

  if (isNotFound) {
    return <Navigate to={ROUTES.adminNailDesigns} replace />;
  }

  if (!variant) {
    return (
      <section className="flex min-h-full items-center justify-center bg-[#fff7fb] px-4 py-10">
        <div className="rounded-[18px] border border-[#f8dce8] bg-white px-5 py-4 text-sm font-medium text-[#d14c84]">
          {error || "Failed to load nail variant detail."}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[#fff7fb]">
      <div className="rounded-[18px] border border-[#f8d8e6] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[#c694ad]">
              Nail Designs / <span className="text-[#ea4f93]">Variant Detail</span>
            </p>
            <h1 className="mt-2 text-2xl font-black text-[#432744]">{variant.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#8c7085]">{variant.description || "--"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getAdminNailDesignDetailRoute(designId))}
              className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#8c7085]"
            >
              <ArrowLeft size={14} className="mr-1.5 inline" />
              Back to Design
            </button>
            <button
              type="button"
              onClick={() => openTryOn(undefined)}
              className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              Set Up Try On
            </button>
            <button
              type="button"
              onClick={() => openTryOn("image")}
              className="rounded-full bg-[#4a72d8] px-4 py-2 text-xs font-bold text-white"
            >
              <Image size={14} className="mr-1.5 inline" />
              Photo Try On
            </button>
            <button
              type="button"
              onClick={() => openTryOn("live")}
              className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              <Camera size={14} className="mr-1.5 inline" />
              Live Try On
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-[#f4bfd2] bg-[#fff1f6] px-5 py-3 text-sm font-semibold text-[#d14c84]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DetailCard title="Variant Overview">
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[20px] bg-[#f6edf2]">
                <img
                  crossorigin="anonymous"
                  src={variant.imageUrl || DESIGN_PREVIEW_IMAGE}
                  alt={variant.name}
                  className="h-72 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Price", variant.priceLabel || "--"],
                  ["Duration", variant.durationLabel || "--"],
                  ["Shape", variant.nailShape?.name || "--"],
                  ["Surface", variant.nailSurface?.name || "--"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-[#f7d7e5] bg-[#fffafb] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">{label}</p>
                    <p className="mt-2 text-sm font-bold text-[#432744]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </DetailCard>

          <DetailCard title="Accessories / Components">
            {variant.nailComponents?.length ? (
              <div className="space-y-3">
                {variant.nailComponents.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#f1d7e3] bg-[#fffafb] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="pink">{item.component?.name || "--"}</Pill>
                      <Pill tone="blue">{item.component?.componentType || "--"}</Pill>
                      <Pill tone="yellow">{item.component?.priceLabel || "--"}</Pill>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                      <span>Finger: <b>{item.fingerIndex}</b></span>
                      <span>Pos X: <b>{item.posX}</b></span>
                      <span>Pos Y: <b>{item.posY}</b></span>
                      <span className="break-all">Config: <b>{item.configJson || "--"}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8c7085]">This variant has no accessory components.</p>
            )}
          </DetailCard>

          <DetailCard title="Procedure Steps">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#8c7085]">Step order is initialized from the current variant procedure response.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addProcedureDraft}
                  disabled={isSavingProcedures}
                  className="rounded-full border border-[#f4c6da] bg-white px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  <Plus size={13} className="mr-1.5 inline" />
                  Add Step
                </button>
                <button
                  type="button"
                  onClick={() => void saveProcedureSteps()}
                  disabled={isSavingProcedures}
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
                >
                  <Save size={13} className="mr-1.5 inline" />
                  {isSavingProcedures ? "Saving..." : "Save Steps"}
                </button>
              </div>
            </div>

            {procedures.length ? (
              <div className="mt-4 space-y-3">
                {procedures.map((item, index) => (
                  <div key={`${item.procedureId || "draft"}-${index}`} className="rounded-[18px] border border-[#f1d7e3] bg-[#fffafb] p-4">
                    <div className="grid gap-3 md:grid-cols-[110px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c694ad]">
                          Step Order
                        </span>
                        <input
                          value={String(item.stepOrder || index + 1)}
                          onChange={(event) => updateProcedureDraft(index, event.target.value)}
                          className="w-full rounded-2xl border border-[#f4d4e2] bg-white px-4 py-3 text-sm font-semibold text-[#432744] outline-none focus:border-[#ea4f93]"
                        />
                      </label>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <span>Name: <b>{item.name || "--"}</b></span>
                        <span>Duration: <b>{item.durationLabel || "--"}</b></span>
                        <span>Status: <b>{item.status || "--"}</b></span>
                        <span>Required: <b>{item.isRequired ? "Yes" : "No"}</b></span>
                      </div>
                    </div>
                    {item.description ? <p className="mt-3 text-sm leading-6 text-[#6d5669]">{item.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-dashed border-[#f3c9dd] bg-[#fffafb] px-4 py-4 text-sm text-[#8c7085]">
                No procedures configured for this variant yet.
              </div>
            )}
          </DetailCard>
        </div>

        <aside className="space-y-4">
          <DetailCard title="Try-On">
            <div className="space-y-3">
              {[
                ["Set Up Try On", "Tune nail shape, color, finish, and layers.", undefined, Eye],
                ["Photo Try On", "Apply this variant on an uploaded hand image.", "image", Image],
                ["Live Try On", "Apply this variant using the camera.", "live", Camera],
              ].map(([label, note, mode, Icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openTryOn(mode)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-[#f4c6da] bg-[#fffafb] p-4 text-left transition hover:border-[#ea4f93]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f7] text-[#ea4f93]">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-[#432744]">{label}</span>
                    <span className="mt-1 block text-xs text-[#8c7085]">{note}</span>
                  </span>
                </button>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Color Preview">
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {colors.length > 1 ? (
                  <div className="w-full rounded-[18px] border border-[#f4d4e2] bg-[#fffafb] p-3">
                    <div
                      className="h-16 rounded-[14px] border border-white shadow-inner"
                      style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})` }}
                    />
                    <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">Gradient Mix</p>
                  </div>
                ) : null}
                {colors.map((color) => (
                  <div key={color} className="w-[110px] rounded-[18px] border border-[#f4d4e2] bg-[#fffafb] p-3">
                    <div className="h-16 rounded-[14px] border border-white shadow-inner" style={{ backgroundColor: color }} />
                    <p className="mt-3 text-center text-[11px] font-bold text-[#6d5669]">{color}</p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="overflow-x-auto rounded-[16px] bg-[#fffafb] p-4 text-xs leading-6 text-[#6d5669]">
                {variant.colorJson || "--"}
              </pre>
            )}
          </DetailCard>
        </aside>
      </div>
    </section>
  );
}
