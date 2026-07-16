import {
  ClipboardList,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePenLine,
  // Image,
  ImageUp,
  Play,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { ExtraServiceModal } from "../components/ExtraServiceModal";
import {
  getStaffBookingDesignUpdateRoute,
  getStaffBookingDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import { getErrorMessage } from "../../../../shared/utils/getErrorMessage";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getMockBookingById } from "../../../../shared/bookings/services/mockBookings";
import {
  buildStaffBookingItemsForUpdate,
  buildStaffServiceSessionPayload,
  claimBookingProcedure,
  fetchServiceCatalog,
  formatAppointmentEndTime,
  fetchStaffBookingDetail,
  fetchBookingProceduresByBookingItem,
  fetchStaffCustomerNailDetail,
  fetchStaffCustomerDetail,
  fetchStaffNailVariantDetail,
  fetchStaffServiceDetail,
  formatTimeValue,
  getStaffArtistId,
  toNullableBookingUuid,
  uploadImageBeforeService,
  startStaffBookingService,
  uploadImageAfterService,
  updateStaffBooking,
  updateBookingProcedureStatus,
} from "../services/staffBookingService";
import { useDispatch, useSelector } from "react-redux";
import { setServiceSession } from "../../../../store/serviceSessionSlice";
import { Button, Image, Modal } from "antd";

const DEFAULT_CUSTOMER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80";

const STICKY_HEADER_OFFSET_PX = -20;

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#fff0f6_0%,#ffe5ef_100%)] text-[#ea4f93]">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-[#3f2b3f]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-[#a88a9d]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

function ProgressStep({ step, index, isLast, compact = false }) {
  const stateClasses = {
    active: {
      dot: "border-transparent bg-[image:var(--gradient-accent)] text-white shadow-[0_14px_28px_rgba(236,72,153,0.24)]",
      label: "text-[#c64286]",
      pill: "bg-[#ffe3f0] text-[#d94f92]",
    },
    upcoming: {
      dot: "border border-[#a8a8b3] bg-[#d3d3d8] text-white shadow-none",
      label: "text-[#7c6f80]",
      pill: "bg-[#d3d3d8] text-[#6f6673]",
    },
    complete: {
      dot: "border border-[#5fd09b] bg-[#dff8ea] text-[#1fa865] shadow-[0_10px_24px_rgba(31,168,101,0.14)]",
      label: "text-emerald-600",
      pill: "bg-emerald-50 text-emerald-600",
    },
  };

  const tone = stateClasses[step.state];
  const lineClassName =
    step.state === "complete"
      ? "bg-[#57c990]"
      : "bg-[#a8a8b3]";

  return (
    <div className="relative flex flex-1 flex-col items-center text-center">
      {!isLast ? (
        <div className={`absolute left-[calc(50%+2rem)] hidden h-[2px] w-[calc(100%-4rem)] xl:block ${compact ? "top-4" : "top-5"}`}>
          <div className={`h-full w-full rounded-full ${lineClassName}`} />
        </div>
      ) : null}

      <div
        className={`relative z-[1] flex items-center justify-center rounded-full border text-sm font-extrabold ${compact ? "h-9 w-9" : "h-10 w-10"} ${tone.dot}`}
      >
        {step.state === "complete" ? <Check size={18} strokeWidth={3} /> : index + 1}
      </div>

      <div className={compact ? "mt-3" : "mt-4"}>
        <p className={`${compact ? "text-[0.95rem]" : "text-base"} font-extrabold ${tone.label}`}>{step.label}</p>
        {!compact ? (
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${tone.pill}`}
          >
            {step.statusLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

ProgressStep.propTypes = {
  compact: PropTypes.bool,
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool.isRequired,
  step: PropTypes.shape({
    label: PropTypes.string.isRequired,
    state: PropTypes.oneOf(["active", "upcoming", "complete"]).isRequired,
    statusLabel: PropTypes.string.isRequired,
  }).isRequired,
};

function ProcedureTimelineStep({ step, isLast, onTick }) {
  const tone = {
    dot: "bg-[linear-gradient(135deg,#f857a6_0%,#ffcc70_100%)] text-white shadow-[0_12px_24px_rgba(244,114,182,0.2)]",
    line: "bg-[linear-gradient(180deg,#f8bfd8_0%,#ffe09c_100%)]",
    card: "bg-[linear-gradient(135deg,#fff0f7_0%,#fff6d8_100%)]",
    title: "text-[#8a7082]",
    note: "text-[#a78c9d]",
  };

 return (
  <div className="flex items-stretch gap-4">
    {/* Step number + connecting line */}
    <div className="flex w-10 shrink-0 flex-col items-center">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${tone.dot}`}
      >
        {step.stepNumber}
      </div>

      {!isLast ? (
        <div
          className={`mt-2 min-h-6 w-1 flex-1 rounded-full ${tone.line}`}
        />
      ) : null}
    </div>

    {/* Procedure information */}
    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_40px] items-center gap-3">
      {/* Procedure name */}
      <div className="min-w-0">
        <p className={`truncate text-sm font-extrabold ${tone.title}`}>
          {step.label}
        </p>

        {step.note ? (
          <p className={`mt-1 text-xs ${tone.note}`}>
            {step.note}
          </p>
        ) : null}
      </div>

      {/* Status */}
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getProcedureStatusTone(
          step.status
        )}`}
      >
        {step.statusLabel}
      </span>

      {/* Tick button */}
      <div className="flex h-10 w-10 items-center justify-center">
        {step.canTick ? (
          <button
            type="button"
            onClick={() => onTick(step)}
            disabled={step.isUpdating}
            title="Mark this procedure as completed"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfead9] bg-[#f3fcf6] text-[#249a5c] shadow-[0_10px_20px_rgba(36,154,92,0.12)] transition hover:bg-[#eaf8f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {step.isUpdating ? (
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#249a5c]/30 border-t-[#249a5c]" />
            ) : (
              <Check size={18} strokeWidth={3} />
            )}
          </button>
        ) : null}
      </div>
    </div>
  </div>
);
}

ProcedureTimelineStep.propTypes = {
  isLast: PropTypes.bool.isRequired,
  onTick: PropTypes.func.isRequired,
  step: PropTypes.shape({
    canTick: PropTypes.bool,
    isUpdating: PropTypes.bool,
    label: PropTypes.string.isRequired,
    note: PropTypes.string,
    state: PropTypes.oneOf(["active", "upcoming", "complete"]).isRequired,
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    stepNumber: PropTypes.number.isRequired,
  }).isRequired,
};
function SummaryValue({ label, value, accent = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">{label}</p>
      <p className={`mt-1 whitespace-pre-line text-sm font-bold ${accent ? "text-[#ea4f93]" : "text-[#3f2b3f]"}`}>{value}</p>
    </div>
  );
}

SummaryValue.propTypes = {
  accent: PropTypes.bool,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function ServiceSummaryValue({ services = [], fallbackValue = "", onOpenProcedures = null }) {
  const hasServices = Array.isArray(services) && services.length > 0;
  const hasProcedureAction = typeof onOpenProcedures === "function";

  if (!hasServices) {
    return (
      <div className="rounded-[18px] border border-[#f4dbe7] bg-[#fff9fc] px-4 py-4">
        <p className="break-words text-sm font-extrabold leading-6 text-[#ea4f93]">{fallbackValue || "--"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#f2bfd4] bg-white shadow-[0_10px_22px_rgba(236,72,153,0.05)]">
      <div className="overflow-x-auto">
        <div className={`hidden min-w-[620px] items-center gap-3 border-b border-[#f8dce8] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f7_100%)] px-5 py-3 md:grid ${hasProcedureAction ? "grid-cols-[minmax(220px,1.6fr)_90px_140px_110px_120px]" : "grid-cols-[minmax(220px,1.8fr)_90px_140px_110px]"}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Service</p>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Qty</p>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Price</p>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Duration</p>
          {hasProcedureAction ? (
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Action</p>
          ) : null}
        </div>

        <div className="divide-y divide-[#f9dfeb]">
          {services.map((service, index) => (
            <div
              key={service.id || `${service.name}-${index}`}
              className={`px-4 py-4 md:grid md:min-w-[620px] md:items-center md:gap-3 md:px-5 ${hasProcedureAction ? "md:grid-cols-[minmax(220px,1.6fr)_90px_140px_110px_120px]" : "md:grid-cols-[minmax(220px,1.8fr)_90px_140px_110px]"}`}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                  {service.detailLabel || `Service ${index + 1}`}
                </p>
                <p className="mt-2 text-sm font-extrabold text-[#ea4f93] md:break-words">{service.name || "--"}</p>
                {service.nailServiceName ? (
                  <p className="mt-1 text-xs font-semibold text-[#7a6275] md:break-words">
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
                  {service.priceLabel || "--"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae] md:hidden">Duration</p>
                <span className="inline-flex rounded-full bg-[#f4efff] px-4 py-2 text-sm font-extrabold text-[#8c63ef]">
                  {service.durationLabel || "--"}
                </span>
              </div>

              {hasProcedureAction ? (
                <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae] md:hidden">Action</p>
                  {service.canViewProcedures ? (
                    <ActionDropdown
                      label="Actions"
                      items={[
                        {
                          key: `view-procedures-${service.id || index}`,
                          label: "View Procedures",
                          icon: ClipboardList,
                          onSelect: () => onOpenProcedures(service),
                        },
                      ]}
                    />
                  ) : (
                    <span className="inline-flex rounded-full border border-[#f6dbe7] bg-[#fff9fc] px-3 py-1 text-[11px] font-bold text-[#bca0ae]">
                      --
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ServiceSummaryValue.propTypes = {
  fallbackValue: PropTypes.string,
  onOpenProcedures: PropTypes.func,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      bookingItemId: PropTypes.string,
      canViewProcedures: PropTypes.bool,
      detailLabel: PropTypes.string,
      durationLabel: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      nailServiceName: PropTypes.string,
      priceLabel: PropTypes.string,
      quantity: PropTypes.number,
    }),
  ),
};

function getProcedureStatusTone(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "bg-[#e7f8ee] text-[#309e63]";
    case "inprogress":
    case "in progress":
      return "bg-[#efeafd] text-[#7c63d8]";
    case "pending":
      return "bg-[#fff4e3] text-[#e09a27]";
    case "skipped":
      return "bg-[#f2f2f2] text-[#656565]";
    default:
      return "bg-[#fff1f6] text-[#eb5b92]";
  }
}

function isProcedureCompletedStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  return normalizedStatus === "completed" || normalizedStatus === "done";
}

function hasAssignedArtist(procedure) {
  const assignedArtistId = String(procedure?.assignedArtistId || "").trim();
  const assignedArtistName = String(procedure?.assignedArtistName || "").trim().toLowerCase();

  if (assignedArtistId) {
    return true;
  }

  return Boolean(
    assignedArtistName
    && assignedArtistName !== "unassigned"
    && assignedArtistName !== "unassigned artist"
    && assignedArtistName !== "unknown"
    && assignedArtistName !== "--",
  );
}

function SessionSummaryPanel({
  phase,
  title,
  subtitle,
  data,
  hasConfirmedDesign,
  serviceStatusLabel,
  onOpenProcedures,
}) {
  const summaryToneByPhase = {
    start: "bg-[linear-gradient(180deg,#fffafc_0%,#fff5f9_100%)]",
    progress: "bg-[linear-gradient(180deg,#fffafc_0%,#fff4f8_100%)]",
    done: "bg-[linear-gradient(180deg,#fffafc_0%,#fff6fb_100%)]",
  };
  const serviceStatusToneByPhase = {
    start: "border-[#cfead8] bg-[#f2fcf5] text-[#1f9d57] shadow-[0_8px_18px_rgba(31,157,87,0.12)]",
    progress: "border-[#f6d6b8] bg-[#fff7ed] text-[#dd8a12] shadow-[0_8px_18px_rgba(221,138,18,0.12)]",
    done: "border-[#cde3ff] bg-[#eef6ff] text-[#327adf] shadow-[0_8px_18px_rgba(50,122,223,0.12)]",
  };

  return (
    <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
      <SectionTitle
        icon={UserRound}
        title={title}
        subtitle={subtitle}
      />

      <div className={`mt-5 rounded-[22px] border border-[#f5d9e6] p-5 ${summaryToneByPhase[phase] || summaryToneByPhase.start}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <img crossOrigin="anonymous"
              src={data.customerAvatar}
              alt={data.customerName}
              className="h-16 w-16 rounded-2xl border border-[#f2bfd4] object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold text-[#3f2b3f]">{data.customerName}</p>
              <p className="mt-1 text-sm text-[#a88a9d]">{data.customerPhone || "--"}</p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-bold ${serviceStatusToneByPhase[phase] || serviceStatusToneByPhase.start}`}
          >
            {serviceStatusLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SessionChip icon={UserRound} label={data.staffArtist || "--"} />
          <SessionChip icon={Clock3} label={`Start: ${data.appointmentTime || "--"}`} />
          <SessionChip icon={Clock3} label={`Est. Finish: ${data.estimatedFinishTime || "--"}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          {/* <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Service</p>
          <div className="mt-3"> */}
          <ServiceSummaryValue
            services={Array.isArray(data.serviceBreakdown) ? data.serviceBreakdown : []}
            fallbackValue={data.serviceLabel}
            onOpenProcedures={onOpenProcedures}
          />
          {/* </div> */}
        </div>
        <SummaryValue label="Staff Artist" value={data.staffArtist || "--"} />
        <SummaryValue label="Appointment Time" value={data.appointmentTime || "--"} />
        <SummaryValue label="Estimated Finish" value={data.estimatedFinishTime || "--"} />
        <SummaryValue label="Estimated Duration" value={data.estimatedDuration || "--"} accent={phase === "done"} />
        {hasConfirmedDesign ? <SummaryValue label="Confirmed Design" value={data.designName} /> : null}
      </div>
    </article>
  );
}

SessionSummaryPanel.propTypes = {
  data: PropTypes.shape({
    appointmentTime: PropTypes.string,
    customerAvatar: PropTypes.string,
    customerName: PropTypes.string,
    customerPhone: PropTypes.string,
    designName: PropTypes.string,
    estimatedDuration: PropTypes.string,
    estimatedFinishTime: PropTypes.string,
    serviceBreakdown: PropTypes.arrayOf(
      PropTypes.shape({
        canViewProcedures: PropTypes.bool,
        detailLabel: PropTypes.string,
        durationLabel: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        priceLabel: PropTypes.string,
        quantity: PropTypes.number,
      }),
    ),
    nailServiceBreakdown: PropTypes.arrayOf(
      PropTypes.shape({
        durationLabel: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        priceLabel: PropTypes.string,
        quantity: PropTypes.number,
      }),
    ),
    serviceLabel: PropTypes.string,
    staffArtist: PropTypes.string,
  }).isRequired,
  hasConfirmedDesign: PropTypes.bool.isRequired,
  onOpenProcedures: PropTypes.func,
  phase: PropTypes.oneOf(["start", "progress", "done"]).isRequired,
  serviceStatusLabel: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function ConfirmationItem({ checked, disabled = false, label, onToggle, trailing = null }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${trailing ? "pr-24" : ""
          } ${disabled ? "cursor-not-allowed opacity-60" : ""
          } ${checked
            ? "border-[#f2bfd4] bg-[#fff1f7] text-[#3f2b3f]"
            : "border-[#f4dbe7] bg-[#fff9fc] text-[#6f5c6b] hover:bg-[#fff4f8]"
          }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${checked
            ? "bg-[image:var(--gradient-accent)] text-white"
            : "bg-white text-transparent ring-1 ring-[#e7cfdb]"
            }`}
        >
          <Check size={12} />
        </span>
        <span>{label}</span>
      </button>

      {trailing ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

ConfirmationItem.propTypes = {
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  trailing: PropTypes.node,
};

function SessionChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#f2bfd4] bg-[#fff5f9] px-3 py-1.5 text-[11px] font-semibold text-[#866f80]">
      <Icon size={13} className="text-[#ea4f93]" />
      {label}
    </span>
  );
}

SessionChip.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

function ActionGhostButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f2bfd4] bg-white px-4 py-3 text-sm font-bold text-[#ea4f93] transition hover:bg-[#fff5f8]"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

ActionGhostButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

function parseSummaryQuantity(meta) {
  const matched = String(meta || "").match(/qty:\s*(\d+)/i);

  if (!matched) {
    return 1;
  }

  const quantity = Number(matched[1]);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function buildFinalSummaryTableRows(priceSummary) {
  const serviceRows = Array.isArray(priceSummary?.serviceRows) ? priceSummary.serviceRows : [];
  const nailRows = Array.isArray(priceSummary?.nailRows) ? priceSummary.nailRows : [];
  const discountRows = Array.isArray(priceSummary?.discountRows) ? priceSummary.discountRows : [];

  return [
    ...serviceRows.map((item) => ({
      ...item,
      qty: parseSummaryQuantity(item?.meta),
      type: item?.category || "Service",
    })),
    ...nailRows.map((item) => ({
      ...item,
      qty: parseSummaryQuantity(item?.meta),
      type: item?.category || "Nail Service",
    })),
    ...discountRows.map((item) => ({
      ...item,
      qty: "-",
      type: item?.category || "Discount",
    })),
  ];
}

function resolvePhotoUrl(value) {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").trim();
}

function createRemotePhotoState(url, fileName, uploadedAt, fileSizeLabel = null) {
  const normalizedUrl = resolvePhotoUrl(url);

  if (!normalizedUrl) {
    return null;
  }

  return {
    fileName,
    previewUrl: normalizedUrl,
    uploadedAt,
    fileSizeLabel,
    uploadedToServer: true,
  };
}

function serializeSessionPhoto(photo) {
  if (!photo || typeof photo !== "object") {
    return null;
  }

  const previewUrl = String(photo.previewUrl || "").trim();

  if (!previewUrl) {
    return null;
  }

  return {
    fileName: photo.fileName || "Uploaded photo",
    previewUrl,
    uploadedAt: photo.uploadedAt || "Uploaded",
    fileSizeLabel: photo.fileSizeLabel ?? null,
    uploadedToServer: Boolean(photo.uploadedToServer),
  };
}

function normalizeSessionText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isServiceSessionFinalizedStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return normalizedStatus === "servicecompleted";
}

function buildProcedureStepMeta(procedure) {
  const assignedArtistName = String(procedure?.assignedArtistName || "").trim() || "Unassigned";
  const estimatedStartTime = formatTimeValue(procedure?.estimatedStartTime) || "--";
  const estimatedEndTime = formatTimeValue(procedure?.estimatedEndTime) || "--";
  const duration = Number(procedure?.duration || 0);

  return `Artist: ${assignedArtistName} | Duration: ${duration} min | Time: ${estimatedStartTime} - ${estimatedEndTime}`;
}

function getSessionBookingItemIds(value) {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  ];
}

export function StaffServiceSessionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const booking = getMockBookingById(bookingId);
  const payload = location.state?.serviceSession;
  const persistedSession = useSelector((state) =>
    bookingId ? state.serviceSession.sessions?.[bookingId] ?? null : null,
  );
  const [bookingDetail, setBookingDetail] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [serviceDetailMap, setServiceDetailMap] = useState({});
  const [bookingNailVariantDetailMap, setBookingNailVariantDetailMap] = useState({});
  const [bookingCustomerNailDetailMap, setBookingCustomerNailDetailMap] = useState({});
  const currentStaffArtistId = useMemo(() => {
    try {
      return String(getStaffArtistId() || "").trim();
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    let isMounted = true;

    const loadBookingDetail = async () => {
      try {
        const detail = await fetchStaffBookingDetail(bookingId);

        if (isMounted) {
          setBookingDetail(detail);
        }
      } catch {
        if (isMounted) {
          setBookingDetail(null);
        }
      }
    };

    loadBookingDetail();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    const customerId = String(bookingDetail?.customerId || "").trim();
    let isMounted = true;

    const loadCustomerDetail = async () => {
      if (!customerId) {
        if (isMounted) {
          setCustomerDetail(null);
        }
        return;
      }

      try {
        const detail = await fetchStaffCustomerDetail(customerId);

        if (isMounted) {
          setCustomerDetail(detail);
        }
      } catch {
        if (isMounted) {
          setCustomerDetail(null);
        }
      }
    };

    void loadCustomerDetail();

    return () => {
      isMounted = false;
    };
  }, [bookingDetail?.customerId]);

  useEffect(() => {
    const bookingItems = Array.isArray(bookingDetail?.bookingItems) ? bookingDetail.bookingItems : [];
    const serviceIds = [...new Set(
      bookingItems.map((item) => String(item?.serviceId || "").trim()).filter(Boolean),
    )];
    const nailVariantIds = [...new Set(
      bookingItems
        .map((item) => Number(item?.nailVariantId || 0))
        .filter((value) => Number.isInteger(value) && value > 0),
    )];
    const customerNailIds = [...new Set(
      bookingItems
        .map((item) => Number(item?.customerNailId || 0))
        .filter((value) => Number.isInteger(value) && value > 0),
    )];
    let isMounted = true;

    if (!serviceIds.length && !nailVariantIds.length && !customerNailIds.length) {
      setServiceDetailMap({});
      setBookingNailVariantDetailMap({});
      setBookingCustomerNailDetailMap({});
      return undefined;
    }

    const loadBookingItemDetails = async () => {
      const [serviceResults, nailVariantResults, customerNailResults] = await Promise.all([
        Promise.allSettled(serviceIds.map(async (serviceId) => [serviceId, await fetchStaffServiceDetail(serviceId)])),
        Promise.allSettled(nailVariantIds.map(async (variantId) => [variantId, await fetchStaffNailVariantDetail(variantId)])),
        Promise.allSettled(customerNailIds.map(async (customerNailId) => [customerNailId, await fetchStaffCustomerNailDetail(customerNailId)])),
      ]);

      if (!isMounted) {
        return;
      }

      setServiceDetailMap(
        serviceResults.reduce((accumulator, result) => {
          if (result.status === "fulfilled") {
            const [serviceId, detail] = result.value;
            accumulator[serviceId] = detail;
          }
          return accumulator;
        }, {}),
      );
      setBookingNailVariantDetailMap(
        nailVariantResults.reduce((accumulator, result) => {
          if (result.status === "fulfilled") {
            const [variantId, detail] = result.value;
            accumulator[variantId] = detail;
          }
          return accumulator;
        }, {}),
      );
      setBookingCustomerNailDetailMap(
        customerNailResults.reduce((accumulator, result) => {
          if (result.status === "fulfilled") {
            const [customerNailId, detail] = result.value;
            accumulator[customerNailId] = detail;
          }
          return accumulator;
        }, {}),
      );
    };

    void loadBookingItemDetails();

    return () => {
      isMounted = false;
    };
  }, [bookingDetail?.bookingItems]);

  const fallbackData = useMemo(() => {
    if (bookingDetail) {
      return buildStaffServiceSessionPayload(bookingDetail, {
        backRoute: getStaffBookingDetailRoute(bookingId),
        customerDetail,
        designUpdateRoute: getStaffBookingDesignUpdateRoute(bookingId),
        serviceDetailMap,
        nailVariantDetailMap: bookingNailVariantDetailMap,
        customerNailDetailMap: bookingCustomerNailDetailMap,
      });
    }

    if (!booking) {
      return null;
    }

    const appointmentStartTime = formatTimeValue(booking.bookingTime);
    const appointmentEndTime = formatAppointmentEndTime(appointmentStartTime, booking.totalDuration || booking.duration);

    return {
      bookingCode: booking.id.replace("BKG", "BK"),
      bookingItemId: booking.bookingItems?.[0]?.bookingItemId ?? booking.bookingItems?.[0]?.id ?? "",
      bookingItemIds: getSessionBookingItemIds(
        booking.bookingItems?.map((item) => item?.bookingItemId ?? item?.id),
      ),
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerAvatar: DEFAULT_CUSTOMER_AVATAR,
      serviceLabel: Array.isArray(booking.services) && booking.services.length ? booking.services.join("\n") : booking.service,
      serviceBreakdown: Array.isArray(booking.bookingItems)
        ? booking.bookingItems
          .map((item, index) => {
            const name = String(item?.serviceName || item?.customerNailName || item?.nailVariantName || "").trim();

            if (!name) {
              return null;
            }

            const durationValue = String(item?.duration || "").trim();
            const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
            const priceValue = Number(item?.price || item?.finalPrice || 0);

            return {
              id: String(item?.bookingItemId || item?.id || `${name}-${index}`).trim(),
              name,
              duration: durationValue ? Number.parseInt(durationValue, 10) || 0 : 0,
              durationLabel: durationValue || "--",
              quantity,
              priceLabel: formatCurrency(priceValue),
            };
          })
          .filter(Boolean)
        : [],
      nailServiceBreakdown: Array.isArray(booking.bookingItems)
        ? booking.bookingItems
          .map((item, index) => {
            const name = String(item?.nailVariantName || item?.customerNailName || "").trim();

            if (!name) {
              return null;
            }

            const durationValue = String(item?.duration || "").trim();
            const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
            const priceValue = Number(item?.price || item?.finalPrice || 0);

            return {
              id: String(item?.bookingItemId || item?.id || `${name}-${index}`).trim(),
              name,
              duration: durationValue ? Number.parseInt(durationValue, 10) || 0 : 0,
              durationLabel: durationValue || "--",
              quantity,
              priceLabel: formatCurrency(priceValue),
            };
          })
          .filter(Boolean)
        : [],
      priceSummary: {
        serviceRows: Array.isArray(booking.bookingItems)
          ? booking.bookingItems
            .map((item, index) => {
              const name = String(item?.serviceName || "").trim();

              if (!name) {
                return null;
              }

              const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;

              return {
                id: `service-${item?.bookingItemId || item?.id || index}`,
                category: "Service",
                label: name,
                amount: formatCurrency(item?.price || item?.finalPrice || 0),
              };
            })
            .filter(Boolean)
          : [],
        nailRows: Array.isArray(booking.bookingItems)
          ? booking.bookingItems
            .map((item, index) => {
              const name = String(item?.nailVariantName || item?.customerNailName || "").trim();

              if (!name) {
                return null;
              }

              const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;

              return {
                id: `nail-${item?.bookingItemId || item?.id || index}`,
                category: "Nail Service",
                label: name,
                amount: formatCurrency(item?.price || item?.finalPrice || 0),
              };
            })
            .filter(Boolean)
          : [],
        discountRows: Array.isArray(booking.discounts)
          ? booking.discounts.map((item, index) => ({
            id: `discount-${index}`,
            category: "Discount",
            label: item?.name || item?.type || `Discount ${index + 1}`,
            meta: item?.type || null,
            amount: `-${formatCurrency(Math.abs(Number(item?.amount || 0)))}`,
          }))
          : [],
      },
      staffArtist: booking.staffName,
      chair: "Chair 03",
      appointmentTime: appointmentStartTime,
      estimatedDuration: appointmentEndTime,
      estimatedFinishTime: appointmentEndTime,
      completedAt: "11:25 AM",
      designName: booking.bookingItems?.find((item) => item?.nailVariantName)?.nailVariantName || "--",
      totalPrice: booking.total,
      totalAmount: "$94.50",
      originalServicePrice: "$85.00",
      extraServiceFee: "$20.00",
      discountLabel: "Discount (Member 10%)",
      discountValue: "- $10.50",
      remainingBalance: "$94.50",
      beforePhotoTimestamp: "9:52 AM - Today",
      currentProcess: [
        Array.isArray(booking.services) && booking.services.length ? booking.services.join(" | ") : booking.service,
        booking.bookingItems?.find((item) => item?.nailVariantName)?.nailVariantName || "",
      ].filter(Boolean).join(" | ") || "--",
      remainingTime: "35 minutes",
      materialsUsed: ["Gel Polish", "Chrome Powder", "Top Coat"],
      stepNote: "Customer requested softer chrome finish.",
      customerNotes: [
        "Sensitive nails - handle with care",
        "Avoid strong acetone smell",
        "Prefers elegant chrome style",
      ],
      backRoute: getStaffBookingDetailRoute(bookingId),
      designUpdateRoute: getStaffBookingDesignUpdateRoute(bookingId),
      confirmations: [
        "Customer identity confirmed",
        "Service design confirmed",
        "Price confirmed",
        "Before photo uploaded",
      ],
    };
  }, [booking, bookingDetail, bookingId, customerDetail, serviceDetailMap, bookingNailVariantDetailMap, bookingCustomerNailDetailMap]);

  const data = useMemo(() => {
    if (!fallbackData && !payload) {
      return null;
    }

    const resolvedServiceBreakdown =
      Array.isArray(fallbackData?.serviceBreakdown) && fallbackData.serviceBreakdown.length
        ? fallbackData.serviceBreakdown
        : Array.isArray(payload?.serviceBreakdown)
          ? payload.serviceBreakdown
          : [];
    const resolvedNailServiceBreakdown =
      Array.isArray(fallbackData?.nailServiceBreakdown) && fallbackData.nailServiceBreakdown.length
        ? fallbackData.nailServiceBreakdown
        : Array.isArray(payload?.nailServiceBreakdown)
          ? payload.nailServiceBreakdown
          : [];
    const resolvedPriceSummary =
      fallbackData?.priceSummary ||
      payload?.priceSummary ||
      { serviceRows: [], nailRows: [], discountRows: [] };
    const payloadBookingItemId = String(payload?.bookingItemId || "").trim();
    const summaryAppointmentTime = fallbackData?.appointmentTime || payload?.appointmentTime || "--";
    const summaryEstimatedDuration = fallbackData?.estimatedDuration || payload?.estimatedDuration || "--";
    const summaryCustomerName = fallbackData?.customerName || payload?.customerName || "--";
    const summaryCustomerPhone = fallbackData?.customerPhone || payload?.customerPhone || "--";
    const summaryCustomerAvatar =
      fallbackData?.customerAvatar ||
      payload?.customerAvatar ||
      DEFAULT_CUSTOMER_AVATAR;
    const summaryTotalPrice = fallbackData?.totalPrice || payload?.totalPrice || "--";
    const summaryTotalAmount = fallbackData?.totalAmount || payload?.totalAmount || summaryTotalPrice;
    const summaryDiscountValue = fallbackData?.discountValue || payload?.discountValue || "0 VNĐ";
    const summaryRemainingBalance = fallbackData?.remainingBalance || payload?.remainingBalance || summaryTotalPrice;

    return {
      ...fallbackData,
      ...payload,
      bookingItemId: payloadBookingItemId || fallbackData?.bookingItemId || "",
      bookingItemIds: getSessionBookingItemIds(payload?.bookingItemIds).length
        ? getSessionBookingItemIds(payload?.bookingItemIds)
        : getSessionBookingItemIds(fallbackData?.bookingItemIds),
      appointmentTime: summaryAppointmentTime,
      estimatedDuration: summaryEstimatedDuration,
      estimatedFinishTime: fallbackData?.estimatedFinishTime || payload?.estimatedFinishTime || summaryEstimatedDuration,
      customerName: summaryCustomerName,
      customerPhone: summaryCustomerPhone,
      customerAvatar: summaryCustomerAvatar,
      totalPrice: summaryTotalPrice,
      totalAmount: summaryTotalAmount,
      discountValue: summaryDiscountValue,
      remainingBalance: summaryRemainingBalance,
      serviceBreakdown: resolvedServiceBreakdown,
      nailServiceBreakdown: resolvedNailServiceBreakdown,
      priceSummary: resolvedPriceSummary,
      confirmations: payload?.confirmations ?? fallbackData?.confirmations ?? [],
      materialsUsed: payload?.materialsUsed ?? fallbackData?.materialsUsed ?? [],
      customerNotes: payload?.customerNotes ?? fallbackData?.customerNotes ?? [],
    };
  }, [fallbackData, payload]);
  const isServerSessionFinalized = useMemo(
    () => isServiceSessionFinalizedStatus(bookingDetail?.status || payload?.status),
    [bookingDetail?.status, payload?.status],
  );
  const hasConfirmedDesign = useMemo(() => {
    const normalizedDesignName = normalizeSessionText(data?.designName).toLowerCase();

    if (!normalizedDesignName || normalizedDesignName === "--") {
      return false;
    }

    return normalizedDesignName !== "selected design not specified";
  }, [data?.designName]);

  const serverBeforePhoto = useMemo(
    () =>
      createRemotePhotoState(
        bookingDetail?.checkInImageUrl,
        "Before service photo",
        data?.beforePhotoTimestamp || "Uploaded",
      ),
    [bookingDetail?.checkInImageUrl, data?.beforePhotoTimestamp],
  );
  const serverAfterPhoto = useMemo(
    () =>
      createRemotePhotoState(
        bookingDetail?.checkOutImagesUrl,
        "After service photo",
        data?.completedAt || "Uploaded",
      ),
    [bookingDetail?.checkOutImagesUrl, data?.completedAt],
  );
  const initialConfirmations = useMemo(
    () =>
      persistedSession?.confirmations ??
      (data?.confirmations ?? []).map((label, index) => ({
        label,
        checked: persistedSession?.started ?? payload?.started ? true : index < 3,
      })),
    [data?.confirmations, payload?.started, persistedSession?.confirmations, persistedSession?.started],
  );
  const initialCompletionChecks = useMemo(
    () =>
      persistedSession?.completionChecks ?? [
        { label: "Service completed", checked: true },
        { label: "Customer reviewed final nails", checked: true },
        { label: "After photo uploaded", checked: Boolean(serverAfterPhoto || payload?.afterPhoto) },
      ],
    [payload?.afterPhoto, persistedSession?.completionChecks, serverAfterPhoto],
  );

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showExtraServiceModal, setShowExtraServiceModal] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [serviceCatalogMeta, setServiceCatalogMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [serviceSearchInput, setServiceSearchInput] = useState("");
  const [serviceSearchKeyword, setServiceSearchKeyword] = useState("");
  const [serviceCatalogPage, setServiceCatalogPage] = useState(1);
  const [selectedExtraServiceQuantities, setSelectedExtraServiceQuantities] = useState({});
  const [isLoadingServiceCatalog, setIsLoadingServiceCatalog] = useState(false);
  const [isSavingExtraService, setIsSavingExtraService] = useState(false);
  const [started, setStarted] = useState(() => persistedSession?.started ?? Boolean(payload?.started));
  const [completed, setCompleted] = useState(
    () => persistedSession?.completed ?? Boolean(payload?.completed || isServerSessionFinalized),
  );
  const [isSessionFinalized, setIsSessionFinalized] = useState(
    () => persistedSession?.isSessionFinalized ?? isServerSessionFinalized,
  );
  const [isStartingService, setIsStartingService] = useState(false);
  const [isMarkingServiceDone, setIsMarkingServiceDone] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(
    () => persistedSession?.beforePhoto ?? payload?.beforePhoto ?? serverBeforePhoto ?? null,
  );
  const [afterPhoto, setAfterPhoto] = useState(
    () => persistedSession?.afterPhoto ?? payload?.afterPhoto ?? serverAfterPhoto ?? null,
  );
  const [sessionNote, setSessionNote] = useState(() => persistedSession?.sessionNote ?? payload?.sessionNote ?? "");
  const [bookingProcedures, setBookingProcedures] = useState(
    () => persistedSession?.bookingProcedures ?? [],
  );
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
  const [procedureLoadError, setProcedureLoadError] = useState("");
  const [procedureStatusUpdates, setProcedureStatusUpdates] = useState({});
  const [claimingProcedureId, setClaimingProcedureId] = useState("");
  const [selectedProcedureService, setSelectedProcedureService] = useState(null);
  const [serviceProcedureList, setServiceProcedureList] = useState([]);
  const [isServiceProcedureModalLoading, setIsServiceProcedureModalLoading] = useState(false);
  const [serviceProcedureModalError, setServiceProcedureModalError] = useState("");
  const loadedBookingItemIdRef = useRef("");
  const progressSentinelRef = useRef(null);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [isProgressPinned, setIsProgressPinned] = useState(false);
  const [confirmations, setConfirmations] = useState(initialConfirmations);
  const [completionChecks, setCompletionChecks] = useState(initialCompletionChecks);
  const initializedBookingIdRef = useRef(bookingId);
  const effectiveBeforePhoto = beforePhoto ?? serverBeforePhoto;
  const effectiveAfterPhoto = afterPhoto ?? serverAfterPhoto;
  const displayConfirmations = useMemo(
    () =>
      confirmations.map((item) =>
        item.label === "Before photo uploaded" && effectiveBeforePhoto
          ? { ...item, checked: true }
          : item,
      ),
    [confirmations, effectiveBeforePhoto],
  );
  const displayCompletionChecks = useMemo(
    () =>
      completionChecks.map((item) =>
        item.label === "After photo uploaded" && effectiveAfterPhoto
          ? { ...item, checked: true }
          : item,
      ),
    [completionChecks, effectiveAfterPhoto],
  );

  const procedureChecklist = useMemo(() => {
    if (bookingProcedures.length === 0) {
      return [];
    }

    const sortedProcedures = [...bookingProcedures]
      .sort((left, right) => (left.stepOrder ?? 0) - (right.stepOrder ?? 0));

    return sortedProcedures
      .map((procedure) => {
        const normalizedStatus = String(procedure.status || "").trim().toLowerCase();
        const procedureName = String(procedure.procedureName || "").trim() || "--";
        const hasStepOrder = Number.isFinite(procedure.stepOrder);
        const assignedArtistId = String(procedure.assignedArtistId || "").trim();
        const isAssignedToAnyone = hasAssignedArtist(procedure);
        const isTerminalStatus = ["completed", "done", "skipped"].includes(normalizedStatus);
        const isInProgressStatus = ["inprogress", "in progress"].includes(normalizedStatus);
        const isPendingStatus = ["pending", "waiting"].includes(normalizedStatus);
        const isAssignedToCurrentArtist =
          !assignedArtistId || !currentStaffArtistId || assignedArtistId === currentStaffArtistId;
        const isBlocked = sortedProcedures.some((item) => {
          const itemStepOrder = Number(item?.stepOrder ?? 0);
          const procedureStepOrder = Number(procedure?.stepOrder ?? 0);
          const itemStatus = String(item?.status || "").trim().toLowerCase();

          if (!Number.isFinite(itemStepOrder) || !Number.isFinite(procedureStepOrder)) {
            return false;
          }

          if (itemStepOrder >= procedureStepOrder) {
            return false;
          }

          if (!item?.isRequired || item?.canOverlap) {
            return false;
          }

          return !["completed", "done", "skipped"].includes(itemStatus);
        });

        return {
          ...procedure,
          checked: ["completed", "done"].includes(normalizedStatus),
          label: hasStepOrder ? `Step ${procedure.stepOrder}: ${procedureName}` : procedureName,
          statusLabel: String(procedure.status || "").trim() || "--",
          canClaim: isPendingStatus && !isBlocked && !isAssignedToAnyone,
          canComplete: isInProgressStatus && isAssignedToCurrentArtist,
          canSkip: !isTerminalStatus && isAssignedToCurrentArtist,
          isBlocked,
          isAssignedToCurrentArtist,
        };
      });
  }, [bookingProcedures, currentStaffArtistId]);
  const modalProcedureList = useMemo(() => {
    if (serviceProcedureList.length === 0) {
      return [];
    }

    const sortedProcedures = [...serviceProcedureList]
      .sort((left, right) => (left.stepOrder ?? 0) - (right.stepOrder ?? 0));

    return sortedProcedures.map((procedure) => {
      const normalizedStatus = String(procedure.status || "").trim().toLowerCase();
      const assignedArtistId = String(procedure.assignedArtistId || "").trim();
      const isAssignedToAnyone = hasAssignedArtist(procedure);
      const isTerminalStatus = ["completed", "done", "skipped"].includes(normalizedStatus);
      const isPendingStatus = ["pending", "waiting"].includes(normalizedStatus);
      const isInProgressStatus = ["inprogress", "in progress"].includes(normalizedStatus);
      const isAssignedToCurrentArtist =
        !assignedArtistId || !currentStaffArtistId || assignedArtistId === currentStaffArtistId;
      const isBlocked = sortedProcedures.some((item) => {
        const itemStepOrder = Number(item?.stepOrder ?? 0);
        const procedureStepOrder = Number(procedure?.stepOrder ?? 0);
        const itemStatus = String(item?.status || "").trim().toLowerCase();

        if (!Number.isFinite(itemStepOrder) || !Number.isFinite(procedureStepOrder)) {
          return false;
        }

        if (itemStepOrder >= procedureStepOrder) {
          return false;
        }

        if (!item?.isRequired || item?.canOverlap) {
          return false;
        }

        return !["completed", "done", "skipped"].includes(itemStatus);
      });

      return {
        ...procedure,
        canClaim: isPendingStatus && !isBlocked && !isAssignedToAnyone,
        canComplete: isInProgressStatus && isAssignedToCurrentArtist,
        canSkip: !isTerminalStatus && isAssignedToCurrentArtist,
        isBlocked,
      };
    });
  }, [currentStaffArtistId, serviceProcedureList]);
  const sessionBookingItemIds = useMemo(
    () => getSessionBookingItemIds(data?.bookingItemIds),
    [data?.bookingItemIds],
  );
  const sessionBookingItemKey = useMemo(
    () => sessionBookingItemIds.join("|"),
    [sessionBookingItemIds],
  );
  const phase = !started ? "start" : completed ? "done" : "progress";

  /**
   * FIXED: Sticky-pin detection for the "Session Progress" card.
   *
   * Previously this used a scroll listener + requestAnimationFrame that
   * read scrollTop on every scroll event. Combined with the header's
   * padding change (p-5 -> px-4 py-3), each scroll tick could trigger a
   * layout recalculation, which is what caused the jank/stutter.
   *
   * IntersectionObserver does not run on every scroll frame - the
   * browser notifies us only when the sentinel crosses the observed
   * boundary, so there's no per-frame layout thrashing.
   *
   * `rootMargin` top value must be the NEGATIVE of the height of the
   * fixed header that sits above this page (see STICKY_HEADER_OFFSET_PX).
   * That's what keeps the sticky card flush against that outer header
   * instead of floating with a gap or sitting underneath it.
   */
  useEffect(() => {
    const sentinel = progressSentinelRef.current;

    if (!sentinel) {
      return undefined;
    }

    const rootMarginTop =
      STICKY_HEADER_OFFSET_PX >= 0
        ? `-${STICKY_HEADER_OFFSET_PX}px`
        : `${Math.abs(STICKY_HEADER_OFFSET_PX)}px`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsProgressPinned(!entry.isIntersecting);
      },
      {
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (beforePhoto?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(beforePhoto.previewUrl);
      }
      if (afterPhoto?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(afterPhoto.previewUrl);
      }
    };
  }, [afterPhoto, beforePhoto]);

  useEffect(() => {
    if (initializedBookingIdRef.current === bookingId) {
      return;
    }

    initializedBookingIdRef.current = bookingId;
    setShowStartConfirm(false);
    setShowCompleteConfirm(false);
    setStarted(persistedSession?.started ?? Boolean(payload?.started));
    setCompleted(persistedSession?.completed ?? Boolean(payload?.completed || isServerSessionFinalized));
    setIsSessionFinalized(persistedSession?.isSessionFinalized ?? isServerSessionFinalized);
    setFlashMessage("");
    setBeforePhoto(persistedSession?.beforePhoto ?? payload?.beforePhoto ?? serverBeforePhoto ?? null);
    setAfterPhoto(persistedSession?.afterPhoto ?? payload?.afterPhoto ?? serverAfterPhoto ?? null);
    setSessionNote(persistedSession?.sessionNote ?? payload?.sessionNote ?? "");
    setShowComparisonView(false);
    setConfirmations(initialConfirmations);
    setCompletionChecks(initialCompletionChecks);
  }, [
    bookingId,
    initialCompletionChecks,
    initialConfirmations,
    payload?.beforePhoto,
    payload?.afterPhoto,
    payload?.completed,
    payload?.sessionNote,
    payload?.started,
    persistedSession,
    isServerSessionFinalized,
    serverAfterPhoto,
    serverBeforePhoto,
  ]);

  useEffect(() => {
    if (!isServerSessionFinalized) {
      return;
    }

    setCompleted(true);
    setIsSessionFinalized(true);
    setShowCompleteConfirm(false);
  }, [isServerSessionFinalized]);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    dispatch(
      setServiceSession({
        bookingId,
        session: {
          started,
          completed,
          isSessionFinalized,
          beforePhoto: serializeSessionPhoto(beforePhoto),
          afterPhoto: serializeSessionPhoto(afterPhoto),
          sessionNote,
          confirmations,
          completionChecks,
          bookingProcedures,
          procedureLoadError,
        },
      }),
    );
  }, [
    afterPhoto,
    beforePhoto,
    bookingProcedures,
    bookingId,
    completed,
    completionChecks,
    confirmations,
    dispatch,
    isSessionFinalized,
    procedureLoadError,
    sessionNote,
    started,
  ]);

  useEffect(() => {
    if (!showExtraServiceModal) {
      return undefined;
    }

    let isMounted = true;

    const loadServiceCatalog = async () => {
      setIsLoadingServiceCatalog(true);

      try {
        const response = await fetchServiceCatalog({
          pageNumber: serviceCatalogPage,
          pageSize: 10,
          name: serviceSearchKeyword.trim() || undefined,
        });

        if (!isMounted) {
          return;
        }

        setServiceCatalog(response.items);
        setServiceCatalogMeta(response.metaData ?? {});
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setServiceCatalog([]);
        setServiceCatalogMeta({
          currentPage: serviceCatalogPage,
          totalPages: 1,
          pageSize: 10,
          totalItems: 0,
          hasPrevious: false,
          hasNext: false,
          firstRowOnPage: 0,
          lastRowOnPage: 0,
        });
        const message = getErrorMessage(error, "Failed to load services.");
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoadingServiceCatalog(false);
        }
      }
    };

    void loadServiceCatalog();

    return () => {
      isMounted = false;
    };
  }, [serviceCatalogPage, serviceSearchKeyword, showExtraServiceModal]);

  const reloadBookingProcedures = useCallback(async (bookingItemIds, options = {}) => {
    const normalizedBookingItemIds = getSessionBookingItemIds(
      Array.isArray(bookingItemIds) ? bookingItemIds : [bookingItemIds],
    );
    const canApplyState = options.shouldApplyState ?? (() => true);
    const shouldShowLoading = options.silent !== true;

    if (normalizedBookingItemIds.length === 0) {
      if (canApplyState()) {
        if (shouldShowLoading) {
          setIsLoadingProcedures(false);
        }
      }
      return;
    }

    if (canApplyState()) {
      if (shouldShowLoading) {
        setIsLoadingProcedures(true);
      }
      setProcedureLoadError("");
    }

    try {
      const results = await Promise.allSettled(
        normalizedBookingItemIds.map((bookingItemId) =>
          fetchBookingProceduresByBookingItem(bookingItemId),
        ),
      );

      if (!canApplyState()) {
        return;
      }

      const successfulProcedures = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value);
      const uniqueProcedures = [
        ...new Map(
          successfulProcedures.map((procedure) => [procedure.bookingProcedureId, procedure]),
        ).values(),
      ];
      const failedResults = results.filter((result) => result.status === "rejected");

      if (uniqueProcedures.length === 0 && failedResults.length > 0) {
        throw failedResults[0].reason;
      }

      setProcedureLoadError("");
      setBookingProcedures(uniqueProcedures);
      setProcedureStatusUpdates({});
    } catch (error) {
      if (!canApplyState()) {
        return;
      }

      setBookingProcedures([]);
      setProcedureStatusUpdates({});
      const message = getErrorMessage(error, "Failed to load booking procedures.");
      setProcedureLoadError(message);

      if (options.showToast !== false) {
        toast.error(message);
      }
    } finally {
      if (canApplyState()) {
        if (shouldShowLoading) {
          setIsLoadingProcedures(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadBookingProcedures = async () => {
      if (!sessionBookingItemKey) {
        if (isMounted) {
          setIsLoadingProcedures(false);
        }
        return;
      }

      if (loadedBookingItemIdRef.current === sessionBookingItemKey) {
        if (isMounted) {
          setIsLoadingProcedures(false);
        }
        return;
      }

      loadedBookingItemIdRef.current = sessionBookingItemKey;

      await reloadBookingProcedures(sessionBookingItemIds, {
        shouldApplyState: () => isMounted,
        showToast: isMounted,
      });
    };

    void loadBookingProcedures();

    return () => {
      isMounted = false;
    };
  }, [sessionBookingItemIds, sessionBookingItemKey]);

  const loadServiceProcedureList = useCallback(async (bookingItemId, options = {}) => {
    const normalizedBookingItemId = String(bookingItemId || "").trim();

    if (!normalizedBookingItemId) {
      return;
    }

    if (options.silent !== true) {
      setIsServiceProcedureModalLoading(true);
      setServiceProcedureModalError("");
    }

    try {
      const procedures = await fetchBookingProceduresByBookingItem(normalizedBookingItemId);
      setServiceProcedureList(Array.isArray(procedures) ? procedures : []);
      setServiceProcedureModalError("");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load service procedures.");
      setServiceProcedureModalError(message);

      if (options.showToast !== false) {
        toast.error(message);
      }
    } finally {
      if (options.silent !== true) {
        setIsServiceProcedureModalLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (phase !== "progress" || sessionBookingItemIds.length === 0) {
      return undefined;
    }

    let isMounted = true;
    let isRefreshing = false;

    const refreshProcedures = async () => {
      if (document.hidden || isRefreshing || !isMounted) {
        return;
      }

      isRefreshing = true;

      try {
        await reloadBookingProcedures(sessionBookingItemIds, {
          shouldApplyState: () => isMounted,
          showToast: false,
          silent: true,
        });

        const selectedBookingItemId = String(
          selectedProcedureService?.bookingItemId || selectedProcedureService?.id || "",
        ).trim();

        if (selectedBookingItemId && isMounted) {
          await loadServiceProcedureList(selectedBookingItemId, {
            showToast: false,
            silent: true,
          });
        }
      } catch {
        // Keep background refresh silent.
      } finally {
        isRefreshing = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshProcedures();
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadServiceProcedureList, phase, reloadBookingProcedures, selectedProcedureService?.bookingItemId, selectedProcedureService?.id, sessionBookingItemIds]);

  // eslint-disable-next-line no-unused-vars
  const currentProcedureNote = useMemo(() => {
    const fallbackNote = String(data?.stepNote || "").trim() || "--";

    if (bookingProcedures.length === 0) {
      return fallbackNote;
    }

    const sortedProcedures = [...bookingProcedures].sort(
      (left, right) => (left.stepOrder ?? 0) - (right.stepOrder ?? 0),
    );
    const activeProcedure =
      sortedProcedures.find((procedure) => {
        const normalizedStatus = String(procedure.status || "").trim().toLowerCase();

        return normalizedStatus && !["completed", "done", "skipped"].includes(normalizedStatus);
      }) || sortedProcedures[sortedProcedures.length - 1];

    if (!activeProcedure) {
      return fallbackNote;
    }

    const procedureName = String(activeProcedure.procedureName || "").trim();
    const hasStepOrder = Number.isFinite(activeProcedure.stepOrder);
    const baseLabel = procedureName && hasStepOrder ? `Step ${activeProcedure.stepOrder}: ${procedureName}` : "";

    return activeProcedure.description
      ? `${baseLabel || fallbackNote} - ${activeProcedure.description}`
      : baseLabel || fallbackNote;
  }, [bookingProcedures, data?.stepNote]);

  const procedureStepSummary = useMemo(
    () => {
      const firstPendingIndex = procedureChecklist.findIndex((procedure) => !procedure.checked);

      return procedureChecklist.map((procedure, index) => ({
        id: procedure.bookingProcedureId,
        bookingProcedureId: procedure.bookingProcedureId,
        canTick: Boolean(procedure.canComplete),
        isUpdating: Boolean(procedureStatusUpdates[procedure.bookingProcedureId]),
        label: procedure.label,
        note: buildProcedureStepMeta(procedure),
        stepNumber: Number.isFinite(procedure.stepOrder) ? procedure.stepOrder : index + 1,
        status: String(procedure.status || "").trim(),
        statusLabel: String(procedure.statusLabel || procedure.status || "").trim() || "--",
        state:
          procedure.checked
            ? "complete"
            : firstPendingIndex === -1 || index === firstPendingIndex
              ? "active"
              : "upcoming",
      }));
    },
    [procedureChecklist, procedureStatusUpdates],
  );

  const resolvedProcedureLoadError = procedureLoadError && !bookingProcedures.length ? procedureLoadError : "";
  const areAllProceduresCompleted =
    procedureChecklist.length > 0
    && procedureChecklist.every((procedure) => isProcedureCompletedStatus(procedure.status));

  if (!data) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const allConfirmed = displayConfirmations.every((item) => item.checked);
  const canStartService = allConfirmed && Boolean(effectiveBeforePhoto);
  const hasAfterPhotoFile = Boolean(afterPhoto?.file);
  const canCompleteSession =
    displayCompletionChecks.every((item) => item.checked)
    && hasAfterPhotoFile
    && areAllProceduresCompleted;
  const canOpenComparison = Boolean(effectiveBeforePhoto) && Boolean(effectiveAfterPhoto);
  const shouldShowProcedureChecklist =
    phase === "progress" || procedureChecklist.length > 0 || Boolean(resolvedProcedureLoadError);
  const summarySectionConfig = {
    start: {
      title: "Customer & Booking Summary",
      subtitle: "Final service context before the session starts.",
      statusLabel: "Ready To Start",
    },
    progress: {
      title: "Current Session Overview",
      subtitle: "Live customer context while the service is running.",
      statusLabel: "Session In Progress",
    },
    done: {
      title: "Customer & Service Summary",
      subtitle: "Final service context before closing this session.",
      statusLabel: "Final Review",
    },
  };

  const handleToggleConfirmation = (label) => {
    setConfirmations((current) =>
      current.map((item) => (item.label === label ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleToggleCompletionCheck = (label) => {
    setCompletionChecks((current) =>
      current.map((item) => (item.label === label ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleClaimProcedure = async (procedure) => {
    const procedureId = String(procedure?.bookingProcedureId || "").trim();

    if (!procedureId) {
      return;
    }

    setProcedureStatusUpdates((current) => ({
      ...current,
      [procedureId]: true,
    }));

    try {
      const updatedProcedure = await claimBookingProcedure(procedureId);

      setBookingProcedures((current) =>
        current.map((item) =>
          item.bookingProcedureId === procedureId
            ? {
              ...item,
              ...updatedProcedure,
            }
            : item,
        ),
      );
      await reloadBookingProcedures(sessionBookingItemIds, { showToast: false });
      toast.success("Procedure claimed successfully.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to claim procedure.");
      toast.error(message);
    } finally {
      setProcedureStatusUpdates((current) => ({
        ...current,
        [procedureId]: false,
      }));
    }
  };

  const handleClaimProcedureFromModal = async (procedure) => {
    const procedureId = String(procedure?.bookingProcedureId || "").trim();
    const bookingItemId = String(
      selectedProcedureService?.bookingItemId || selectedProcedureService?.id || "",
    ).trim();

    if (!procedureId || !bookingItemId || claimingProcedureId) {
      return;
    }

    setClaimingProcedureId(procedureId);
    setProcedureStatusUpdates((current) => ({
      ...current,
      [procedureId]: true,
    }));

    try {
      await claimBookingProcedure(procedureId);
      await Promise.all([
        reloadBookingProcedures(sessionBookingItemIds, { showToast: false, silent: true }),
        loadServiceProcedureList(bookingItemId, { showToast: false, silent: true }),
      ]);
      toast.success("Procedure claimed successfully.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to claim procedure.");
      toast.error(message);
    } finally {
      setClaimingProcedureId("");
      setProcedureStatusUpdates((current) => ({
        ...current,
        [procedureId]: false,
      }));
    }
  };

  const handleUpdateProcedureStatus = async (procedure, nextStatus) => {
    const procedureId = String(procedure?.bookingProcedureId || "").trim();
    const normalizedNextStatus = String(nextStatus || "").trim();

    if (!procedureId || !normalizedNextStatus) {
      return;
    }

    setProcedureStatusUpdates((current) => ({
      ...current,
      [procedureId]: true,
    }));

    try {
      const updatedProcedure = await updateBookingProcedureStatus(procedureId, normalizedNextStatus);

      setBookingProcedures((current) =>
        current.map((item) =>
          item.bookingProcedureId === procedureId
            ? {
              ...item,
              ...updatedProcedure,
            }
            : item,
        ),
      );
      await reloadBookingProcedures(sessionBookingItemIds, { showToast: false });
      toast.success(`Procedure marked as ${normalizedNextStatus}.`);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update procedure status.");
      toast.error(message);
    } finally {
      setProcedureStatusUpdates((current) => ({
        ...current,
        [procedureId]: false,
      }));
    }
  };

  const handleBeforePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (beforePhoto?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(beforePhoto.previewUrl);
    }

    const now = new Date();
    setBeforePhoto({
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      uploadedAt: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
    setConfirmations((current) =>
      current.map((item) =>
        item.label === "Before photo uploaded" ? { ...item, checked: true } : item,
      ),
    );
  };

  const handleAfterPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (afterPhoto?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(afterPhoto.previewUrl);
    }

    const now = new Date();
    setAfterPhoto({
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      uploadedAt: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      fileSizeLabel: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    });
    setCompletionChecks((current) =>
      current.map((item) =>
        item.label === "After photo uploaded" ? { ...item, checked: true } : item,
      ),
    );
  };

  const handleStartService = async () => {
    if (!bookingId || isStartingService || !beforePhoto?.file) {
      return;
    }

    setIsStartingService(true);

    try {
      await uploadImageBeforeService(bookingId, beforePhoto.file);
      await startStaffBookingService(bookingId);
      const refreshedBookingDetail = await fetchStaffBookingDetail(bookingId).catch(() => null);

      if (refreshedBookingDetail) {
        setBookingDetail(refreshedBookingDetail);
      }

      await reloadBookingProcedures(
        getSessionBookingItemIds(
          refreshedBookingDetail?.bookingItems?.map((item) => item?.bookingItemId || item?.id),
        ).length
          ? getSessionBookingItemIds(
            refreshedBookingDetail?.bookingItems?.map((item) => item?.bookingItemId || item?.id),
          )
          : data?.bookingItemIds,
      );

      const refreshedBeforePhoto =
        createRemotePhotoState(
          refreshedBookingDetail?.checkInImageUrl,
          beforePhoto.fileName || "Before service photo",
          beforePhoto.uploadedAt || data.beforePhotoTimestamp || "Uploaded",
        ) ||
        (beforePhoto
          ? {
            ...beforePhoto,
            uploadedToServer: true,
          }
          : null);

      setShowStartConfirm(false);
      setStarted(true);
      setBeforePhoto(refreshedBeforePhoto);
      setFlashMessage(
        "Service session started successfully.",
      );
      toast.success("Service started successfully.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload before-service image and start service.");
      toast.error(message);
    } finally {
      setIsStartingService(false);
    }
  };

  const handleMarkServiceDone = async () => {
    if (isMarkingServiceDone) {
      return;
    }

    if (isSessionFinalized || isServerSessionFinalized) {
      setCompleted(true);
      setIsSessionFinalized(true);
      return;
    }

    if (!areAllProceduresCompleted) {
      toast.error("All procedure steps must be completed before marking the service as done.");
      return;
    }

    if (canCompleteSession) {
      setShowCompleteConfirm(true);
      return;
    }

    setIsMarkingServiceDone(true);

    try {
      setCompleted(true);
      setFlashMessage(
        "Service marked as done. Upload the after-service photo and complete the final review.",
      );
      toast.success("Service moved to final review.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to move the service to final review.");
      toast.error(message);
    } finally {
      setIsMarkingServiceDone(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!bookingId || isCompletingSession) {
      return;
    }

    if (isSessionFinalized || isServerSessionFinalized) {
      setCompleted(true);
      setIsSessionFinalized(true);
      setShowCompleteConfirm(false);
      toast.error("This service session has already been completed.");
      return;
    }

    if (!afterPhoto?.file) {
      toast.error("Select the after-service photo again before completing the session.");
      return;
    }

    if (!areAllProceduresCompleted) {
      toast.error("All procedure steps must be completed before completing the session.");
      return;
    }

    setIsCompletingSession(true);

    try {
      const proceduresToSkip = procedureChecklist.filter((procedure) => {
        const normalizedStatus = String(procedure.status || "").trim().toLowerCase();

        return !procedure.checked && !["completed", "done", "skipped"].includes(normalizedStatus);
      });

      if (proceduresToSkip.length > 0) {
        setProcedureStatusUpdates((current) => {
          const nextState = { ...current };

          proceduresToSkip.forEach((procedure) => {
            nextState[procedure.bookingProcedureId] = true;
          });

          return nextState;
        });

        const skippedProcedures = await Promise.all(
          proceduresToSkip.map(async (procedure) => {
            const updatedProcedure = await updateBookingProcedureStatus(procedure.bookingProcedureId, "Skipped");

            return {
              procedureId: procedure.bookingProcedureId,
              updatedProcedure,
            };
          }),
        );

        setBookingProcedures((current) =>
          current.map((item) => {
            const matchedProcedure = skippedProcedures.find(
              (procedure) => procedure.procedureId === item.bookingProcedureId,
            );

            return matchedProcedure
              ? {
                ...item,
                ...matchedProcedure.updatedProcedure,
              }
              : item;
          }),
        );
      }

      await uploadImageAfterService(bookingId, afterPhoto.file);
      const refreshedBookingDetail = await fetchStaffBookingDetail(bookingId).catch(() => null);

      if (refreshedBookingDetail) {
        setBookingDetail(refreshedBookingDetail);
      }

      const refreshedAfterPhoto =
        createRemotePhotoState(
          refreshedBookingDetail?.checkOutImagesUrl,
          afterPhoto.fileName || "After service photo",
          afterPhoto.uploadedAt || data.completedAt || "Uploaded",
          afterPhoto.fileSizeLabel ?? null,
        ) ||
        (afterPhoto
          ? {
            ...afterPhoto,
            uploadedToServer: true,
          }
          : null);

      setCompleted(true);
      setIsSessionFinalized(true);
      setShowCompleteConfirm(false);
      setAfterPhoto(refreshedAfterPhoto);
      setFlashMessage(
        "Service completed successfully. The booking is ready for payment and history archiving.",
      );
      toast.success("Service completed successfully.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to complete the service session.");
      toast.error(message);
    } finally {
      setProcedureStatusUpdates({});
      setIsCompletingSession(false);
    }
  };

  const handleSessionAction = (message) => {
    setFlashMessage(message);
  };

  const handleOpenExtraServiceModal = () => {
    setSelectedExtraServiceQuantities({});
    setServiceSearchInput("");
    setServiceSearchKeyword("");
    setServiceCatalogPage(1);
    setShowExtraServiceModal(true);
    setFlashMessage("");
  };

  const handleOpenServiceProcedureModal = async (service) => {
    const bookingItemId = String(service?.bookingItemId || service?.id || "").trim();

    if (!bookingItemId) {
      toast.error("Booking item ID is not available for this service.");
      return;
    }

    setSelectedProcedureService(service);
    setServiceProcedureList([]);
    await loadServiceProcedureList(bookingItemId);
  };

  const handleCloseServiceProcedureModal = () => {
    setSelectedProcedureService(null);
    setServiceProcedureList([]);
    setServiceProcedureModalError("");
    setIsServiceProcedureModalLoading(false);
    setClaimingProcedureId("");
  };

  const handleCloseExtraServiceModal = () => {
    if (isSavingExtraService) {
      return;
    }

    setShowExtraServiceModal(false);
  };

  const handleSearchExtraServices = (event) => {
    event.preventDefault();
    setServiceCatalogPage(1);
    setSelectedExtraServiceQuantities({});
    setServiceSearchKeyword(serviceSearchInput.trim());
  };

  const handleAddExtraService = async () => {
    const normalizedBookingId = String(bookingId || "").trim();
    const normalizedSelectedServices = Object.entries(selectedExtraServiceQuantities).filter(([, quantity]) => (
      Number(quantity || 0) > 0
    ));

    if (!normalizedBookingId || normalizedSelectedServices.length === 0 || !bookingDetail || isSavingExtraService) {
      return;
    }

    setIsSavingExtraService(true);

    try {
      const bookingItems = Array.isArray(bookingDetail.bookingItems) ? bookingDetail.bookingItems : [];
      const payloadBookingItems = buildStaffBookingItemsForUpdate(
        bookingItems,
        selectedExtraServiceQuantities,
      );

      const updatedBooking = await updateStaffBooking(normalizedBookingId, {
        bookingDate: bookingDetail.bookingDate,
        startTime: bookingDetail.startTime,
        nailArtistId: toNullableBookingUuid(
          bookingDetail.nailArtistId || bookingDetail.artistId,
        ),
        bookingItems: payloadBookingItems,
      });

      setBookingDetail(updatedBooking);
      setShowExtraServiceModal(false);
      setSelectedExtraServiceQuantities({});

      const selectedServiceNames = normalizedSelectedServices
        .map(([serviceId, quantity]) => {
          const matchedService = serviceCatalog.find((item) => item.serviceId === serviceId);

          if (!matchedService?.name) {
            return "";
          }

          return quantity > 1 ? `${matchedService.name} x${quantity}` : matchedService.name;
        })
        .filter(Boolean);
      setFlashMessage(
        selectedServiceNames.length
          ? `${selectedServiceNames.join(", ")} ${selectedServiceNames.length > 1 ? "have" : "has"} been added to this booking.`
          : "Extra services have been added to this booking.",
      );
      toast.success(
        normalizedSelectedServices.length
          ? `Added ${normalizedSelectedServices.length} service type${normalizedSelectedServices.length > 1 ? "s" : ""} to the booking.`
          : "Extra services added successfully.",
      );
    } catch (error) {
      const message = getErrorMessage(error, "Failed to add extra service.");
      toast.error(message);
    } finally {
      setIsSavingExtraService(false);
    }
  };

  const handleOpenComparison = () => {
    if (!canOpenComparison) {
      handleSessionAction("Upload both before and after photos to prepare the comparison view.");
      return;
    }

    setShowComparisonView(true);
    setFlashMessage("");
  };

  const handleRequestCustomerReview = () => {
    toast.success("Customer review request sent successfully.");
    setFlashMessage("");
  };

  const comparisonModal = showComparisonView ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b1323]/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-[#f3d5e2] bg-[linear-gradient(180deg,#fffdfd_0%,#fff5f9_100%)] shadow-[0_30px_80px_rgba(43,19,35,0.24)]">
        <button
          type="button"
          onClick={() => setShowComparisonView(false)}
          className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f2bfd4] bg-white/90 text-[#8a6179] transition hover:bg-[#fff6fa]"
          aria-label="Close comparison modal"
        >
          <X size={18} />
        </button>

        <div className="max-h-[92vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
          <div className="pr-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c990ab]">
              Final Result Review
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#3f2b3f]">
              Before & After Comparison
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#8f7286]">
              Review the service transformation in one place before checkout handoff.
            </p>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-[26px] border border-[#f3d5e2] bg-white shadow-[0_18px_40px_rgba(236,72,153,0.06)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b68aa2]">
                    Before
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#3f2b3f]">
                    Before Service Photo
                  </p>
                </div>
                <span className="rounded-full bg-[#fff1f7] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                  {effectiveBeforePhoto?.uploadedAt ?? data.beforePhotoTimestamp ?? "N/A"}
                </span>
              </div>
              <div className="bg-[#fff7fb] p-4">
                {effectiveBeforePhoto ? (
                  <Image crossOrigin="anonymous"
                    src={effectiveBeforePhoto.previewUrl}
                    alt={effectiveBeforePhoto.fileName}
                    className="h-[280px] w-full rounded-[22px] object-cover sm:h-[360px]"
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center rounded-[22px] border border-dashed border-[#f2bfd4] bg-white px-6 text-center text-sm text-[#a88a9d] sm:h-[360px]">
                    Before-service photo is not available.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[26px] border border-[#f3d5e2] bg-white shadow-[0_18px_40px_rgba(236,72,153,0.06)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b68aa2]">
                    After
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#3f2b3f]">
                    After Service Photo
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                  {effectiveAfterPhoto?.uploadedAt ?? data.afterPhotoTimestamp ?? "N/A"}
                </span>
              </div>
              <div className="bg-[#fff7fb] p-4">
                {effectiveAfterPhoto ? (
                  <Image crossOrigin="anonymous"
                    src={effectiveAfterPhoto.previewUrl}
                    alt={effectiveAfterPhoto.fileName}
                    className="h-[280px] w-full rounded-[22px] object-cover sm:h-[360px]"
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center rounded-[22px] border border-dashed border-[#f2bfd4] bg-white px-6 text-center text-sm text-[#a88a9d] sm:h-[360px]">
                    After-service photo is not available.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#f3d5e2] bg-white px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b68aa2]">
                Customer
              </p>
              <p className="mt-2 text-base font-extrabold text-[#3f2b3f]">{data.customerName}</p>
            </div>
            <div className="rounded-[22px] border border-[#f3d5e2] bg-white px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b68aa2]">
                Service
              </p>
              <p className="mt-2 text-base font-extrabold text-[#3f2b3f]">{data.serviceLabel}</p>
            </div>
            <div className="rounded-[22px] border border-[#f3d5e2] bg-white px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b68aa2]">
                Design
              </p>
              <p className="mt-2 text-base font-extrabold text-[#3f2b3f]">
                {hasConfirmedDesign ? data.designName : "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowComparisonView(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#f2bfd4] bg-white px-5 py-3 text-sm font-bold text-[#8a6179] transition hover:bg-[#fff7fb]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(data.backRoute, {
                  state: {
                    fromServiceSession: true,
                    readyForCheckout: true,
                  },
                })
              }
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)]"
            >
              Go to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const progressSteps = [
    {
      label: "Start",
      statusLabel: started ? "Complete" : "Active",
      state: started ? "complete" : "active",
    },
    {
      label: "In Progress",
      statusLabel: completed ? "Complete" : started ? "Active" : "Not Yet",
      state: completed ? "complete" : started ? "active" : "upcoming",
    },
    {
      label: "Done",
      statusLabel: completed ? "Active" : "Not Yet",
      state: completed ? "active" : "upcoming",
    },
  ];

  if (isSessionFinalized) {
    return (
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff3f8_100%)]">
        <article className="rounded-[26px] border border-[#d8f0e2] bg-[linear-gradient(180deg,#ffffff_0%,#f5fff8_100%)] p-6 shadow-[0_18px_40px_rgba(22,163,74,0.10)]">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#b7e6c8] bg-[linear-gradient(180deg,#e9fff1_0%,#d8f8e5_100%)] text-[#16975f] shadow-[0_18px_35px_rgba(22,151,95,0.18)]">
              <CheckCircle2 size={30} strokeWidth={2.6} />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#16975f]">
              Session Completed
            </p>
            <h1 className="mt-2 text-[2rem] font-black tracking-tight text-[#15803d]">
              Complete Session Successfully
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5f8a70]">
              The service session has been finalized. Continue with the handoff actions below or return to the booking list.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.staffBookings)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#b7e6c8] bg-white px-5 py-3 text-sm font-bold text-[#16975f] transition hover:bg-[#f3fff7]"
            >
              Back to Booking List
            </button>
          </div>
        </article>

        <article className="rounded-[26px] border border-[#f3d5e2] bg-white p-6 shadow-[0_18px_40px_rgba(236,72,153,0.06)]">
          <SectionTitle
            icon={Sparkles}
            title="Next Step"
            subtitle="Handoff actions after the staff session is finished."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                navigate(data.backRoute, {
                  state: {
                    fromServiceSession: true,
                    readyForCheckout: true,
                  },
                })
              }
              className="flex min-h-24 items-start gap-4 rounded-[24px] border border-[#f2bfd4] bg-[#fff7fb] px-5 py-5 text-left transition hover:bg-[#fff2f8]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffe7f1] text-[#ea4f93]">
                <Receipt size={19} />
              </span>
              <span>
                <span className="block text-base font-extrabold text-[#3f2b3f]">Go to Checkout</span>
                <span className="mt-1 block text-sm text-[#a88a9d]">Proceed from staff handoff to payment review.</span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleRequestCustomerReview}
              className="flex min-h-24 items-start gap-4 rounded-[24px] border border-[#f2bfd4] bg-[#fff7fb] px-5 py-5 text-left transition hover:bg-[#fff2f8]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4eaff] text-[#8b5cf6]">
                <ClipboardCheck size={19} />
              </span>
              <span>
                <span className="block text-base font-extrabold text-[#3f2b3f]">Request Customer Review</span>
                <span className="mt-1 block text-sm text-[#a88a9d]">Send the final review prompt to the customer profile.</span>
              </span>
            </button>

            {/* <button
              type="button"
              onClick={() =>
                handleSessionAction("Completed design can now be saved to the customer history archive.")
              }
              className="flex min-h-24 items-start gap-4 rounded-[24px] border border-[#f2bfd4] bg-[#fff7fb] px-5 py-5 text-left transition hover:bg-[#fff2f8]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Sparkles size={19} />
              </span>
              <span>
                <span className="block text-base font-extrabold text-[#3f2b3f]">Save Design to History</span>
                <span className="mt-1 block text-sm text-[#a88a9d]">Archive this final result to the customer profile.</span>
              </span>
            </button> */}

            <button
              type="button"
              disabled={!canOpenComparison}
              onClick={handleOpenComparison}
              className={`flex min-h-24 items-start gap-4 rounded-[24px] border px-5 py-5 text-left transition ${canOpenComparison
                  ? "border-[#f2bfd4] bg-[#fff7fb] hover:bg-[#fff2f8]"
                  : "cursor-not-allowed border-[#f4dbe7] bg-[#fffafb] opacity-70"
                }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffe7f1] text-[#ea4f93]">
                <Camera size={19} />
              </span>
              <span>
                <span className="block text-base font-extrabold text-[#3f2b3f]">Compare Before & After</span>
                <span className="mt-1 block text-sm text-[#a88a9d]">Open the side-by-side transformation view after both photos are uploaded.</span>
              </span>
            </button>
          </div>
        </article>
        {comparisonModal}
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f9_100%)]">

      {flashMessage ? (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {flashMessage}
        </div>
      ) : null}

      <div ref={progressSentinelRef} className="h-px w-full" />
      <article
        style={{ top: `${STICKY_HEADER_OFFSET_PX}px` }}
        className={`z-30 rounded-[22px] border border-[#f3d5e2] bg-white shadow-[0_14px_30px_rgba(236,72,153,0.05)] transition-[padding] duration-200 xl:sticky ${isProgressPinned ? "px-4 py-3 backdrop-blur-sm xl:bg-white/95" : "p-5"
          }`}
      >
        {!isProgressPinned ? (
          <SectionTitle
            icon={Sparkles}
            title="Session Progress"
            subtitle="Track the start and completion of the service workflow."
          />
        ) : null}
        <div className={`${isProgressPinned ? "mt-0" : "mt-6"} flex flex-col gap-5 xl:flex-row`}>
          {progressSteps.map((step, index) => (
            <ProgressStep
              key={step.label}
              step={step}
              index={index}
              isLast={index === progressSteps.length - 1}
              compact={isProgressPinned}
            />
          ))}
        </div>
      </article>

      <div
        className={`grid gap-4 ${phase === "progress" ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-1"
          }`}
      >
        <div className="space-y-4">
          {phase === "start" ? (
            <>
              <SessionSummaryPanel
                phase={phase}
                title={summarySectionConfig.start.title}
                subtitle={summarySectionConfig.start.subtitle}
                data={data}
                hasConfirmedDesign={hasConfirmedDesign}
                serviceStatusLabel={summarySectionConfig.start.statusLabel}
                onOpenProcedures={handleOpenServiceProcedureModal}
              />

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Before-Service Photo Upload"
                  subtitle="Save a before photo as proof before the nail service starts."
                />

                <label className="mt-5 block cursor-pointer rounded-[22px] border-2 border-dashed border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f8_100%)] px-6 py-10 text-center transition hover:border-[#ea4f93] hover:bg-[#fff6fa]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleBeforePhotoChange}
                  />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe6f1_0%,#f9bfd5_100%)] text-[#ea4f93]">
                    <ImageUp size={28} />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-[#3f2b3f]">
                    Upload hand photo before service
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#a88a9d]">
                    This photo will be saved as proof before the nail service starts.
                    <br />
                    Drag and drop your file here, or click to browse.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-[#ffe6ef] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                      JPG
                    </span>
                    <span className="rounded-full bg-[#ffe6ef] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                      PNG
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]">
                    <Upload size={14} />
                    Upload Before Photo
                  </span>
                </label>

                <div className="mt-6 border-t border-[#f8e6ef] pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                    Uploaded Preview
                  </p>
                  {effectiveBeforePhoto ? (
                    <div className="mt-4 flex items-center gap-4 rounded-[20px] border border-[#f2bfd4] bg-[#fff8fb] p-4">
                      <Image crossOrigin="anonymous"
                        src={effectiveBeforePhoto.previewUrl}
                        alt={effectiveBeforePhoto.fileName}
                        // className="h-20 w-20 rounded-2xl border border-[#f2bfd4] object-cover"
                        style={{ width: "80px", height: "80px", borderRadius: "16px", objectFit: "cover", border: "1px solid #f2bfd4" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#3f2b3f]">
                          {effectiveBeforePhoto.fileName}
                        </p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          Uploaded at {effectiveBeforePhoto.uploadedAt} - Today
                        </p>
                        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} />
                          Before Photo Uploaded
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-[#fffafb] px-4 py-4 text-sm text-[#a88a9d]">
                      No before-service photo uploaded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Service Start Confirmation"
                  subtitle="Complete these checks before beginning the live service."
                />
                <div className="mt-5 space-y-3">
                  {displayConfirmations.map((item) => (
                    <ConfirmationItem
                      key={item.label}
                      checked={item.checked}
                      label={item.label}
                      onToggle={() => handleToggleConfirmation(item.label)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!canStartService}
                  onClick={() => setShowStartConfirm(true)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold transition ${canStartService
                    ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                    : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                    }`}
                >
                  <Play size={16} />
                  Start Service
                </button>
              </article>
            </>
          ) : phase === "progress" ? (
            <>
              <SessionSummaryPanel
                phase={phase}
                title={summarySectionConfig.progress.title}
                subtitle={summarySectionConfig.progress.subtitle}
                data={data}
                hasConfirmedDesign={hasConfirmedDesign}
                serviceStatusLabel={summarySectionConfig.progress.statusLabel}
                onOpenProcedures={handleOpenServiceProcedureModal}
              />

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Before Photo Preview"
                  subtitle="This image was uploaded before the service started."
                />

                <div className="mt-5 overflow-hidden rounded-[22px] border border-[#f2bfd4] bg-[#fff7fb]">
                  {effectiveBeforePhoto ? (
                    <div className="relative">
                      <img crossOrigin="anonymous"
                        src={effectiveBeforePhoto.previewUrl}
                        alt={effectiveBeforePhoto.fileName}
                        className="h-[260px] w-full object-cover"
                      />
                      <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-bold text-emerald-700 backdrop-blur">
                        <CheckCircle2 size={12} />
                        Before Photo Uploaded
                      </span>
                      <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-[#866f80] backdrop-blur">
                        Uploaded {effectiveBeforePhoto.uploadedAt ?? data.beforePhotoTimestamp}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-[260px] items-center justify-center px-6 text-center text-sm text-[#a88a9d]">
                      Before-service photo is not available yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Current Service Status"
                  subtitle="Track what is happening during the active session."
                />

                <div className="mt-5 flex flex-col gap-4">
                  <div className={`rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f8_100%)] p-4 shadow-[0_12px_24px_rgba(236,72,153,0.06)] ${hasConfirmedDesign ? "" : "xl:col-span-2"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Current Process
                    </p>
                    <div className="mt-3">
                      <ServiceSummaryValue
                        services={Array.isArray(data.serviceBreakdown) ? data.serviceBreakdown : []}
                        fallbackValue={data.serviceLabel}
                      />
                    </div>
                  </div>
                  {hasConfirmedDesign ? (
                    <div className="rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f8_100%)] p-4 shadow-[0_12px_24px_rgba(236,72,153,0.06)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                        Nail Service
                      </p>
                      <div className="mt-3">
                        <ServiceSummaryValue
                          services={Array.isArray(data.nailServiceBreakdown) ? data.nailServiceBreakdown : []}
                          fallbackValue={data.designName}
                        />
                      </div>
                      <div className="mt-4 border-t border-[#f7dce8] pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                          Estimate Time
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{data.remainingTime}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4 xl:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Session Summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#8a7082]">
                      {Array.isArray(data.serviceBreakdown) && data.serviceBreakdown.length
                        ? `${data.serviceBreakdown.length} service item(s) are currently queued in this session.`
                        : "Service details are currently loaded for this active session."}
                    </p>
                  </div>
                </div>

                {phase === "progress" ? (
                  <div className="mt-3 rounded-[22px] border border-[#f4cfdd] bg-[linear-gradient(180deg,#fffdfd_0%,#fff8f2_100%)] px-4 py-4 shadow-[0_14px_28px_rgba(236,72,153,0.05)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Procedure Steps
                    </p>
                    {isLoadingProcedures ? (
                      <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-white px-4 py-4 text-sm text-[#a88a9d]">
                        Loading procedure steps...
                      </div>
                    ) : procedureStepSummary.length > 0 ? (
                      <div className="mt-4 flex flex-col gap-4">
                        {procedureStepSummary.map((procedure, index) => (
                          <ProcedureTimelineStep
                            key={procedure.id}
                            onTick={(currentProcedure) => void handleUpdateProcedureStatus(currentProcedure, "Completed")}
                            step={procedure}
                            isLast={index === procedureStepSummary.length - 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-white px-4 py-4 text-sm text-[#a88a9d]">
                        {resolvedProcedureLoadError || "No procedure steps found for this booking item."}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Play}
                  title="Live Session Actions"
                  subtitle="Quick controls while the appointment is in progress."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ActionGhostButton
                    icon={Plus}
                    label="Add Extra Service"
                    onClick={handleOpenExtraServiceModal}
                  />
                  <ActionGhostButton
                    icon={FilePenLine}
                    label="Add Session Note"
                    onClick={() =>
                      handleSessionAction("Use the staff notes area below to record the latest session update.")
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={handleMarkServiceDone}
                  disabled={isMarkingServiceDone || !areAllProceduresCompleted}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold ${isMarkingServiceDone || !areAllProceduresCompleted
                    ? "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                    : "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                    }`}
                >
                  <CheckCircle2 size={16} />
                  {isMarkingServiceDone ? "Opening Final Review..." : "Mark Service as Done"}
                </button>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={FilePenLine}
                  title="Staff Notes"
                  subtitle="Capture progress notes for the current live session."
                />

                <textarea
                  value={sessionNote}
                  onChange={(event) => setSessionNote(event.target.value)}
                  rows={6}
                  placeholder="Add notes about polish layers, customer feedback, or special handling instructions."
                  className="mt-5 w-full rounded-[20px] border border-[#f2bfd4] bg-[#fffafd] px-4 py-3 text-sm text-[#3f2b3f] outline-none transition placeholder:text-[#b59aab] focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ffd8e8]"
                />
              </article>
            </>
          ) : (
            <>
              <SessionSummaryPanel
                phase={phase}
                title={summarySectionConfig.done.title}
                subtitle={summarySectionConfig.done.subtitle}
                data={data}
                hasConfirmedDesign={hasConfirmedDesign}
                serviceStatusLabel={summarySectionConfig.done.statusLabel}
                onOpenProcedures={handleOpenServiceProcedureModal}
              />

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="After-Service Photo Upload"
                  subtitle="Upload the final photo as proof after the service is finished."
                />

                <label className="mt-5 block cursor-pointer rounded-[22px] border-2 border-dashed border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f8_100%)] px-6 py-10 text-center transition hover:border-[#ea4f93] hover:bg-[#fff6fa]">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleAfterPhotoChange}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe6f1_0%,#f9bfd5_100%)] text-[#ea4f93]">
                    <ImageUp size={26} />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-[#3f2b3f]">
                    Upload completed nail photo
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#a88a9d]">
                    This photo will be saved as proof after the service is finished.
                    <br />
                    Drag and drop your file here or click to browse.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-[#f0e8ff] px-3 py-1 text-[10px] font-bold text-[#6b46c1]">
                      JPG
                    </span>
                    <span className="rounded-full bg-[#f0e8ff] px-3 py-1 text-[10px] font-bold text-[#6b46c1]">
                      PNG
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.22)]">
                    <Upload size={14} />
                    Upload After Photo
                  </span>
                </label>

                <div className="mt-6 border-t border-[#f8e6ef] pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ea4f93]">
                    Preview - After Photo
                  </p>
                  {effectiveAfterPhoto ? (
                    <div className="mt-4 flex items-center gap-4 rounded-[20px] border border-[#f2bfd4] bg-[#fff8fb] p-4">
                      <Image crossOrigin="anonymous"
                        src={effectiveAfterPhoto.previewUrl}
                        alt={effectiveAfterPhoto.fileName}
                        // className="h-20 w-20 rounded-2xl border border-[#f2bfd4] object-cover"
                        style={{ width: "80px", height: "80px", borderRadius: "16px", objectFit: "cover", border: "1px solid #f2bfd4" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#3f2b3f]">
                          {effectiveAfterPhoto.fileName}
                        </p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          Uploaded at {effectiveAfterPhoto.uploadedAt} - {effectiveAfterPhoto.fileSizeLabel ?? "2.4 MB"}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} />
                          After Photo Uploaded
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-[#f4dbe7] bg-[#fffafb] px-4 py-4 text-sm text-[#a88a9d]">
                      No after-service photo uploaded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ClipboardCheck}
                  title="Completion Confirmation"
                  subtitle="Review the final checks before closing the booking."
                />

                <div className="mt-5 space-y-3">
                  {displayCompletionChecks.map((item) => (
                    <ConfirmationItem
                      key={item.label}
                      checked={item.checked}
                      label={item.label}
                      onToggle={() => handleToggleCompletionCheck(item.label)}
                    />
                  ))}
                </div>

                {shouldShowProcedureChecklist ? (
                  <div className="mt-5 rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Nail Procedure
                    </p>
                    <div className="mt-4 space-y-3">
                      {procedureChecklist.length > 0 ? (
                        procedureChecklist.map((procedure) => (
                          <ConfirmationItem
                            key={procedure.bookingProcedureId}
                            checked={procedure.checked}
                            disabled={
                              Boolean(procedureStatusUpdates[procedure.bookingProcedureId]) ||
                              (!procedure.checked && !procedure.canComplete)
                            }
                            label={procedure.label}
                            onToggle={() => {
                              if (procedure.canComplete) {
                                void handleUpdateProcedureStatus(procedure, "Completed");
                              }
                            }}
                            trailing={
                              <div className="flex items-center gap-2">
                                {procedure.canClaim ? (
                                  <button
                                    type="button"
                                    disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleClaimProcedure(procedure);
                                    }}
                                    className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#d9c8ff] bg-[#f4efff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7c63d8] transition hover:bg-[#eee6ff] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Claim
                                  </button>
                                ) : null}
                                {procedure.canComplete ? (
                                  <button
                                    type="button"
                                    disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleUpdateProcedureStatus(procedure, "Completed");
                                    }}
                                    className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#cfead9] bg-[#f3fcf6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#249a5c] transition hover:bg-[#eaf9ef] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Complete
                                  </button>
                                ) : null}
                                {procedure.isBlocked ? (
                                  <span className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#f6d9b8] bg-[#fff7ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#dd8a12]">
                                    Blocked
                                  </span>
                                ) : null}
                                {procedure.canSkip ? (
                                  <button
                                    type="button"
                                    disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleUpdateProcedureStatus(procedure, "Skipped");
                                    }}
                                    className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#f4c7d9] bg-[#fff4f8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d95a95] transition hover:bg-[#ffe8f2] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Skip
                                  </button>
                                ) : null}
                              </div>
                            }
                          />
                        ))
                      ) : (
                        <div className="rounded-[18px] border border-[#f4dbe7] bg-white px-4 py-4 text-sm text-[#a88a9d]">
                          {resolvedProcedureLoadError || "--"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* {hasConfirmedDesign ? (
                  <div className="mt-4 rounded-xl border border-[#f2bfd4] bg-white px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[#3f2b3f]">Save Design to History</p>
                        <p className="mt-1 text-xs text-[#a88a9d]">
                          Archive this completed design into the customer profile.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null} */}
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Receipt}
                  title="Final Service Summary"
                  subtitle="Review the amount before handing over to payment flow."
                />

                <div className="mt-5 overflow-hidden rounded-[18px] border border-[#f4dbe7] bg-[#fffafb]">
                  <div className="hidden grid-cols-[120px_minmax(0,1fr)_88px_140px] items-center gap-3 border-b border-[#f8dce8] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f7_100%)] px-5 py-3 md:grid">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Type</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Item</p>
                    <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Qty</p>
                    <p className="text-right text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Amount</p>
                  </div>

                  <div className="divide-y divide-[#f9dfeb] text-sm">
                    {buildFinalSummaryTableRows(data.priceSummary).map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-4 md:grid md:grid-cols-[120px_minmax(0,1fr)_88px_140px] md:items-center md:gap-3 md:px-5"
                      >
                        <div className="flex items-center justify-between gap-3 md:block">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab] md:hidden">Type</p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold 
                          ${item.type === "Discount"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "border-[#f2bfd4] bg-white text-[#ea4f93]"
                            }
                             ${item.type === "Nail Service"
                              ? "border-yellow-200 bg-yellow-50 text-yellow-600"
                              : "border-[#f2bfd4] bg-white text-[#ea4f93]"
                            }`}>
                            {item.type}
                          </span>
                        </div>

                        <div className="mt-3 min-w-0 md:mt-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab] md:hidden">Item</p>
                          <p className="mt-1 break-words font-bold text-[#3f2b3f] md:mt-0">{item.label}</p>
                          {item.meta ? <p className="mt-1 text-xs text-[#a88a9d]">{item.meta}</p> : null}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-center">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab] md:hidden">Qty</p>
                          <span className="inline-flex rounded-full border border-[#f6dbe7] bg-white px-3 py-1 text-[11px] font-bold text-[#6f5c6b]">
                            {item.qty}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:block md:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab] md:hidden">Amount</p>
                          <span className={`font-bold ${item.type === "Discount" ? "text-red-600" : "text-green-700"}`}>
                            {item.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-[#f5d9e6]" />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-[#3f2b3f]">Total Price</span>
                  <span className="text-base font-extrabold text-green-700">{data.totalPrice}</span>
                </div>

                <button
                  type="button"
                  disabled={!canCompleteSession || isCompletingSession}
                  onClick={() => setShowCompleteConfirm(true)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold transition ${canCompleteSession && !isCompletingSession
                    ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
                    : "cursor-not-allowed bg-[#f6dbe7] text-[#b895a9]"
                    }`}
                >
                  <CheckCircle2 size={16} />
                  {isCompletingSession ? "Completing Session..." : "Complete Session"}
                </button>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Next Step"
                  subtitle="Handoff actions after the staff session is finished."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(data.backRoute, {
                        state: {
                          fromServiceSession: true,
                          readyForCheckout: true,
                        },
                      })
                    }
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe7f1] text-[#ea4f93]">
                      <Receipt size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Go to Checkout</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Proceed from staff handoff to payment review.</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestCustomerReview}
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-[#8b5cf6]">
                      <ClipboardCheck size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Request Customer Review</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Send the final review prompt to the customer profile.</span>
                    </span>
                  </button>

                  {/* <button
                    type="button"
                    onClick={() =>
                      handleSessionAction("Completed design can now be saved to the customer history archive.")
                    }
                    className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff7fb] px-4 py-4 text-left transition hover:bg-[#fff2f8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Save Design to History</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">Archive this final result to the customer profile.</span>
                    </span>
                  </button> */}

                  <button
                    type="button"
                    disabled={!canOpenComparison}
                    onClick={handleOpenComparison}
                    className={`flex min-h-20 items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${canOpenComparison
                      ? "border-[#f2bfd4] bg-[#fff7fb] hover:bg-[#fff2f8]"
                      : "cursor-not-allowed border-[#f4dbe7] bg-[#fffafb] opacity-70"
                      }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe7f1] text-[#ea4f93]">
                      <Camera size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#3f2b3f]">Compare Before & After</span>
                      <span className="mt-1 block text-xs text-[#a88a9d]">
                        Open the side-by-side transformation view after both photos are uploaded.
                      </span>
                    </span>
                  </button>
                </div>
              </article>
            </>
          )}
        </div>

        <aside className={`space-y-4 self-start xl:sticky xl:top-0 ${phase === "done" || phase === "start" ? "hidden" : ""}`}>
          {phase === "start" ? (
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <SectionTitle icon={Clock3} title="Session Snapshot" />
              <div className="mt-4 space-y-3 text-sm">
                {/* <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Booking Code</span>
                  <span className="font-extrabold text-[#3f2b3f]">#{data.bookingCode}</span>
                </div> */}
                <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Design Status</span>
                  <span className="font-extrabold text-[#ea4f93]">{data.designName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                  <span className="text-[11px] text-[#a88a9d]">Estimated Total</span>
                  <span className="font-extrabold text-[#3f2b3f]">{data.totalPrice}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#a88a9d]">Photo Status</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${effectiveBeforePhoto ? "bg-emerald-50 text-emerald-600" : "bg-[#fff5ef] text-[#d9871c]"
                      }`}
                  >
                    {effectiveBeforePhoto ? "Uploaded" : "Pending"}
                  </span>
                </div>
              </div>
            </article>
          ) : (
            <>
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Sparkles}
                  title="Service Details"
                  subtitle="Confirmed design context for the active booking."
                />
                <div className="mt-4 space-y-3 text-sm">
                  {/* <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Booking Code</span>
                    <span className="font-extrabold text-[#3f2b3f]">#{data.bookingCode}</span>
                  </div> */}
                  {hasConfirmedDesign ? (
                    <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                      <span className="text-[11px] text-[#a88a9d]">Confirmed Design</span>
                      <span className="text-right font-extrabold text-[#ea4f93]">{data.designName}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Duration</span>
                    <span className="font-extrabold text-[#3f2b3f]">{data.appointmentTime} - {data.estimatedFinishTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#f8e6ef] pb-3">
                    <span className="text-[11px] text-[#a88a9d]">Estimated Total</span>
                    <span className="font-extrabold text-[#3f2b3f]">{data.totalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#a88a9d]">Status</span>
                    <span className="rounded-full border border-rose-200 bg-[#fff1f7] px-2.5 py-1 text-[10px] font-bold text-[#d65b92]">
                      In Progress
                    </span>
                  </div>
                </div>
              </article>

              {/* <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Customer Notes"
                  subtitle="Important reminders from the consultation stage."
                />
                <div className="mt-4 space-y-3">
                  {(data.customerNotes ?? []).map((note) => (
                    <div
                      key={note}
                      className="flex items-start gap-3 rounded-[14px] border border-[#f6dbe8] bg-[#fff7fb] px-3 py-3 text-sm text-[#866f80]"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ea4f93]" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </article> */}

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Next Action"
                  subtitle="Common next steps while finishing the session."
                />
                <div className="mt-4 space-y-3">
                  <ActionGhostButton
                    icon={Camera}
                    label="Upload After Photo"
                    onClick={() =>
                      handleSessionAction("After-photo upload is the next recommended step for this session.")
                    }
                  />
                  <button
                    type="button"
                    onClick={handleMarkServiceDone}
                    disabled={isMarkingServiceDone || !areAllProceduresCompleted}
                    className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${isMarkingServiceDone || !areAllProceduresCompleted
                      ? "cursor-not-allowed border-[#edd6e0] bg-[#f7edf2] text-[#b895a9]"
                      : "border-rose-300 bg-[linear-gradient(180deg,#ffe7ef_0%,#ffd9e6_100%)] text-[#d65b92] hover:bg-[#ffe1eb]"
                      }`}
                  >
                    <CheckCircle2 size={15} />
                    Complete Session
                  </button>
                  <ActionGhostButton
                    icon={Sparkles}
                    label="Compare Before & After"
                    onClick={handleOpenComparison}
                  />
                </div>
              </article>
            </>
          )}
        </aside>
      </div>

      <ActionConfirmModal
        open={showStartConfirm}
        intent="success"
        title="Start Service Session"
        subtitle="This will begin the live service flow for the current booking."
        description="Confirm that the before photo is uploaded and all final checks are completed before starting service."
        confirmText="Start Service"
        cancelText="Review Again"
        confirmIcon={Play}
        onConfirm={handleStartService}
        onCancel={() => setShowStartConfirm(false)}
        highlights={[data.customerName, data.serviceLabel, data.chair]}
        details={[
          { label: "Appointment", value: data.appointmentTime },
          { label: "Estimated Duration", value: data.estimatedDuration },
        ]}
        warnings={[
          "Once started, this session should proceed with the confirmed service design and price.",
        ]}
      />

      <ActionConfirmModal
        open={showCompleteConfirm}
        intent="success"
        title="Complete Service Session"
        subtitle="This will close the staff session and prepare the booking for payment."
        description="Confirm that the after-service photo is uploaded and the customer has reviewed the final result."
        confirmText="Complete Session"
        cancelText="Review Again"
        confirmIcon={CheckCircle2}
        onConfirm={handleCompleteSession}
        onCancel={() => setShowCompleteConfirm(false)}
        highlights={[data.customerName, data.serviceLabel, data.totalAmount]}
        details={[
          { label: "Completed At", value: data.completedAt },
          { label: "Remaining Balance", value: data.remainingBalance },
        ]}
        warnings={[
          "Completing this session should only happen after the final photo and completion checks are done.",
        ]}
      />

      {comparisonModal}

      <ExtraServiceModal
        open={showExtraServiceModal}
        services={serviceCatalog}
        selectedServiceQuantities={selectedExtraServiceQuantities}
        searchValue={serviceSearchInput}
        isLoading={isLoadingServiceCatalog}
        isSaving={isSavingExtraService}
        meta={serviceCatalogMeta}
        onClose={handleCloseExtraServiceModal}
        onSearchChange={(event) => setServiceSearchInput(event.target.value)}
        onSearchSubmit={handleSearchExtraServices}
        onDecreaseQuantity={(serviceId) =>
          setSelectedExtraServiceQuantities((current) => {
            const nextQuantity = Math.max(0, Number(current?.[serviceId] || 0) - 1);

            if (nextQuantity <= 0) {
              const nextState = { ...current };
              delete nextState[serviceId];
              return nextState;
            }

            return {
              ...current,
              [serviceId]: nextQuantity,
            };
          })
        }
        onIncreaseQuantity={(serviceId) =>
          setSelectedExtraServiceQuantities((current) => ({
            ...current,
            [serviceId]: Number(current?.[serviceId] || 0) + 1,
          }))
        }
        onPageChange={(page) => {
          if (page < 1 || page > (serviceCatalogMeta?.totalPages ?? 1)) {
            return;
          }

          setSelectedExtraServiceQuantities({});
          setServiceCatalogPage(page);
        }}
        onConfirm={handleAddExtraService}
        title="Update Booking Services"
        description="Select extra services to add into the current booking before starting the service session."
      />

      <Modal
        open={Boolean(selectedProcedureService)}
        onCancel={handleCloseServiceProcedureModal}
        footer={[
          <Button key="close-service-procedure-modal" onClick={handleCloseServiceProcedureModal}>
            Close
          </Button>,
        ]}
        centered
        width={900}
        title="Service Procedures"
      >
        {selectedProcedureService ? (
          <div className="space-y-5 py-1">
            <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                    Service
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-[#4a3741]">
                    {selectedProcedureService.name || "--"}
                  </p>

                </div>
                <div className="grid gap-2 text-right text-sm">
                  <div>
                    <span className="text-[#8f7b88]">Quantity: </span>
                    <span className="font-bold text-[#4a3741]">{selectedProcedureService.quantity || 1}</span>
                  </div>
                  <div>
                    <span className="text-[#8f7b88]">Duration: </span>
                    <span className="font-bold text-[#4a3741]">{selectedProcedureService.durationLabel || "--"}</span>
                  </div>
                </div>
              </div>
            </div>

            {isServiceProcedureModalLoading ? (
              <div className="rounded-[18px] border border-[#f4dbe7] bg-white px-4 py-6 text-sm text-[#a88a9d]">
                Loading procedure steps...
              </div>
            ) : serviceProcedureModalError ? (
              <div className="rounded-[18px] border border-[#f8d3dc] bg-[#fff5f7] px-4 py-5 text-sm text-[#c9587e]">
                {serviceProcedureModalError}
              </div>
            ) : modalProcedureList.length ? (
              <div className="space-y-3">
                {modalProcedureList.map((procedure) => (
                  <div
                    key={procedure.bookingProcedureId || `${procedure.procedureId}-${procedure.stepOrder}`}
                    className="rounded-[18px] border border-[#f4d6e2] bg-white p-4 shadow-[0_10px_22px_rgba(236,72,153,0.04)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#fff1f6] px-2.5 py-1 text-[10px] font-extrabold text-[#eb5b92]">
                            Step {procedure.stepOrder ?? "--"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getProcedureStatusTone(procedure.status)}`}>
                            {procedure.status || "--"}
                          </span>
                        </div>
                        <p className="mt-3 text-base font-extrabold text-[#4a3741]">
                          {procedure.procedureName || "--"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#8f7b88]">
                          {procedure.description || "No procedure description available."}
                        </p>
                      </div>
                      <div className="grid gap-2 text-right text-xs text-[#8f7b88]">
                        <span>
                          {String(procedure.estimatedStartTime || "--").slice(0, 5)} - {String(procedure.estimatedEndTime || "--").slice(0, 5)}
                        </span>
                        <span className="font-bold text-[#4a3741]">{procedure.duration ?? 0} min</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                          Assigned Artist
                        </p>
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <p className="text-sm font-bold text-[#4a3741]">
                            {procedure.assignedArtistId ? (procedure.assignedArtistName || "Assigned") : "Unassigned"}
                          </p>
                          {procedure.canClaim ? (
                            <button
                              type="button"
                              onClick={() => void handleClaimProcedureFromModal(procedure)}
                              disabled={claimingProcedureId === procedure.bookingProcedureId}
                              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-3 py-1 text-[10px] font-extrabold text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {claimingProcedureId === procedure.bookingProcedureId ? (
                                <span className="inline-flex h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                              ) : null}
                              Claim
                            </button>
                          ) : procedure.canComplete ? (
                            <button
                              type="button"
                              onClick={() => void handleUpdateProcedureStatus(procedure, "Completed")}
                              disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#cfead9] bg-[#f3fcf6] px-3 py-1 text-[10px] font-extrabold text-[#249a5c] shadow-[0_10px_20px_rgba(36,154,92,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Complete
                            </button>
                          ) : procedure.isBlocked ? (
                            <span className="inline-flex shrink-0 rounded-full border border-[#f6d9b8] bg-[#fff7ed] px-3 py-1 text-[10px] font-extrabold text-[#dd8a12]">
                              Blocked
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                          Completed By
                        </p>
                        <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                          {procedure.completedByName || <span className="text-[#6c6c6c] px-3 py-1 border border-[#0a0909] rounded-2xl bg-gray-100 text-[13px] text-center">Not yet</span>}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                          Active / Passive
                        </p>
                        <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                          {procedure.activeDuration ?? 0}m / {procedure.passiveDuration ?? 0}m
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                          Overlap
                        </p>
                        <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                          {procedure.canOverlap ? <span className="text-[#28a745] px-3 py-1 border border-[#28a745] rounded-2xl bg-green-100 text-[13px] text-center">Allowed</span> : <span className="text-[#6c6c6c] px-3 py-1 border border-[#0a0909] rounded-2xl bg-gray-100 text-[13px] text-center">Not Allowed</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8f7b88]">
                No procedure steps found for this booking item.
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
