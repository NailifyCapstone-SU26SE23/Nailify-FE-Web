import {
  ArrowUp,
  CalendarClock,
  Check,
  CheckCheck,
  ClipboardList,
  ClipboardCheck,
  Eye,
  Palette,
  PencilLine,
  Search,
  Sparkles,
  Star,
  UserRound,
  X,
  Clock,
  Map, ChevronDown, ChevronUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { Table, List, Card, Image } from "antd";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ReadOnlyNailPreview } from "../../../../shared/components/common/ReadOnlyNailPreview";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { useQuery } from "@tanstack/react-query";
import { fetchStaffCustomerDetail, fetchLoyaltyTiers } from "../services/staffBookingService";

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return '!border-slate-200 !bg-slate-50 !text-slate-600';
    case 'Approved':
      return '!border-emerald-200 !bg-emerald-50 !text-emerald-600';
    case 'Rejected':
    case 'Cancelled':
      return '!border-red-200 !bg-red-50 !text-red-600';
    case 'CheckedIn':
      return '!border-purple-200 !bg-purple-50 !text-purple-600';
    case 'InProgress':
      return '!border-blue-200 !bg-blue-50 !text-blue-600';
    case 'ServiceCompleted':
      return '!border-yellow-200 !bg-yellow-50 !text-yellow-700';
    case 'Completed':
      return '!border-green-200 !bg-green-50 !text-green-700';
    case 'Repaired':
      return '!border-orange-200 !bg-orange-50 !text-orange-600';
    case 'ReschedulePending':
    case 'RescheduleSuggested':
      return '!border-indigo-200 !bg-indigo-50 !text-indigo-600';
    default:
      return '!border-[#f3ddab] !bg-[#fff8df] !text-[#d39a1d]';
  }
};

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

function ServiceInfoCard({ services = [], onOpenServiceProcedures = null }) {
  const hasProcedureAction = typeof onOpenServiceProcedures === "function";

  return (
    <article className="rounded-[16px] xl:col-span-3">

      {services.length ? (
        <div className="overflow-hidden rounded-[20px] border border-[#f2bfd4] bg-white">
          <div className={`hidden items-center gap-3 border-b border-[#f8dce8] bg-[linear-gradient(180deg,#fff8fc_0%,#fff2f7_100%)] px-5 py-3 md:grid ${hasProcedureAction ? "grid-cols-[minmax(0,1.55fr)_110px_150px_120px_120px]" : "grid-cols-[minmax(0,1.8fr)_110px_150px_120px]"}`}>
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
                className={`px-4 py-4 md:grid md:items-center md:gap-3 md:px-5 ${hasProcedureAction ? "md:grid-cols-[minmax(0,1.55fr)_110px_150px_120px_120px]" : "md:grid-cols-[minmax(0,1.8fr)_110px_150px_120px]"}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                    {service.detailLabel || `Service ${index + 1}`}
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
                            onSelect: () => onOpenServiceProcedures(service),
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
      ) : null}
    </article>
  );
}

ServiceInfoCard.propTypes = {
  onOpenServiceProcedures: PropTypes.func,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      bookingItemId: PropTypes.string,
      duration: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      detailLabel: PropTypes.string,
      nailServiceName: PropTypes.string,
      price: PropTypes.string,
      quantity: PropTypes.number,
      canViewProcedures: PropTypes.bool,
    }),
  ),
};

function formatVariantCurrency(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VND`;
}

function formatVariantDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return `${duration} min`;
}

function VariantDetailModal({ open, variantDetail, onClose }) {
  if (!open || !variantDetail) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1322]/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#f1cade] bg-white shadow-[0_30px_80px_rgba(63,43,63,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
          <div>
            <p className="text-[15px] font-bold uppercase tracking-[0.16em] text-pink-500">
              Nail Variant Detail
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-black">{variantDetail.name}</h3>

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
              <ReadOnlyNailPreview
                variantDetail={variantDetail}
                className="w-full"
                showHeader={false}
                showInstruction={false}
                showSurfaceMode={false}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <InfoCard label="Price" value={formatVariantCurrency(variantDetail.price)} note="" tone="success" />
                <InfoCard label="Duration" value={formatVariantDuration(variantDetail.duration)} note="" />
              </div>
            </div>

            <div className="space-y-5">

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[20px] border border-[#f3d5e2] bg-[#fff9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Nail Shape</p>
                  <div className="mt-3 flex items-start gap-3">
                    <Image
                      style={{ height: "40px", width: "40px", borderRadius: "20%", objectFit: "cover" }}
                      crossOrigin="anonymous"
                      src={variantDetail.nailShape?.imageUrl || variantDetail.imageUrl}
                      alt={variantDetail.nailShape?.name || "Nail shape"}
                      className="h-10 w-10 rounded-2xl border border-[#f4dbe7] object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-base font-extrabold capitalize text-[#3f2b3f]">
                        {variantDetail.nailShape?.name || "--"}
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
                  </div>
                </article>
              </div>

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
                          <div className="flex flex-row gap-2">
                            <Image
                              style={{ height: "40px", width: "40px", borderRadius: "20%", objectFit: "cover" }}
                              crossOrigin="anonymous"
                              src={item.component?.imageUrl || item.imageUrl}
                              alt={item.component?.name || "Component"}
                              className="h-10 w-10 rounded-2xl border border-[#f4dbe7] object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-sm font-extrabold text-[#3f2b3f]">
                                {item.component?.name || "--"}
                              </p>
                              <p className="mt-1 text-xs text-[#a88a9d]">
                                Type: {item.component?.componentType || "--"}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full border border-[#f2bfd4] bg-[#fff5f9] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                            Finger #{item.fingerIndex ?? "--"}
                          </span>
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
        crossOrigin="anonymous"
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
  isCancelledBooking = false,
  onDelete,
  onOpenDesignStudio,
  onOpenUpdateBooking,
  onOpenServiceProcedures,
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
    (
      String(data.design.name || "").trim() && 
      String(data.design.name || "").trim() !== "--" &&
      String(data.design.name || "").trim() !== "Selected design not specified"
    ),
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

  const [customerExpanded, setCustomerExpanded] = useState(true);
  const [bookingExpanded, setBookingExpanded] = useState(true);

  const customerId = data?.customerId || data?.customer?.id || data?.customer?.userId || data?.customer?.customerId;

  const { data: customerData } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      return await fetchStaffCustomerDetail(customerId);
    },
    enabled: !!customerId,
  });

  const { data: loyaltyTiers } = useQuery({
    queryKey: ['loyaltyTiers'],
    queryFn: async () => {
      return await fetchLoyaltyTiers();
    }
  });

  const { customerTier, customerPoints } = useMemo(() => {
    const points = customerData?.loyaltyPoint || 0;
    if (!loyaltyTiers?.length) return { customerTier: null, customerPoints: points };

    const tier = loyaltyTiers.find(t =>
      points >= t.minLifetimePoints &&
      (t.maxLifetimePoints === null || points <= t.maxLifetimePoints)
    );
    return { customerTier: tier, customerPoints: points };
  }, [customerData, loyaltyTiers]);

  return (
    <section className="flex min-h-full flex-col gap-6 bg-slate-50/50 p-2 sm:p-6 lg:p-8  bg-[#fff9fb]
                      bg-[radial-gradient(circle_at_top_right,rgba(255,191,73,.55),transparent_38%),radial-gradient(circle_at_top_left,rgba(255,121,198,.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,163,196,.45),transparent_35%),linear-gradient(to_right,#f3c7db_1px,transparent_1px),linear-gradient(to_bottom,#f3c7db_1px,transparent_1px)]">
      <div className="mt-2 space-y-6">
        <article className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-xl md:p-8 transition-all hover:shadow-md">
          {/* <div className="flex items-center gap-3 border-b border-[#fdebf3] pb-4 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2]">
              <UserRound size={16} className="text-[#ea4f93]" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">Customer Information</h2>
          </div> */}
          <div className="mb-6 flex items-center justify-between border-b border-[#fdebf3] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2]">
                <UserRound size={16} className="text-[#ea4f93]" />
              </div>

              <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">
                Customer Information
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setCustomerExpanded((prev) => !prev)}
              className="
                        flex h-9 w-9 items-center justify-center
                        rounded-full
                        border border-[#f6d5e2]
                        bg-white/70
                        text-[#ea4f93]
                        transition-all
                        duration-300
                        hover:scale-105
                        hover:bg-[#fff3f8]
                        hover:shadow-md
                      ">
              {customerExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-500 ${customerExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
              }`}
          >
            <div className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <img
                  crossOrigin="anonymous"
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
                    {customerTier ? (
                      <span
                        className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold items-center gap-1"
                        style={{
                          backgroundColor: customerTier.backgroundColor + '15',
                          borderColor: customerTier.backgroundColor + '40',
                          color: customerTier.backgroundColor
                        }}
                      >
                        <Star size={11} className="fill-current" />
                        {customerTier.name} ({customerPoints} pts)
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-[10px] font-bold text-gray-500 items-center gap-1">
                        <Star size={11} className="fill-current" />
                        {customerPoints} pts
                      </span>
                    )}
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
          </div>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 md:p-8 backdrop-blur-2xl shadow-sm transition-all hover:shadow-md">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-[#ffb4d6]/30 to-[#e4c1f9]/30 blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-[#ffecd2]/40 to-[#fcb69f]/40 blur-[60px]" />

          <div className="relative z-10">
            <div className="mb-6 flex items-center justify-between border-b border-[#fdebf3] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2]">
                  <CalendarClock size={16} className="text-[#ea4f93]" />
                </div>

                <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">
                  Booking Information
                </h2>


              </div>
              <div className="flex items-center gap-2">
                <Tag className={`m-0 ${getStatusColor(data.statusLabel)}`}>
                  <Clock size={11} className="mr-1 inline-block fill-current" />
                  {data.statusLabel}
                </Tag>
                <button
                  type="button"
                  onClick={() => setBookingExpanded((prev) => !prev)}
                  className="
                          flex h-9 w-9 items-center justify-center
                          rounded-full
                          border border-[#f6d5e2]
                          bg-white/70
                          text-[#ea4f93]
                          transition-all duration-300
                          hover:scale-105
                          hover:bg-[#fff3f8]
                          hover:shadow-md
                        ">
                  {bookingExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronUp size={18} />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ${bookingExpanded
                ? "max-h-[2500px] opacity-100"
                : "max-h-0 opacity-0"
                }`}
            >
              <div className="mt-4">
                {data.bookingInfo.find(item => item.label === "Service") && (
                  <div className="mb-6">
                    <ServiceInfoCard
                      services={data.bookingInfo.find(item => item.label === "Service").services}
                      onOpenServiceProcedures={onOpenServiceProcedures}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                  {data.bookingInfo.filter(item => item.label !== "Service").map((item) => (
                    <div key={item.label} className="drop-shadow-sm transition-transform hover:-translate-y-1">
                      <div
                        className="flex h-full flex-col justify-between bg-white p-4 pb-8 md:p-5 md:pb-9"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%)" }}
                      >
                        <div className="text-[10px] font-black text-[#cbb3c0] uppercase tracking-[0.18em]">
                          {item.label}
                        </div>
                        <div className="mt-3">
                          <div className={`text-[15px] font-black tracking-tight ${item.tone === 'success' ? 'text-[#059669]' : 'text-[#3f2a3a]'}`}>
                            {item.value}
                          </div>
                          <div className="mt-1.5 h-[16px] text-[11px] font-bold text-[#a68b98]">
                            {item.note ?? ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {hasSelectedNailDesign ? (
              <article className="relative overflow-hidden rounded-[24px] border border-[#fdebf3] bg-gradient-to-b from-white/95 to-[#fffafb]/95 p-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(236,72,153,0.08)]">
                {/* Decorative Orbs */}
                <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-gradient-to-br from-[#ffb4d6]/20 to-[#e4c1f9]/20 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-gradient-to-tr from-[#ffecd2]/30 to-[#fcb69f]/30 blur-[80px]" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 border-b border-[#fdebf3] pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2] shadow-inner">
                        <Sparkles size={18} className="text-[#ea4f93]" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">Current Selected Nail Design</h2>
                    </div>
                    {canViewVariantDetail ? (
                      <button
                        type="button"
                        onClick={() => setIsVariantModalOpen(true)}
                        className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] shadow-sm transition-all hover:scale-105 hover:bg-[#fff0f6] hover:shadow-md"
                        title="View nail detail"
                      >
                        <Eye size={16} className="transition-transform group-hover:scale-110" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <div className="relative mx-auto w-full max-w-[320px] lg:mx-0 lg:w-[45%] lg:max-w-none shrink-0">
                      {/* Glowing backdrop */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#ffb4d6]/30 to-[#e4c1f9]/30 blur-2xl rounded-full scale-90" />
                      <div className="relative rounded-[24px] bg-white/60 backdrop-blur-md border border-white shadow-xl shadow-pink-500/5">
                        {data.design.variantDetail ? (
                          <ReadOnlyNailPreview
                            variantDetail={data.design.variantDetail}
                            className="w-full"
                            showHeader={false}
                            showInstruction={false}
                          />
                        ) : (
                          <img
                            crossOrigin="anonymous"
                            src={data.design.image}
                            alt={data.design.name}
                            className="aspect-[4/3] w-full rounded-[18px] object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-6 pt-2">
                      <div>
                        <h3 className="bg-gradient-to-br from-[#ea4f93] to-[#ff8fbb] bg-clip-text text-3xl md:text-[2.2rem] font-black text-transparent drop-shadow-sm tracking-tight leading-none">
                          {data.design.name}
                        </h3>
                      </div>

                      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 rounded-[24px] bg-white/50 p-6 border border-white shadow-sm backdrop-blur-md">
                        {data.design.details
                          .filter((item) => {
                            if (item.label === "Service") return false;
                            if (item.label === "Customer Design") {
                              const normalizedValue = String(item.value || "").trim();
                              return normalizedValue && normalizedValue !== "--";
                            }
                            return true;
                          })
                          .map((item) => (
                            <div key={item.label} className="group">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d67b9f] mb-1.5 flex items-center gap-1.5 transition-colors group-hover:text-[#ea4f93]">
                                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]"></span>
                                {item.label}
                              </p>
                              <p className="text-[15px] font-semibold text-gray-600 tracking-tight">{item.value}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            {!isCancelledBooking && !isPendingBooking && !isServiceInProgress && !isServiceCompleted ? (
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2] shadow-inner">
                    <Search size={18} className="text-[#ea4f93]" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">Customer Consultation</h2>
                </div>
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

            {!isCancelledBooking && !isPendingBooking && !isServiceCompleted ? (
              <article className="rounded-[22px] border border-[#f3d5e2] bg-white p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcce0] to-[#f4d6e2] shadow-inner">
                    <ClipboardCheck size={18} className="text-[#ea4f93]" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#ea4f93]">Final Confirmation Checklist</h2>
                </div>
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
                      Add service
                    </button>

                  </div>
                ) : null}
              </article>
            ) : null}
          </div>

          <aside className="space-y-4 border-t border-[#f3d5e2] bg-transparent pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
            {!isCancelledBooking && !isPendingBooking && !isServiceCompleted ? (
              <article className="rounded-[18px] border border-[#f3d5e2] bg-white p-4 ">
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

      <VariantDetailModal
        open={isVariantModalOpen}
        variantDetail={data.design.variantDetail}
        onClose={() => setIsVariantModalOpen(false)}
      />
    </section>
  );
}

StaffBookingConsultationDetail.propTypes = {
  isCancelledBooking: PropTypes.bool,
  data: PropTypes.shape({
    artistInitials: PropTypes.string.isRequired,
    bookingCode: PropTypes.string.isRequired,
    bookingInfo: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        note: PropTypes.string,
        services: PropTypes.arrayOf(
          PropTypes.shape({
            bookingItemId: PropTypes.string,
            duration: PropTypes.string,
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string,
            detailLabel: PropTypes.string,
            nailServiceName: PropTypes.string,
            price: PropTypes.string,
            quantity: PropTypes.number,
            canViewProcedures: PropTypes.bool,
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
  onOpenServiceProcedures: PropTypes.func,
  onOpenUpdateBooking: PropTypes.func.isRequired,
  onStaffNoteChange: PropTypes.func.isRequired,
  onStartServiceSession: PropTypes.func.isRequired,
};
