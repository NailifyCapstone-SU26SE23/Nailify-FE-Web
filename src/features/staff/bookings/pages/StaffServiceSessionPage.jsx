import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FilePenLine,
  Heart,
  // Image,
  ImageUp,
  Play,
  Plus,
  Printer,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  getStaffBookingDesignUpdateRoute,
  getStaffBookingDetailRoute,
  ROUTES,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getMockBookingById } from "../../../core/booking-management/services/mockBookings";
import {
  buildStaffServiceSessionPayload,
  fetchServiceCatalog,
  formatAppointmentEndTime,
  fetchStaffBookingDetail,
  fetchBookingProceduresByBookingItem,
  fetchStaffCustomerDetail,
  formatTimeValue,
  uploadImageBeforeService,
  startStaffBookingService,
  uploadImageAfterService,
  updateStaffBooking,
  updateBookingProcedureStatus,
} from "../services/staffBookingService";
import { useDispatch, useSelector } from "react-redux";
import { setServiceSession } from "../../../../store/serviceSessionSlice";
import { Image } from "antd";

const DEFAULT_CUSTOMER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80";

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

function ProgressStep({ step, index, isLast }) {
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
        <div className="absolute left-[calc(50%+2rem)] top-5 hidden h-[2px] w-[calc(100%-4rem)] xl:block">
          <div className={`h-full w-full rounded-full ${lineClassName}`} />
        </div>
      ) : null}

      <div
        className={`relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border text-sm font-extrabold ${tone.dot}`}
      >
        {step.state === "complete" ? <Check size={18} strokeWidth={3} /> : index + 1}
      </div>

      <div className="mt-4">
        <p className={`text-base font-extrabold ${tone.label}`}>{step.label}</p>
        <span
          className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${tone.pill}`}
        >
          {step.statusLabel}
        </span>
      </div>
    </div>
  );
}

ProgressStep.propTypes = {
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool.isRequired,
  step: PropTypes.shape({
    label: PropTypes.string.isRequired,
    state: PropTypes.oneOf(["active", "upcoming", "complete"]).isRequired,
    statusLabel: PropTypes.string.isRequired,
  }).isRequired,
};

function ProcedureTimelineStep({ step, isLast }) {
  const tone = {
    dot: "bg-[linear-gradient(135deg,#f857a6_0%,#ffcc70_100%)] text-white shadow-[0_12px_24px_rgba(244,114,182,0.2)]",
    line: "bg-[linear-gradient(180deg,#f8bfd8_0%,#ffe09c_100%)]",
    card: "bg-[linear-gradient(135deg,#fff0f7_0%,#fff6d8_100%)]",
    title: "text-[#8a7082]",
    note: "text-[#a78c9d]",
  };

  return (
    <div className="flex gap-4">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ${tone.dot}`}
        >
          {step.stepNumber}
        </div>
        {!isLast ? <div className={`mt-2 w-1 flex-1 rounded-full ${tone.line}`} /> : null}
      </div>

      <div className={`flex-1 rounded-[20px] px-5 py-4 shadow-[0_14px_32px_rgba(236,72,153,0.08)] ${tone.card}`}>
        <div className="min-w-0">
          <p className={`text-sm font-extrabold ${tone.title}`}>{step.label}</p>
          {step.note ? <p className={`mt-1 text-xs ${tone.note}`}>{step.note}</p> : null}
        </div>
      </div>
    </div>
  );
}

ProcedureTimelineStep.propTypes = {
  isLast: PropTypes.bool.isRequired,
  step: PropTypes.shape({
    label: PropTypes.string.isRequired,
    note: PropTypes.string,
    state: PropTypes.oneOf(["active", "upcoming", "complete"]).isRequired,
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

function ServiceSummaryValue({ services = [], fallbackValue = "" }) {
  const hasServices = Array.isArray(services) && services.length > 0;

  if (!hasServices) {
    return (
      <div className="rounded-[18px] border border-[#f4dbe7] bg-[#fff9fc] px-4 py-4">
        <p className="break-words text-sm font-extrabold leading-6 text-[#ea4f93]">{fallbackValue || "--"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service, index) => (
        <div
          key={service.id || `${service.name}-${index}`}
          className="flex items-center justify-between gap-3 rounded-[18px] border border-[#f2bfd4] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(236,72,153,0.05)]"
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
          <span className="shrink-0 rounded-full bg-[#f4efff] px-4 py-2 text-sm font-extrabold text-[#8c63ef]">
            {service.durationLabel || "--"}
          </span>
        </div>
      ))}
    </div>
  );
}

ServiceSummaryValue.propTypes = {
  fallbackValue: PropTypes.string,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      durationLabel: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      nailServiceName: PropTypes.string,
    }),
  ),
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

function ExtraServiceModal({
  open,
  services,
  selectedServiceIds,
  searchValue,
  isLoading,
  isSaving,
  meta,
  onClose,
  onSearchChange,
  onSearchSubmit,
  onSelect,
  onPageChange,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-[#3f2b3f]">Add Extra Service</h3>
            <p className="mt-1 text-sm text-[#a88a9d]">Select one or more active services and append them to this booking.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3">
              <Search size={16} className="text-[#ea4f93]" />
              <input
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search service name..."
                className="w-full bg-transparent text-sm text-[#3f2b3f] outline-none placeholder:text-[#c59ab0]"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white"
            >
              Search
            </button>
          </form>

          <div className="mt-5 space-y-3 pr-1">
            {isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                Loading services...
              </div>
            ) : services.length ? (
              services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.serviceId);

                return (
                  <button
                    key={service.serviceId}
                    type="button"
                    onClick={() => onSelect(service.serviceId)}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${isSelected
                      ? "border-[#ea4f93] bg-[#fff1f7] shadow-[0_14px_28px_rgba(236,72,153,0.12)]"
                      : "border-[#f3d5e2] bg-white hover:bg-[#fff8fb]"
                      }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#3f2b3f]">{service.name}</p>
                        <p className="mt-1 text-xs text-[#a88a9d]">{service.description || "No description provided."}</p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full border border-[#cdeed7] bg-[#effcf3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f9e5b]">
                        {service.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#fff4da] px-3 py-1 text-[11px] font-bold text-[#bd8517]">
                        {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(service.price)} VND
                      </span>
                      <span className="rounded-full bg-[#f7efff] px-3 py-1 text-[11px] font-bold text-[#8b5cf6]">
                        {service.duration} min
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#f1cade] bg-[#fff8fb] px-4 py-10 text-center text-sm font-medium text-[#a88a9d]">
                No services found.
              </div>
            )}
          </div>

        </div>

        <div className="shrink-0 bg-white">
          <div className="flex flex-col gap-3 border-t border-[#f7dfeb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#a88a9d]">
              Showing {meta?.firstRowOnPage ?? 0}-{meta?.lastRowOnPage ?? 0} of {meta?.totalItems ?? 0} services
            </p>
            <p className="text-xs font-bold text-[#ea4f93]">
              Selected: {selectedServiceIds.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) - 1)}
                disabled={!meta?.hasPrevious || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-[#866f80]">
                Page {meta?.currentPage ?? 1}/{meta?.totalPages ?? 1}
              </span>
              <button
                type="button"
                onClick={() => onPageChange((meta?.currentPage ?? 1) + 1)}
                disabled={!meta?.hasNext || isLoading}
                className="rounded-xl border border-[#f2bfd4] bg-white px-3 py-2 text-xs font-bold text-[#ea4f93] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#f7dfeb] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#f2bfd4] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedServiceIds.length || isSaving || isLoading}
              className="rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Adding Services..." : "Add Selected Services"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ExtraServiceModal.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  meta: PropTypes.shape({
    currentPage: PropTypes.number,
    firstRowOnPage: PropTypes.number,
    hasNext: PropTypes.bool,
    hasPrevious: PropTypes.bool,
    lastRowOnPage: PropTypes.number,
    totalItems: PropTypes.number,
    totalPages: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  searchValue: PropTypes.string.isRequired,
  selectedServiceIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      duration: PropTypes.number,
      name: PropTypes.string.isRequired,
      price: PropTypes.number,
      serviceId: PropTypes.string.isRequired,
      status: PropTypes.string,
    }),
  ).isRequired,
};

function CompareSummaryCard({ label, value, note, accent = false }) {
  return (
    <div className="rounded-[18px] border border-[#f2d3e1] bg-white p-4 shadow-[0_6px_18px_rgba(236,72,153,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c197ad]">{label}</p>
      <p className={`mt-2 text-sm font-extrabold ${accent ? "text-[#ea4f93]" : "text-[#3f2b3f]"}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#a88a9d]">{note}</p>
    </div>
  );
}

CompareSummaryCard.propTypes = {
  accent: PropTypes.bool,
  label: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function CompareActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "primary",
  disabled = false,
}) {
  const toneClassName = {
    primary:
      "border-transparent bg-[image:var(--gradient-accent)] text-white shadow-[0_14px_24px_rgba(236,72,153,0.2)]",
    secondary: "border-[#eadcf4] bg-[#f8f0ff] text-[#8b5cf6]",
    success: "border-[#ccefdc] bg-[#ecfbf2] text-[#16a365]",
    outline: "border-[#f2bfd4] bg-white text-[#ea4f93]",
    muted: "border-[#ece4ea] bg-[#f7f4f6] text-[#9b8c97]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5"
        } ${toneClassName}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

CompareActionButton.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(["muted", "outline", "primary", "secondary", "success"]),
};

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

  const fallbackData = useMemo(() => {
    if (bookingDetail) {
      return buildStaffServiceSessionPayload(bookingDetail, {
        backRoute: getStaffBookingDetailRoute(bookingId),
        customerDetail,
        designUpdateRoute: getStaffBookingDesignUpdateRoute(bookingId),
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

            return {
              id: String(item?.bookingItemId || item?.id || `${name}-${index}`).trim(),
              name,
              duration: durationValue ? Number.parseInt(durationValue, 10) || 0 : 0,
              durationLabel: durationValue || "--",
            };
          })
          .filter(Boolean)
        : [],
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
  }, [booking, bookingDetail, bookingId, customerDetail]);

  const data = useMemo(() => {
    if (!fallbackData && !payload) {
      return null;
    }
    const payloadBookingItemId = String(payload?.bookingItemId || "").trim();
    const summaryAppointmentTime = fallbackData?.appointmentTime || payload?.appointmentTime || "--";
    const summaryEstimatedDuration = fallbackData?.estimatedDuration || payload?.estimatedDuration || "--";
    const summaryCustomerName = fallbackData?.customerName || payload?.customerName || "--";
    const summaryCustomerPhone = fallbackData?.customerPhone || payload?.customerPhone || "--";
    const summaryCustomerAvatar =
      fallbackData?.customerAvatar ||
      payload?.customerAvatar ||
      DEFAULT_CUSTOMER_AVATAR;

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
      confirmations: payload?.confirmations ?? fallbackData?.confirmations ?? [],
      materialsUsed: payload?.materialsUsed ?? fallbackData?.materialsUsed ?? [],
      customerNotes: payload?.customerNotes ?? fallbackData?.customerNotes ?? [],
    };
  }, [fallbackData, payload]);
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
  const [selectedExtraServiceIds, setSelectedExtraServiceIds] = useState([]);
  const [isLoadingServiceCatalog, setIsLoadingServiceCatalog] = useState(false);
  const [isSavingExtraService, setIsSavingExtraService] = useState(false);
  const [started, setStarted] = useState(() => persistedSession?.started ?? Boolean(payload?.started));
  const [completed, setCompleted] = useState(() => persistedSession?.completed ?? Boolean(payload?.completed));
  const [isSessionFinalized, setIsSessionFinalized] = useState(
    () => persistedSession?.isSessionFinalized ?? false,
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
  const loadedBookingItemIdRef = useRef("");
  const [showComparisonView, setShowComparisonView] = useState(false);
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

    return [...bookingProcedures]
      .sort((left, right) => (left.stepOrder ?? 0) - (right.stepOrder ?? 0))
      .map((procedure) => {
        const normalizedStatus = String(procedure.status || "").trim().toLowerCase();
        const procedureName = String(procedure.procedureName || "").trim() || "--";
        const hasStepOrder = Number.isFinite(procedure.stepOrder);

        return {
          ...procedure,
          checked: ["completed", "done"].includes(normalizedStatus),
          label: hasStepOrder ? `Step ${procedure.stepOrder}: ${procedureName}` : procedureName,
          statusLabel: String(procedure.status || "").trim() || "--",
        };
      });
  }, [bookingProcedures]);
  const sessionBookingItemIds = useMemo(
    () => getSessionBookingItemIds(data?.bookingItemIds),
    [data?.bookingItemIds],
  );
  const sessionBookingItemKey = useMemo(
    () => sessionBookingItemIds.join("|"),
    [sessionBookingItemIds],
  );

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
    setCompleted(persistedSession?.completed ?? Boolean(payload?.completed));
    setIsSessionFinalized(persistedSession?.isSessionFinalized ?? false);
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
    serverAfterPhoto,
    serverBeforePhoto,
  ]);

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
        const message = error instanceof Error ? error.message : "Failed to load services.";
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

  const reloadBookingProcedures = async (bookingItemIds, options = {}) => {
    const normalizedBookingItemIds = getSessionBookingItemIds(
      Array.isArray(bookingItemIds) ? bookingItemIds : [bookingItemIds],
    );
    const canApplyState = options.shouldApplyState ?? (() => true);

    if (normalizedBookingItemIds.length === 0) {
      if (canApplyState()) {
        setIsLoadingProcedures(false);
      }
      return;
    }

    if (canApplyState()) {
      setIsLoadingProcedures(true);
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
      const message =
        error instanceof Error ? error.message : "Failed to load booking procedures.";
      setProcedureLoadError(message);

      if (options.showToast !== false) {
        toast.error(message);
      }
    } finally {
      if (canApplyState()) {
        setIsLoadingProcedures(false);
      }
    }
  };

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
        label: procedure.label,
        note: procedure.description || "",
        stepNumber: Number.isFinite(procedure.stepOrder) ? procedure.stepOrder : index + 1,
        state:
          procedure.checked
            ? "complete"
            : firstPendingIndex === -1 || index === firstPendingIndex
              ? "active"
              : "upcoming",
      }));
    },
    [procedureChecklist],
  );

  const resolvedProcedureLoadError = procedureLoadError && !bookingProcedures.length ? procedureLoadError : "";

  if (!data) {
    return <Navigate to={ROUTES.staffBookings} replace />;
  }

  const phase = !started ? "start" : completed ? "done" : "progress";
  const allConfirmed = displayConfirmations.every((item) => item.checked);
  const canStartService = allConfirmed && Boolean(effectiveBeforePhoto);
  const canCompleteSession = displayCompletionChecks.every((item) => item.checked) && Boolean(effectiveAfterPhoto);
  const canOpenComparison = Boolean(effectiveBeforePhoto) && Boolean(effectiveAfterPhoto);
  const shouldShowProcedureChecklist =
    phase === "progress" || procedureChecklist.length > 0 || Boolean(resolvedProcedureLoadError);

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
      toast.success(`Procedure marked as ${normalizedNextStatus}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update procedure status.";
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
      const message = error instanceof Error ? error.message : "Failed to upload before-service image and start service.";
      toast.error(message);
    } finally {
      setIsStartingService(false);
    }
  };

  const handleMarkServiceDone = async () => {
    if (isMarkingServiceDone) {
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
      const message = error instanceof Error ? error.message : "Failed to move the service to final review.";
      toast.error(message);
    } finally {
      setIsMarkingServiceDone(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!bookingId || isCompletingSession || !afterPhoto?.file) {
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
      const message = error instanceof Error ? error.message : "Failed to complete the service session.";
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
    setSelectedExtraServiceIds([]);
    setServiceSearchInput("");
    setServiceSearchKeyword("");
    setServiceCatalogPage(1);
    setShowExtraServiceModal(true);
    setFlashMessage("");
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
    setSelectedExtraServiceIds([]);
    setServiceSearchKeyword(serviceSearchInput.trim());
  };

  const handleAddExtraService = async () => {
    const normalizedBookingId = String(bookingId || "").trim();
    const normalizedServiceIds = selectedExtraServiceIds
      .map((serviceId) => String(serviceId || "").trim())
      .filter(Boolean);

    if (!normalizedBookingId || normalizedServiceIds.length === 0 || !bookingDetail || isSavingExtraService) {
      return;
    }

    setIsSavingExtraService(true);

    try {
      const bookingItems = Array.isArray(bookingDetail.bookingItems) ? bookingDetail.bookingItems : [];
      const toNullableNumber = (value) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }

        const normalizedValue = Number(value);

        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
      };
      const payloadBookingItems = [
        ...bookingItems.map((item) => ({
          nailVariantId: toNullableNumber(item?.nailVariantId),
          serviceId: String(item?.serviceId || "").trim() || null,
          customerNailId: toNullableNumber(item?.customerNailId),
          quantity: Number(item?.quantity || 1) || 1,
        })),
        ...normalizedServiceIds.map((serviceId) => ({
          nailVariantId: null,
          serviceId,
          customerNailId: null,
          quantity: 1,
        })),
      ];

      const updatedBooking = await updateStaffBooking(normalizedBookingId, {
        bookingDate: bookingDetail.bookingDate,
        startTime: bookingDetail.startTime,
        nailArtistId: bookingDetail.nailArtistId || bookingDetail.artistId || null,
        bookingItems: payloadBookingItems,
      });

      setBookingDetail(updatedBooking);
      setShowExtraServiceModal(false);
      setSelectedExtraServiceIds([]);

      const addedServices = serviceCatalog.filter((item) => normalizedServiceIds.includes(item.serviceId));
      const addedServiceNames = addedServices.map((item) => item.name).filter(Boolean);
      setFlashMessage(
        addedServiceNames.length
          ? `${addedServiceNames.join(", ")} ${addedServiceNames.length > 1 ? "have" : "has"} been added to this booking.`
          : "Extra services have been added to this booking.",
      );
      toast.success(
        addedServiceNames.length
          ? `Added ${addedServiceNames.length} service${addedServiceNames.length > 1 ? "s" : ""} to the booking.`
          : "Extra services added successfully.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add extra service.";
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

  const qualityChecks = [
    "Shape matches selected design",
    "Color matches selected design",
    "Decoration completed",
    "Final photo uploaded",
    "Customer approved result",
  ];

  if (showComparisonView) {
    return (
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff3f8_100%)]">
        <header className="rounded-[24px] border border-[#f3d5e2] bg-white/90 p-5 shadow-[0_14px_30px_rgba(236,72,153,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setShowComparisonView(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff4f8]"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-[1.65rem] font-black tracking-tight text-[#3f2b3f]">
                  Before & After Comparison
                </h1>
                <p className="mt-1 text-sm text-[#a88a9d]">
                  Compare customer hand photos before and after the nail service.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl border border-[#f2bfd4] bg-[#fff1f7] px-4 py-2 text-xs font-extrabold text-[#ea4f93]">
                #{data.bookingCode}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completed
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-xs font-extrabold text-white">
                {data.staffArtist
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
          <SectionTitle
            icon={Clock3}
            title="Session Progress"
            subtitle="Completed proof of the service workflow."
          />
          <div className="mt-6 flex flex-col gap-5 xl:flex-row">
            {[
              { label: "Start", statusLabel: "Completed", state: "complete" },
              { label: "In Progress", statusLabel: "Completed", state: "complete" },
              { label: "Done", statusLabel: "Completed", state: "complete" },
            ].map((step, index, list) => (
              <ProgressStep
                key={step.label}
                step={step}
                index={index}
                isLast={index === list.length - 1}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
          <SectionTitle
            icon={Camera}
            title="Photo Comparison"
            subtitle="Side-by-side view of the nail transformation."
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] xl:items-center">
            <div className="overflow-hidden rounded-[22px] border border-[#f3d5e2] bg-[#fff8fb]">
              <div className="flex items-center justify-between border-b border-[#f8e3ec] px-4 py-3">
                <p className="text-sm font-extrabold text-[#3f2b3f]">Before Service</p>
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold text-amber-600">
                  Before Photo
                </span>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] border border-[#f0d5e2] bg-white">
                  <img
                    src={effectiveBeforePhoto.previewUrl}
                    alt={effectiveBeforePhoto.fileName}
                    className="h-[320px] w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-[#f3dbe6] bg-white px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1f7] text-[#ea4f93]">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#b59aab]">Uploaded at</p>
                    <p className="text-sm font-bold text-[#3f2b3f]">{effectiveBeforePhoto.uploadedAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-white shadow-[0_12px_20px_rgba(236,72,153,0.24)]">
                <ArrowRight size={18} />
              </div>
              <div className="rounded-xl border border-[#f2bfd4] bg-[#fff5fa] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#ea4f93]">
                Transformation
                <br />
                Result
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[#f3d5e2] bg-[#fff8fb]">
              <div className="flex items-center justify-between border-b border-[#f8e3ec] px-4 py-3">
                <p className="text-sm font-extrabold text-[#3f2b3f]">After Service</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                  After Photo
                </span>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] border border-[#f0d5e2] bg-white">
                  <img
                    src={effectiveAfterPhoto.previewUrl}
                    alt={effectiveAfterPhoto.fileName}
                    className="h-[320px] w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-[#f3dbe6] bg-white px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1f7] text-[#ea4f93]">
                    <Clock3 size={14} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#b59aab]">Uploaded at</p>
                    <p className="text-sm font-bold text-[#3f2b3f]">{effectiveAfterPhoto.uploadedAt}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CompareSummaryCard label="Service" value={data.serviceLabel} note={data.designName} />
          <CompareSummaryCard label="Staff Artist" value={data.staffArtist} note="Senior Artist" />
          <CompareSummaryCard label="Duration" value={data.estimatedDuration} note="On schedule" />
          <CompareSummaryCard label="Design Match" value="96%" note="Excellent" accent />
          <CompareSummaryCard label="Satisfaction" value="Pending" note="Awaiting review" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-[24px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-[image:var(--gradient-accent)]" />
              <h2 className="text-sm font-extrabold text-[#3f2b3f]">Quality Check</h2>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {qualityChecks.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white">
                    <Check size={12} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <CompareActionButton
                icon={Receipt}
                label="Save to Customer History"
                tone="primary"
                onClick={() =>
                  handleSessionAction("Completed comparison can now be saved to the customer history.")
                }
              />
              <CompareActionButton
                icon={Heart}
                label="Add to Staff Portfolio"
                tone="secondary"
                onClick={() =>
                  handleSessionAction("This completed nail set can be added to the staff portfolio.")
                }
              />
              <CompareActionButton
                icon={Send}
                label="Send to Customer"
                tone="success"
                onClick={() =>
                  handleSessionAction("Comparison proof has been prepared to send to the customer.")
                }
              />
              <CompareActionButton
                icon={CreditCard}
                label="Go to Payment"
                tone="outline"
                onClick={() =>
                  navigate(data.backRoute, {
                    state: {
                      fromServiceSession: true,
                      readyForCheckout: true,
                    },
                  })
                }
              />
              <CompareActionButton
                icon={ArrowLeft}
                label="Back to Service Session"
                tone="muted"
                onClick={() => setShowComparisonView(false)}
              />
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Customer
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={data.customerAvatar}
                  alt={data.customerName}
                  className="h-14 w-14 rounded-full border border-[#f2bfd4] object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                  <span className="mt-1 inline-flex rounded-full bg-[#ffd771] px-2.5 py-1 text-[10px] font-bold text-[#9a5b00]">
                    Gold Member
                  </span>
                  <p className="mt-2 text-xs text-[#a88a9d]">#{data.bookingCode}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Selected Design
              </p>
              <div className="mt-4 overflow-hidden rounded-[16px] border border-[#f1d4e1]">
                <img
                  src={effectiveAfterPhoto.previewUrl}
                  alt={data.designName}
                  className="h-32 w-full object-cover"
                />
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Shape", "Almond"],
                  ["Length", "Medium"],
                  ["Color", "Pearl Chrome"],
                  ["Finish", "Glossy"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[#b08ea2]">{label}</span>
                    <span className="font-bold text-[#3f2b3f]">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Proof Record
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#866f80]">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>Before photo uploaded</p>
                    <p className="font-bold text-[#3f2b3f]">{effectiveBeforePhoto.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>After photo uploaded</p>
                    <p className="font-bold text-[#3f2b3f]">{effectiveAfterPhoto.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ea4f93]" />
                  <div>
                    <p>Verified by</p>
                    <p className="font-bold text-[#3f2b3f]">{data.staffArtist}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p>Session status</p>
                    <p className="font-bold text-emerald-600">Completed</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d75d93]">
                Next Step
              </p>
              <div className="mt-4 space-y-3">
                <CompareActionButton
                  icon={Receipt}
                  label="Checkout"
                  tone="primary"
                  onClick={() =>
                    navigate(data.backRoute, {
                      state: {
                        fromServiceSession: true,
                        readyForCheckout: true,
                      },
                    })
                  }
                />
                <CompareActionButton
                  icon={ClipboardCheck}
                  label="Request Review"
                  tone="outline"
                  onClick={() =>
                    handleSessionAction("Customer review request can be sent after comparison is confirmed.")
                  }
                />
                <CompareActionButton
                  icon={Printer}
                  label="Print Receipt"
                  tone="secondary"
                  onClick={() => handleSessionAction("Receipt printing can be prepared from the final payment flow.")}
                />
              </div>
            </article>
          </aside>
        </div>
      </section>
    );
  }

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
              onClick={() =>
                handleSessionAction("Customer review request can be sent after the final session handoff.")
              }
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

            <button
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
            </button>

            <button
              type="button"
              disabled={!canOpenComparison}
              onClick={handleOpenComparison}
              className={`flex min-h-24 items-start gap-4 rounded-[24px] border px-5 py-5 text-left transition ${
                canOpenComparison
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

      <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <SectionTitle
          icon={Sparkles}
          title="Session Progress"
          subtitle="Track the start and completion of the service workflow."
        />
        <div className="mt-6 flex flex-col gap-5 xl:flex-row">
          {progressSteps.map((step, index) => (
            <ProgressStep
              key={step.label}
              step={step}
              index={index}
              isLast={index === progressSteps.length - 1}
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
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Customer & Booking Summary"
                  subtitle="Final service context before the session starts."
                />

                <div className="mt-5 border-b border-[#f8e6ef] pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-14 w-14 rounded-2xl border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      <p className="mt-1 text-sm text-[#a88a9d]">{data.customerPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <SummaryValue label="Service" value={data.serviceLabel} accent />
                  <SummaryValue label="Staff Artist" value={data.staffArtist} />
                  {/* <SummaryValue label="Chair" value={data.chair} /> */}
                  <SummaryValue label="Appointment Time" value={data.appointmentTime} />
                  <SummaryValue label="Estimated Duration" value={data.estimatedDuration} />
                  {hasConfirmedDesign ? <SummaryValue label="Confirmed Design" value={data.designName} /> : null}
                </div>
              </article>

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
                      <Image
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
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Current Session Overview"
                  subtitle="Live customer context while the service is running."
                />

                <div className="mt-5 flex flex-col gap-5 rounded-[22px] border border-[#f5d9e6] bg-[linear-gradient(180deg,#fffafc_0%,#fff5f9_100%)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-16 w-16 rounded-2xl border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      {/* <p className="mt-1 text-sm font-medium text-[#ea4f93]">{overviewServiceLabel}</p> */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SessionChip icon={UserRound} label={data.staffArtist} />
                        {/* <SessionChip icon={Sparkles} label={overviewServiceLabel} /> */}
                        <SessionChip icon={Clock3} label={`Start: ${data.appointmentTime ?? "--"}`} />
                        <SessionChip icon={Clock3} label={`Est. Finish: ${data.estimatedFinishTime}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Camera}
                  title="Before Photo Preview"
                  subtitle="This image was uploaded before the service started."
                />

                <div className="mt-5 overflow-hidden rounded-[22px] border border-[#f2bfd4] bg-[#fff7fb]">
                  {effectiveBeforePhoto ? (
                    <div className="relative">
                      <img
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

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className={`rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f8_100%)] p-4 shadow-[0_12px_24px_rgba(236,72,153,0.06)] ${hasConfirmedDesign ? "" : "md:col-span-2"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                      Current Process
                    </p>
                    <div className="mt-3 space-y-3">
                      {Array.isArray(data.serviceBreakdown) && data.serviceBreakdown.length ? (
                        data.serviceBreakdown.map((service, index) => (
                          <div
                            key={service.id || `${service.name}-${index}`}
                            className="flex items-start justify-between gap-3 rounded-[16px] border border-[#f7d5e3] bg-white/90 px-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c694ad]">
                                Service {index + 1}
                              </p>
                              <p className="mt-1 break-words text-sm font-extrabold leading-6 text-[#ea4f93]">
                                {service.name}
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 rounded-full bg-[#f7efff] px-3 py-1 text-[11px] font-bold text-[#8b5cf6]">
                              {service.durationLabel || "--"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[16px] border border-[#f7d5e3] bg-white/90 px-3 py-3">
                          <p className="break-words text-sm font-extrabold leading-6 text-[#ea4f93]">
                            {data.serviceLabel}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {hasConfirmedDesign ? (
                    <div className="rounded-[18px] border border-[#f2bfd4] bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f8_100%)] p-4 shadow-[0_12px_24px_rgba(236,72,153,0.06)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                        Nail Service
                      </p>
                      <div className="mt-3 rounded-[16px] border border-[#f7d5e3] bg-white/90 px-3 py-3">
                        <p className="text-sm font-extrabold leading-6 text-[#ea4f93]">{data.designName}</p>
                      </div>
                      <div className="mt-4 border-t border-[#f7dce8] pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">
                          Estimate Time
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-[#3f2b3f]">{data.remainingTime}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-[18px] border border-[#f2bfd4] bg-[#fff6fa] p-4 md:col-span-2">
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
                  disabled={isMarkingServiceDone}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-4 text-sm font-extrabold text-white shadow-[0_16px_28px_rgba(236,72,153,0.25)]"
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
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={UserRound}
                  title="Customer & Service Summary"
                  subtitle="Final service context before closing this session."
                />

                <div className="mt-5 border-b border-[#f8e6ef] pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={data.customerAvatar}
                      alt={data.customerName}
                      className="h-14 w-14 rounded-full border border-[#f2bfd4] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-lg font-extrabold text-[#3f2b3f]">{data.customerName}</p>
                      <p className="mt-1 text-sm text-[#ea4f93]">{data.serviceLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <SummaryValue label="Staff Artist" value={data.staffArtist} />
                  {/* <SummaryValue label="Chair" value={data.chair} /> */}
                  <SummaryValue label="Start Time" value={data.appointmentTime} />
                  <SummaryValue label="Duration" value={data.estimatedDuration} accent />
                  {/* <SummaryValue label="Completed" value={data.completedAt} /> */}
                  <div className="md:col-span-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b59aab]">Service</p>
                    <div className="mt-3">
                      <ServiceSummaryValue
                        services={Array.isArray(data.serviceBreakdown) ? data.serviceBreakdown : []}
                        fallbackValue={data.serviceLabel}
                      />
                    </div>
                  </div>
                  {hasConfirmedDesign ? <SummaryValue label="Nail Design" value={data.designName} /> : null}
                </div>
              </article>

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
                      <Image
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
                            disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                            label={procedure.label}
                            onToggle={() => handleUpdateProcedureStatus(procedure, "Completed")}
                            trailing={
                              <button
                                type="button"
                                disabled={Boolean(procedureStatusUpdates[procedure.bookingProcedureId])}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleUpdateProcedureStatus(procedure, "Skipped");
                                }}
                                className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#f4c7d9] bg-[#fff4f8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d95a95] transition hover:bg-[#ffe8f2] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Skip
                              </button>
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

                {hasConfirmedDesign ? (
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
                ) : null}
              </article>

              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
                <SectionTitle
                  icon={Receipt}
                  title="Final Service Summary"
                  subtitle="Review the amount before handing over to payment flow."
                />

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Original Service Price</span>
                    <span className="font-bold text-[#3f2b3f]">{data.originalServicePrice}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Extra Service Fee</span>
                    <span className="font-bold text-[#3f2b3f]">{data.extraServiceFee}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">{data.discountLabel}</span>
                    <span className="font-bold text-emerald-600">{data.discountValue}</span>
                  </div>
                  <div className="border-t border-[#f5d9e6]" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-[#3f2b3f]">Total Amount</span>
                    <span className="text-base font-extrabold text-[#ea4f93]">{data.totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#a88a9d]">Remaining Balance</span>
                    <span className="font-extrabold text-[#6b46c1]">{data.remainingBalance}</span>
                  </div>
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
                    onClick={() =>
                      handleSessionAction("Customer review request can be sent after the final session handoff.")
                    }
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

                  <button
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
                  </button>

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
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-[linear-gradient(180deg,#ffe7ef_0%,#ffd9e6_100%)] px-4 py-3 text-sm font-bold text-[#d65b92] transition hover:bg-[#ffe1eb]"
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

      <ExtraServiceModal
        open={showExtraServiceModal}
        services={serviceCatalog}
        selectedServiceIds={selectedExtraServiceIds}
        searchValue={serviceSearchInput}
        isLoading={isLoadingServiceCatalog}
        isSaving={isSavingExtraService}
        meta={serviceCatalogMeta}
        onClose={handleCloseExtraServiceModal}
        onSearchChange={(event) => setServiceSearchInput(event.target.value)}
        onSearchSubmit={handleSearchExtraServices}
        onSelect={(serviceId) =>
          setSelectedExtraServiceIds((current) =>
            current.includes(serviceId)
              ? current.filter((item) => item !== serviceId)
              : [...current, serviceId],
          )
        }
        onPageChange={(page) => {
          if (page < 1 || page > (serviceCatalogMeta?.totalPages ?? 1)) {
            return;
          }

          setSelectedExtraServiceIds([]);
          setServiceCatalogPage(page);
        }}
        onConfirm={handleAddExtraService}
      />
    </section>
  );
}
