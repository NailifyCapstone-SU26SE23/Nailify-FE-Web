import {
  ArrowUp,
  CalendarClock,
  Check,
  CheckCheck,
  ClipboardCheck,
  Eye,
  Palette,
  PencilLine,
  Search,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#ea4f93]" />
      <h2 className="text-xs font-extrabold text-[#ea4f93]">{title}</h2>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function InfoCard({ label, value, note, tone = "default" }) {
  const valueTone = tone === "success" ? "text-[#16a34a]" : "text-[#3f2b3f]";

  return (
    <article className="rounded-[16px] border border-[#f6dbe7] bg-[#fff9fc] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">{label}</p>
      <p className={`mt-2 whitespace-pre-line text-sm font-extrabold ${valueTone}`}>{value}</p>
      {note ? <p className="mt-1 text-xs text-[#9a7f90]">{note}</p> : null}
    </article>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  note: PropTypes.string,
  tone: PropTypes.oneOf(["default", "success"]),
  value: PropTypes.string.isRequired,
};

function ServiceInfoCard({services = [] }) {
  return (
    <article className="rounded-[16px] bg-[#fff9fc] xl:col-span-3">

      {services.length ? (
        <div className="overflow-hidden rounded-[20px] border border-[#f2bfd4] bg-white">
          <div className="hidden grid-cols-[minmax(0,1.8fr)_110px_150px_120px] items-center gap-3 border-b border-[#f8dce8] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f7_100%)] px-5 py-3 md:grid">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Service</p>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Qty</p>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Price</p>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Duration</p>
          </div>

          <div className="divide-y divide-[#f9dfeb]">
            {services.map((service, index) => (
              <div
                key={service.id || `${service.name}-${index}`}
                className="px-4 py-4 md:grid md:grid-cols-[minmax(0,1.8fr)_110px_150px_120px] md:items-center md:gap-3 md:px-5"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                    Service {index + 1}
                  </p>
                  <p className="mt-2 break-words text-sm font-extrabold text-[#ea4f93]">{service.name || "--"}</p>
                  {service.nailServiceName ? (
                    <p className="mt-1 text-xs font-semibold text-[#7a6275]">
                      Nail service: {service.nailServiceName}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae] md:hidden">Qty</p>
                  <span className="inline-flex rounded-full border border-[#f6dbe7] bg-[#fff9fc] px-3 py-1 text-[11px] font-bold text-[#6f5c6b]">
                    {service.quantity || 1}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae] md:hidden">Price</p>
                  <span className="inline-flex rounded-full border border-[#d8f0df] bg-[#f1fcf4] px-3 py-1 text-[11px] font-bold text-[#16975f]">
                    {service.price || "--"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae] md:hidden">Duration</p>
                  <span className="inline-flex rounded-full bg-[#f4efff] px-4 py-2 text-sm font-extrabold text-[#8c63ef]">
                    {service.duration || "--"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

ServiceInfoCard.propTypes = {
  services: PropTypes.arrayOf(
    PropTypes.shape({
      duration: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      nailServiceName: PropTypes.string,
      price: PropTypes.string,
      quantity: PropTypes.number,
    }),
  ),
  value: PropTypes.string.isRequired,
};

function formatVariantCurrency(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VNĐ`;
}

function formatVariantDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return `${duration} min`;
}

function parseVariantColorJson(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildVariantColorPreviewStyle(colorConfig) {
  const fallbackColor = String(colorConfig?.color || "").trim() || "#f3d5e2";
  const gradient = colorConfig?.gradient;
  const gradientStops = Array.isArray(gradient?.stops)
    ? gradient.stops.filter((item) => String(item || "").trim())
    : [];

  if (gradient?.enabled && gradientStops.length >= 2) {
    const gradientType = String(gradient?.type || "linear").trim().toLowerCase();

    return {
      background:
        gradientType === "radial"
          ? `radial-gradient(circle at center, ${gradientStops.join(", ")})`
          : `linear-gradient(135deg, ${gradientStops.join(", ")})`,
    };
  }

  return {
    background: fallbackColor,
  };
}

function VariantDetailModal({ open, variantDetail, onClose }) {
  const colorConfig = useMemo(
    () => parseVariantColorJson(variantDetail?.colorJson),
    [variantDetail?.colorJson],
  );
  if (!open || !variantDetail) {
    return null;
  }

  const gradientStops = Array.isArray(colorConfig?.gradient?.stops)
    ? colorConfig.gradient.stops.filter(Boolean)
    : [];
  const colorSwatches = gradientStops.length
    ? gradientStops
    : colorConfig?.color
      ? [colorConfig.color]
      : [];
  const colorPreviewStyle = buildVariantColorPreviewStyle(colorConfig);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1322]/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#f1cade] bg-white shadow-[0_30px_80px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
              Nail Variant Detail
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-[#ea4f93]">{variantDetail.name}</h3>
            {/* <p className="mt-1 text-sm text-[#a88a9d]">
              ID #{variantDetail.nailVariantId} • Nail Design #{variantDetail.nailDesignId}
            </p> */}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <img
                src={variantDetail.imageUrl}
                alt={variantDetail.name}
                className="h-72 w-full rounded-[22px] border border-[#f4dbe7] object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <InfoCard label="Price" value={formatVariantCurrency(variantDetail.price)} note="" tone="success" />
                <InfoCard label="Duration" value={formatVariantDuration(variantDetail.duration)} note="" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <InfoCard
                  label="Variant Name"
                  value={variantDetail.name || "--"}
                // note={`Variant ID: ${variantDetail.nailVariantId || "--"}`}
                />
                <InfoCard
                  label="Design Reference"
                  value={`Design #${variantDetail.nailDesignId || "--"}`}
                // note={`Shape ID: ${variantDetail.nailShapeId || "--"} • Surface ID: ${variantDetail.nailSurfaceId || "--"}`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Nail Shape</p>
                  <div className="mt-3 flex items-start gap-3">
                    <img
                      src={variantDetail.nailShape?.imageUrl || variantDetail.imageUrl}
                      alt={variantDetail.nailShape?.name || "Nail shape"}
                      className="h-20 w-20 rounded-2xl border border-[#f4dbe7] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-base font-extrabold capitalize text-[#3f2b3f]">
                        {variantDetail.nailShape?.name || "--"}
                      </p>
                      <p className="mt-1 text-xs text-[#a88a9d]">
                        Price: {formatVariantCurrency(variantDetail.nailShape?.price)}
                      </p>
                      <p className="mt-1 text-xs text-[#a88a9d]">
                        Duration: {formatVariantDuration(variantDetail.nailShape?.duration)}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[20px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Nail Surface</p>
                  <div className="mt-3">
                    <p className="text-base font-extrabold text-[#3f2b3f]">
                      {variantDetail.nailSurface?.name || "--"}
                    </p>
                    <p className="mt-2 text-xs text-[#a88a9d]">
                      Shader: {variantDetail.nailSurface?.shaderParam || "--"}
                    </p>
                    <p className="mt-1 text-xs text-[#a88a9d]">
                      Price: {formatVariantCurrency(variantDetail.nailSurface?.price)}
                    </p>
                    <p className="mt-1 text-xs text-[#a88a9d]">
                      Duration: {formatVariantDuration(variantDetail.nailSurface?.duration)}
                    </p>
                  </div>
                </article>
              </div>

              <article className="rounded-[20px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                  Color Configuration
                </p>
                <div className="mt-3 rounded-[18px] border border-[#f4dbe7] bg-white p-3">
                  <div
                    className="h-28 w-full rounded-[14px] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    style={colorPreviewStyle}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colorSwatches.length ? (
                    colorSwatches.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-2 rounded-full border border-[#f2bfd4] bg-white px-3 py-1.5 text-xs font-bold text-[#6f5c6b]"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-[#ead6df]"
                          style={{ backgroundColor: color }}
                        />
                        {color}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#a88a9d]">No color configuration available.</p>
                  )}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <InfoCard label="Mode" value={String(colorConfig?.mode || "--")} note="" />
                  <InfoCard
                    label="Gradient"
                    value={colorConfig?.gradient?.enabled ? "Enabled" : "Disabled"}
                    note={String(colorConfig?.gradient?.type || "--")}
                  />
                  <InfoCard
                    label="Stops"
                    value={String(gradientStops.length || 0)}
                    note={`Stop Count: ${colorConfig?.gradient?.stopCount ?? "--"}`}
                  />
                </div>
                <div className="mt-4 rounded-[16px] border border-[#f4dbe7] bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Raw JSON</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-[#6f5c6b]">
                    {variantDetail.colorJson || "--"}
                  </pre>
                </div>
              </article>

              <article className="rounded-[20px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Nail Components</p>
                  <span className="rounded-full border border-[#d8cbff] bg-[#f6f2ff] px-3 py-1 text-[10px] font-bold text-[#8c63ef]">
                    {variantDetail.nailComponents?.length || 0} item(s)
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {variantDetail.nailComponents?.length ? (
                    variantDetail.nailComponents.map((item) => (
                      <div
                        key={`${item.nailComponentId}-${item.componentId}`}
                        className="rounded-[16px] border border-[#f4dbe7] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-[#3f2b3f]">
                              {item.component?.name || "--"}
                            </p>
                            <p className="mt-1 text-xs text-[#a88a9d]">
                              Type: {item.component?.componentType || "--"}
                            </p>
                          </div>
                          <span className="rounded-full border border-[#f2bfd4] bg-[#fff5f9] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                            Finger #{item.fingerIndex ?? "--"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <p className="text-xs text-[#6f5c6b]">Position: X {item.posX ?? "--"} • Y {item.posY ?? "--"}</p>
                          <p className="text-xs text-[#6f5c6b]">Price: {formatVariantCurrency(item.component?.price)}</p>
                          <p className="text-xs text-[#6f5c6b]">Duration: {formatVariantDuration(item.component?.duration)}</p>
                          <p className="text-xs text-[#6f5c6b]">Config: {item.configJson || "--"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-[#f1cade] bg-white px-4 py-6 text-sm text-[#a88a9d]">
                      This variant does not have any nail components.
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

VariantDetailModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  variantDetail: PropTypes.shape({
    basedOnNailVariantId: PropTypes.number,
    colorJson: PropTypes.string,
    customerNailId: PropTypes.number,
    detailType: PropTypes.string,
    duration: PropTypes.number,
    imageUrl: PropTypes.string,
    name: PropTypes.string,
    nailComponents: PropTypes.arrayOf(
      PropTypes.shape({
        componentId: PropTypes.number,
        configJson: PropTypes.string,
        fingerIndex: PropTypes.number,
        nailComponentId: PropTypes.number,
        posX: PropTypes.number,
        posY: PropTypes.number,
        component: PropTypes.shape({
          componentType: PropTypes.string,
          duration: PropTypes.number,
          imageUrl: PropTypes.string,
          name: PropTypes.string,
          price: PropTypes.number,
        }),
      }),
    ),
    nailDesignId: PropTypes.number,
    nailShape: PropTypes.shape({
      duration: PropTypes.number,
      imageUrl: PropTypes.string,
      name: PropTypes.string,
      price: PropTypes.number,
    }),
    nailShapeId: PropTypes.number,
    nailSurface: PropTypes.shape({
      duration: PropTypes.number,
      name: PropTypes.string,
      price: PropTypes.number,
      shaderParam: PropTypes.string,
    }),
    nailSurfaceId: PropTypes.number,
    nailVariantId: PropTypes.number,
    price: PropTypes.number,
  }),
};

function Tag({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

Tag.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

function SuggestedCard({ item }) {
  return (
    <article className="flex items-center gap-3 rounded-[14px] border border-[#f6dbe7] bg-white p-2.5">
      <img
        src={item.image}
        alt={item.name}
        className="h-11 w-11 rounded-xl object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-[#432744]">{item.name}</p>
        <p className="mt-1 text-[10px] text-[#aa8c9f]">{item.meta}</p>
      </div>
    </article>
  );
}

SuggestedCard.propTypes = {
  item: PropTypes.shape({
    image: PropTypes.string.isRequired,
    meta: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export function StaffBookingConsultationDetail({
  data,
  onChooseAnotherDesign,
  onConfirmCurrentDesign,
  isCurrentDesignConfirmed = false,
  isCustomerNailConfirmed = false,
  requiresCustomerNailConfirmation = false,
  isPendingBooking = false,
  isServiceInProgress = false,
  isServiceCompleted = false,
  onDelete,
  onOpenDesignStudio,
  onOpenUpdateBooking,
  onStaffNoteChange,
  onStartServiceSession,
  onConfirmCustomerNail,
}) {
  const canProceedToService =
    (requiresCustomerNailConfirmation ? isCustomerNailConfirmed : isCurrentDesignConfirmed) &&
    !isServiceCompleted;
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const hasSelectedNailDesign = Boolean(
    data.design.variantDetail ||
    (String(data.design.name || "").trim() && String(data.design.name || "").trim() !== "--"),
  );
  const canViewVariantDetail = Boolean(
    data.design.variantDetail &&
    (
      data.design.variantDetail?.nailVariantId ||
      data.design.variantDetail?.customerNailId ||
      String(data.design.variantDetail?.name || "").trim()
    ),
  );
  const consultationQuestion = hasSelectedNailDesign
    ? `Does the customer want to continue with the selected nail design - ${data.design.name}?`
    : "Does the customer want to continue with no nail design ?";
  const confirmButtonLabel = hasSelectedNailDesign ? "Confirm Current Design" : "Confirm booking";
  const confirmCustomerNailButtonLabel = isCustomerNailConfirmed
    ? "Customer Nail Confirmed"
    : "Confirm Customer Nail";
  const confirmedButtonLabel = isServiceCompleted
    ? "Service Completed"
    : hasSelectedNailDesign
      ? "Current Design Confirmed"
      : "Booking Confirmed";
  const chooseAnotherDesignButtonLabel = hasSelectedNailDesign ? "Choose Another Design" : "Choose Design";

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff5fa_100%)]">
      <div className="rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <div className="mt-4 space-y-4">
          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <SectionTitle icon={UserRound} title="Customer Information" />

            <div className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <img
                  src={data.customer.avatar}
                  alt={data.customer.name}
                  className="h-14 w-14 rounded-full border-[3px] border-[#f4d6e4] object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-2xl font-extrabold text-[#3f2b3f]">{data.customer.name}</p>
                      <p className="mt-1 text-sm text-[#9a7f90]">{data.customer.phone}</p>
                    </div>
                    <Tag className="border-[#f3ddab] bg-[#fff8df] text-[#d39a1d]">
                      <Star size={11} className="mr-1 inline-block fill-current" />
                      {data.customer.memberTier}
                    </Tag>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {data.customer.facts.map((item) => (
                      <div key={item.label}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#4b3348]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#f5cada] bg-[#fff1f6] px-4 py-3 text-sm text-[#d44b88]">
                <span className="font-bold">Allergy Note:</span> {data.customer.allergyNote}
              </div>

              <p className="text-sm text-[#7a6275]">
                <span className="font-medium text-[#a08697]">Customer Preferences:</span>{" "}
                {data.customer.preferences}
              </p>
            </div>
          </article>

          <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
            <SectionTitle icon={CalendarClock} title="Booking Information" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.bookingInfo.map((item) =>
                item.label === "Service" ? (
                  <ServiceInfoCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    note={item.note}
                    services={item.services}
                  />
                ) : (
                  <InfoCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    note={item.note}
                    tone={item.tone}
                  />
                ),
              )}
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              {hasSelectedNailDesign ? (
                <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle icon={Sparkles} title="Current Selected Nail Design" />
                    {canViewVariantDetail ? (
                      <button
                        type="button"
                        onClick={() => setIsVariantModalOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-[#fff5f9] text-[#ea4f93] hover:bg-[#fff0f6]"
                        title="View nail detail"
                      >
                        <Eye size={16} />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-4 lg:flex-row">
                    <img
                      src={data.design.image}
                      alt={data.design.name}
                      className="h-40 w-full rounded-[18px] object-cover lg:w-44"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1">
                      <h3 className="text-[1.5rem] font-extrabold text-[#ea4f93]">{data.design.name}</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {data.design.details
                          .filter((item) => {
                            if (item.label === "Service") {
                              return false;
                            }

                            if (item.label === "Customer Design") {
                              const normalizedValue = String(item.value || "").trim();
                              return normalizedValue && normalizedValue !== "--";
                            }

                            return true;
                          })
                          .map((item) => (
                            <div key={item.label}>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#4b3348]">{item.value}</p>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {data.design.tags.map((tag) => (
                          <Tag key={tag.label} className={tag.className}>
                            {tag.label}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}

              {!isPendingBooking && !isServiceInProgress && !isServiceCompleted ? (
                <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                  <SectionTitle icon={Search} title="Customer Consultation" />
                  <div className="mt-5 flex flex-col items-center gap-6 text-center">
                    <p className="text-lg font-bold text-[#3f2b3f]">{consultationQuestion}</p>
                    <div className="flex w-full flex-col gap-3 sm:flex-row">
                      {requiresCustomerNailConfirmation ? (
                        <button
                          type="button"
                          onClick={onConfirmCustomerNail}
                          disabled={isCustomerNailConfirmed || isServiceCompleted}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] px-5 py-4 text-sm font-bold ${isCustomerNailConfirmed || isServiceCompleted
                            ? "cursor-default bg-[#eef7ff] text-[#327adf]"
                            : "border border-[#d8cbff] bg-white text-[#7c63d8]"
                            }`}
                        >
                          <Check size={16} />
                          {confirmCustomerNailButtonLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onConfirmCurrentDesign}
                          disabled={isCurrentDesignConfirmed || isServiceCompleted}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] px-5 py-4 text-sm font-bold shadow-[0_16px_28px_rgba(236,72,153,0.2)] ${isCurrentDesignConfirmed || isServiceCompleted
                            ? "cursor-default bg-[#e9f9ef] text-[#16975f] shadow-none"
                            : "bg-[image:var(--gradient-accent)] text-white"
                            }`}
                        >
                          <Check size={16} />
                          {isCurrentDesignConfirmed || isServiceCompleted ? confirmedButtonLabel : confirmButtonLabel}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={onChooseAnotherDesign}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#f4cada] bg-white px-5 py-4 text-sm font-bold text-[#ea4f93]"
                      >
                        <Palette size={16} />
                        {chooseAnotherDesignButtonLabel}
                      </button>
                    </div>
                  </div>
                </article>
              ) : null}

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <SectionTitle icon={PencilLine} title="Staff Notes" />
                <div className="mt-5 space-y-4">
                  {data.staffNotes.map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                        {item.label}
                      </p>
                      <textarea
                        value={item.value}
                        onChange={(event) => onStaffNoteChange(item.label, event.target.value)}
                        rows={3}
                        className="mt-2 w-full resize-y rounded-[14px] border border-[#f6dbe7] bg-[#fff9fc] px-4 py-3 text-sm text-[#634d5f] outline-none transition focus:border-[#ea4f93] focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] font-medium text-[#b1859d]">
                  Staff notes are editable here and saved locally when you update this booking.
                </p>
              </article>

              {!isPendingBooking && !isServiceCompleted ? (
                <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                  <SectionTitle icon={ClipboardCheck} title="Final Confirmation Checklist" />
                  <div className="mt-5 space-y-3">
                    {data.checklist.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-sm font-semibold ${item.checked
                          ? "border-[#f2a9c9] bg-[#fff1f7] text-[#d74f8d]"
                          : "border-[#f0d8e3] bg-white text-[#6f5c6b]"
                          }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${item.checked
                            ? "border-[#df5c96] bg-[#df5c96] text-white"
                            : "border-[#e4cbd7] bg-[#fff7fb] text-transparent"
                            }`}
                        >
                          <Check size={12} />
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onStartServiceSession}
                    disabled={!canProceedToService}
                    className={`mt-5 w-full rounded-[14px] px-5 py-4 text-sm font-bold ${canProceedToService
                      ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.2)]"
                      : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                      }`}
                  >
                    {isServiceInProgress ? "Continue Service" : "Proceed to Service Session"}
                  </button>
                  {!canProceedToService ? (
                    <p className="mt-3 text-xs font-medium text-[#b1859d]">
                      {requiresCustomerNailConfirmation
                        ? "Confirm current nail before proceeding to the service session."
                        : "Confirm Current Design before proceeding to the service session."}
                    </p>
                  ) : null}

                  {!isServiceInProgress ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onOpenDesignStudio}
                        className="rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                      >
                        Open Design Studio
                      </button>
                      <button
                        type="button"
                        onClick={onOpenUpdateBooking}
                        className="rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                      >
                        Update Booking
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-[12px] border border-[#ddd0d8] bg-white px-4 py-2.5 text-xs font-bold text-[#8e7786]"
                      >
                        Back to Queue
                      </button>
                    </div>
                  ) : null}
                </article>
              ) : null}
            </div>

            <aside className="space-y-4 border-t border-[#f3d5e2] pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
              {/* <article className="rounded-[18px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <SectionTitle icon={Clock3} title="Session Status" />
                <div className="mt-4 space-y-3">
                  {data.sessionStatus.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                        {item.label}
                      </p>
                      <p className="text-right font-bold text-[#432744]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </article> */}

              <article className="rounded-[18px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                <SectionTitle icon={ArrowUp} title="Customer History" />
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Favorite Styles
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {data.customerHistory.favoriteStyles.map((tag) => (
                        <Tag key={tag.label} className={tag.className}>
                          {tag.label}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Previous Nail Shapes
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#4b3348]">
                      {data.customerHistory.previousShapes}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                      Last Uploaded Photo
                    </p>
                    <div className="mt-2 flex items-center gap-3 rounded-[14px] border border-[#f6dbe7] bg-white p-2.5">
                      <img
                        src={data.customerHistory.lastUpload.image}
                        alt={data.customerHistory.lastUpload.title}
                        className="h-12 w-12 rounded-xl object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-[#432744]">
                          {data.customerHistory.lastUpload.title}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a98b9d]">
                          {data.customerHistory.lastUpload.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* <article className="rounded-[18px] border border-[#f3d5e2] bg-white p-4">
                <SectionTitle icon={Sparkles} title="Suggested Designs" />
                <div className="mt-4 space-y-3">
                  {data.suggestedDesigns.map((item) => (
                    <SuggestedCard key={item.name} item={item} />
                  ))}
                </div>
              </article> */}

              {!isPendingBooking && !isServiceCompleted ? (
                <article className="rounded-[18px] border border-[#f3d5e2] bg-white p-4">
                  <SectionTitle
                    icon={CheckCheck}
                    title={isServiceInProgress ? "Continue Service" : "Next Actions"}
                  />
                  <div className="mt-4 space-y-3">
                    {!isServiceInProgress ? (
                      <>
                        <button
                          type="button"
                          onClick={onOpenUpdateBooking}
                          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                        >
                          <PencilLine size={13} />
                          Update Booking
                        </button>
                        <button
                          type="button"
                          onClick={onOpenDesignStudio}
                          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#f4cada] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                        >
                          <Search size={13} />
                          Open Design Studio
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={onStartServiceSession}
                      disabled={!canProceedToService}
                      className={`flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-bold ${canProceedToService
                        ? "bg-[image:var(--gradient-accent)] text-white"
                        : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                        }`}
                    >
                      <ArrowUp size={13} />
                      {isServiceInProgress ? "Continue Service" : "Start Service"}
                    </button>
                  </div>
                </article>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
      <VariantDetailModal
        open={isVariantModalOpen}
        variantDetail={data.design.variantDetail}
        onClose={() => setIsVariantModalOpen(false)}
      />
    </section>
  );
}

StaffBookingConsultationDetail.propTypes = {
  data: PropTypes.shape({
    artistInitials: PropTypes.string.isRequired,
    bookingCode: PropTypes.string.isRequired,
    bookingInfo: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        note: PropTypes.string,
        services: PropTypes.arrayOf(
          PropTypes.shape({
            duration: PropTypes.string,
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string,
            nailServiceName: PropTypes.string,
            price: PropTypes.string,
            quantity: PropTypes.number,
          }),
        ),
        tone: PropTypes.oneOf(["default", "success"]),
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    checklist: PropTypes.arrayOf(
      PropTypes.shape({
        checked: PropTypes.bool.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    customer: PropTypes.shape({
      allergyNote: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired,
      facts: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ).isRequired,
      memberTier: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      preferences: PropTypes.string.isRequired,
    }).isRequired,
    customerHistory: PropTypes.shape({
      favoriteStyles: PropTypes.arrayOf(
        PropTypes.shape({
          className: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      lastUpload: PropTypes.shape({
        date: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
      }).isRequired,
      previousShapes: PropTypes.string.isRequired,
    }).isRequired,
    design: PropTypes.shape({
      details: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ).isRequired,
      image: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(
        PropTypes.shape({
          className: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      variantDetail: PropTypes.shape({
        basedOnNailVariantId: PropTypes.number,
        colorJson: PropTypes.string,
        customerNailId: PropTypes.number,
        detailType: PropTypes.string,
        duration: PropTypes.number,
        imageUrl: PropTypes.string,
        name: PropTypes.string,
        nailComponents: PropTypes.arrayOf(
          PropTypes.shape({
            componentId: PropTypes.number,
            configJson: PropTypes.string,
            fingerIndex: PropTypes.number,
            nailComponentId: PropTypes.number,
            posX: PropTypes.number,
            posY: PropTypes.number,
            component: PropTypes.shape({
              componentType: PropTypes.string,
              duration: PropTypes.number,
              imageUrl: PropTypes.string,
              name: PropTypes.string,
              price: PropTypes.number,
            }),
          }),
        ),
        nailDesignId: PropTypes.number,
        nailShape: PropTypes.shape({
          duration: PropTypes.number,
          imageUrl: PropTypes.string,
          name: PropTypes.string,
          price: PropTypes.number,
        }),
        nailShapeId: PropTypes.number,
        nailSurface: PropTypes.shape({
          duration: PropTypes.number,
          name: PropTypes.string,
          price: PropTypes.number,
          shaderParam: PropTypes.string,
        }),
        nailSurfaceId: PropTypes.number,
        nailVariantId: PropTypes.number,
        price: PropTypes.number,
      }),
    }).isRequired,
    sessionStatus: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    staffNotes: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
    statusLabel: PropTypes.string.isRequired,
    suggestedDesigns: PropTypes.arrayOf(
      PropTypes.shape({
        image: PropTypes.string.isRequired,
        meta: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  isCustomerNailConfirmed: PropTypes.bool,
  isCurrentDesignConfirmed: PropTypes.bool,
  isPendingBooking: PropTypes.bool,
  requiresCustomerNailConfirmation: PropTypes.bool,
  isServiceInProgress: PropTypes.bool,
  isServiceCompleted: PropTypes.bool,
  onChooseAnotherDesign: PropTypes.func.isRequired,
  onConfirmCustomerNail: PropTypes.func,
  onConfirmCurrentDesign: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onOpenDesignStudio: PropTypes.func.isRequired,
  onOpenUpdateBooking: PropTypes.func.isRequired,
  onStaffNoteChange: PropTypes.func.isRequired,
  onStartServiceSession: PropTypes.func.isRequired,
};
