import { CalendarClock, LoaderCircle, PencilLine, RefreshCcw, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { BookingFormFields } from "../components/BookingFormFields";
import { BookingHeroCard } from "../components/BookingHeroCard";
import { BookingSnapshotCard } from "../components/BookingSnapshotCard";
import { StaffBookingConsultationDetail } from "../../../staff/bookings/components/StaffBookingConsultationDetail";
import {
  BOOKING_ROLE_CONFIG,
  getMockBookingById,
} from "../services/mockBookings";
import { getBookingRoleFromPath } from "../utils/bookingMapper";
import { ROLES } from "../../../../shared/constants/roles";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import {
  buildStaffServiceSessionPayload,
  fetchStaffBookingDetail,
  fetchStaffCustomerDetail,
  fetchStaffNailVariantDetail,
  formatBookingCode,
  formatCurrency,
  formatTimeValue,
} from "../../../staff/bookings/services/staffBookingService";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80";
const DEFAULT_DESIGN_IMAGE =
  "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80";
const DEFAULT_UPLOAD_IMAGE =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=240&q=80";

function formatStaffDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatAppointmentEndTime(startTime, durationMinutes) {
  const normalizedStartTime = String(startTime || "").trim();
  const normalizedDuration = Number(durationMinutes || 0);

  if (!normalizedStartTime) {
    return "--";
  }

  const [hoursText = "0", minutesText = "0"] = normalizedStartTime.split(":");
  const baseDate = new Date();
  baseDate.setHours(Number(hoursText), Number(minutesText), 0, 0);

  if (Number.isNaN(baseDate.getTime())) {
    return "--";
  }

  const endDate = new Date(baseDate.getTime() + Math.max(0, normalizedDuration) * 60000);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(endDate);
}

function formatTimeRange(startTime, durationMinutes) {
  const appointmentStartTime = formatTimeValue(startTime);
  const appointmentEndTime = formatAppointmentEndTime(startTime, durationMinutes);

  if (appointmentStartTime === "--" || appointmentEndTime === "--") {
    return "--";
  }

  return `${appointmentStartTime} - ${appointmentEndTime}`;
}

function buildDefaultStaffNotes(booking) {
  const serviceNames = booking?.bookingItems?.map((item) => item.serviceName).filter(Boolean).join(", ");

  return [
    {
      label: "Customer Requests",
      value: booking?.bookingItems?.find((item) => item.customerNailName)?.customerNailName || "No customer note from API.",
    },
    {
      label: "Design Adjustments",
      value: booking?.bookingItems?.find((item) => item.nailVariantName)?.nailVariantName || "Capture final design adjustments during consultation.",
    },
    {
      label: "Notes Before Service",
      value: serviceNames || "Verify services, confirm timing, then start session.",
    },
  ];
}

function buildStaffExperienceFromBooking(booking, staffNotesDraft, nailVariantDetail, customerDetail) {
  const items = booking?.bookingItems ?? [];
  const mainItem = items[0] ?? null;
  const bookingCode = formatBookingCode(booking?.bookingId);
  const startTime = formatTimeValue(booking?.startTime);
  const totalDuration = booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--";
  const timeRange = formatTimeRange(booking?.startTime, booking?.totalDuration);
  const serviceNames = items.map((item) => item.serviceName).filter(Boolean);
  const designImage =
    mainItem?.customerNailImageUrl || booking?.checkInImageUrl || booking?.checkOutImagesUrl || DEFAULT_DESIGN_IMAGE;
  const requestedDesign = mainItem?.customerNailName || mainItem?.nailVariantName || "Selected design not specified";
  const resolvedVariantName = nailVariantDetail?.name || mainItem?.nailVariantName || "--";
  const resolvedDesignImage = nailVariantDetail?.imageUrl || designImage;
  const componentSummary = nailVariantDetail?.nailComponents?.length
    ? `${nailVariantDetail.nailComponents.length} component(s)`
    : "--";
  const customerDisplayName =
    customerDetail?.fullName ||
    booking?.customerName ||
    "--";
  const customerPhone = customerDetail?.phone || "--";
  const customerAvatar = customerDetail?.avatarUrl || DEFAULT_AVATAR;
  const customerMemberTier = customerDetail?.role || "Customer";
  const customerStatus = customerDetail?.status || booking?.status || "--";

  return {
    bookingCode,
    statusLabel: booking?.status || "Pending",
    artistInitials: (booking?.artistName || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    steps: [
      { key: "detail", label: "Booking Detail", state: "complete" },
      { key: "consult", label: "Consultation", state: "current" },
      { key: "confirm", label: "Confirm Design", state: "upcoming" },
      { key: "start", label: "Start Service", state: "upcoming" },
    ],
    customer: {
      name: customerDisplayName,
      phone: customerPhone,
      avatar: customerAvatar,
      memberTier: customerMemberTier,
      facts: [
        { label: "Salon", value: booking?.salonName || "--" },
        { label: "Total Services", value: String(items.length || 0) },
        { label: "Status", value: customerStatus },
      ],
      allergyNote: customerDetail?.email || "--",
      preferences: requestedDesign || "--",
    },
    bookingInfo: [
      {
        label: "Service",
        value: serviceNames[0] || "--",
        note: serviceNames.length > 1 ? `+${serviceNames.length - 1} more service(s)` : requestedDesign,
      },
      {
        label: "Appointment",
        value: startTime,
        note: formatStaffDate(booking?.bookingDate),
      },
      {
        label: "Duration",
        value: timeRange,
        note: totalDuration,
      },
      {
        label: "Total Price",
        value: formatCurrency(booking?.totalPrice),
        note: `Status: ${booking?.status || "--"}`,
        tone: "success",
      },
      {
        label: "Salon",
        value: booking?.salonName || "--",
        note: booking?.status || "--",
      },
      {
        label: "Staff Artist",
        value: booking?.artistName || "--",
        note: serviceNames[0] || "--",
      },
    ],
    design: {
      name: nailVariantDetail?.name || requestedDesign,
      image: resolvedDesignImage,
      details: [
        { label: "Service", value: serviceNames[0] || "--" },
        { label: "Variant", value: resolvedVariantName },
        { label: "Shape", value: nailVariantDetail?.nailShape?.name || "--" },
        { label: "Surface", value: nailVariantDetail?.nailSurface?.name || "--" },
        { label: "Customer Design", value: mainItem?.customerNailName || "--" },
        { label: "Duration", value: timeRange },
        { label: "Price", value: nailVariantDetail?.priceLabel || formatCurrency(booking?.totalPrice) },
        { label: "Components", value: componentSummary },
      ],
      tags: [
        { label: booking?.status || "Pending", className: "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]" },
        { label: booking?.salonName || "Salon", className: "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]" },
      ],
    },
    sessionStatus: [
      { label: "Status", value: booking?.status || "--" },
      { label: "Staff Artist", value: booking?.artistName || "--" },
      { label: "Salon", value: booking?.salonName || "--" },
      { label: "Time Slot", value: timeRange },
    ],
    customerHistory: {
      favoriteStyles: serviceNames.length
        ? serviceNames.slice(0, 3).map((label, index) => ({
          label,
          className: [
            "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]",
            "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]",
            "border-[#cbe0ff] bg-[#f1f7ff] text-[#4b80e0]",
          ][index % 3],
        }))
        : [{ label: "--", className: "border-[#f0d8e3] bg-white text-[#6f5c6b]" }],
      previousShapes: mainItem?.nailVariantName || "--",
      lastUpload: {
        title: mainItem?.customerNailName || "Reference unavailable",
        date: formatStaffDate(booking?.bookingDate),
        image: mainItem?.customerNailImageUrl || DEFAULT_UPLOAD_IMAGE,
      },
    },
    suggestedDesigns: (items.length ? items : [{ serviceName: "--", nailVariantName: "--", customerNailImageUrl: DEFAULT_DESIGN_IMAGE }]).slice(0, 3).map((item) => ({
      name: item.customerNailName || item.serviceName || "--",
      meta: `${item.nailVariantName || "--"} | ${item.duration ? formatDurationMinutes(item.duration) : "--"}`,
      image: item.customerNailImageUrl || DEFAULT_DESIGN_IMAGE,
    })),
    staffNotes: staffNotesDraft,
    checklist: [
      { label: "Booking detail loaded from API", checked: true },
      { label: "Artist assigned to booking", checked: Boolean(booking?.artistName) },
      { label: "Customer design reference available", checked: Boolean(mainItem?.customerNailImageUrl) },
      { label: "Service items captured", checked: items.length > 0 },
    ],
  };
}

export function BookingDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const role = useMemo(
    () => getBookingRoleFromPath(location.pathname),
    [location.pathname],
  );
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const isStaffRole = role === ROLES.staff;
  const initialBooking = isStaffRole ? null : getMockBookingById(bookingId);
  const [formValues, setFormValues] = useState(initialBooking);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCurrentDesignConfirmed, setIsCurrentDesignConfirmed] = useState(false);
  const [staffBookingDetail, setStaffBookingDetail] = useState(null);
  const [staffCustomerDetail, setStaffCustomerDetail] = useState(null);
  const [staffNailVariantDetail, setStaffNailVariantDetail] = useState(null);
  const [isStaffLoading, setIsStaffLoading] = useState(isStaffRole);
  const [staffLoadError, setStaffLoadError] = useState("");
  const [staffNotesDraft, setStaffNotesDraft] = useState([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(
    role !== ROLES.staff && Boolean(location.state?.requestDelete),
  );
  const staffActionMessage = useMemo(() => {
    const action = location.state?.staffAction;

    if (!isStaffRole || !action) {
      return "";
    }

    return {
      complete: "Review the checklist before marking this service done.",
      delete: "Use Back to Queue if you want to leave this booking.",
      notes: "Staff notes are ready for review.",
      start: "Confirm the design and proceed to service when ready.",
    }[action] ?? "";
  }, [isStaffRole, location.state]);
  const deleteRequested = role !== ROLES.staff && Boolean(location.state?.requestDelete);

  useEffect(() => {
    if (!staffActionMessage && !deleteRequested) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [deleteRequested, location.pathname, navigate, staffActionMessage]);

  useEffect(() => {
    if (!isStaffRole || !bookingId) {
      return;
    }

    let isMounted = true;

    const loadBooking = async () => {
      setIsStaffLoading(true);
      setStaffLoadError("");

      try {
        const data = await fetchStaffBookingDetail(bookingId);

        if (!isMounted) {
          return;
        }

        setStaffBookingDetail(data);
        setStaffNotesDraft(buildDefaultStaffNotes(data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load booking detail.";
        setStaffLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsStaffLoading(false);
        }
      }
    };

    void loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId, isStaffRole]);

  useEffect(() => {
    if (!isStaffRole) {
      return;
    }

    const customerId = String(staffBookingDetail?.customerId || "").trim();

    if (!customerId) {
      setStaffCustomerDetail(null);
      return;
    }

    let isMounted = true;

    const loadCustomerDetail = async () => {
      try {
        const detail = await fetchStaffCustomerDetail(customerId);

        if (isMounted) {
          setStaffCustomerDetail(detail);
        }
      } catch {
        if (isMounted) {
          setStaffCustomerDetail(null);
        }
      }
    };

    void loadCustomerDetail();

    return () => {
      isMounted = false;
    };
  }, [isStaffRole, staffBookingDetail?.customerId]);

  useEffect(() => {
    if (!isStaffRole) {
      return;
    }

    const variantId = Number(staffBookingDetail?.bookingItems?.[0]?.nailVariantId || 0);

    if (!Number.isInteger(variantId) || variantId <= 0) {
      setStaffNailVariantDetail(null);
      return;
    }

    let isMounted = true;

    const loadNailVariantDetail = async () => {
      try {
        const detail = await fetchStaffNailVariantDetail(variantId);

        if (isMounted) {
          setStaffNailVariantDetail(detail);
        }
      } catch {
        if (isMounted) {
          setStaffNailVariantDetail(null);
        }
      }
    };

    void loadNailVariantDetail();

    return () => {
      isMounted = false;
    };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  if (!isStaffRole && !initialBooking) {
    return <Navigate to={roleConfig.listRoute} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    setShowSaveConfirm(false);
    setIsEditing(false);
    setFlashMessage(
      isStaffRole
        ? "Booking detail updates are stored in the current UI session."
        : "Mock update completed. Changes are local to this booking detail screen.",
    );
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialBooking);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    navigate(roleConfig.listRoute, {
      state: {
        flashMessage: isStaffRole
          ? `Returned ${staffBookingDetail?.customerName || "this booking"} to the queue.`
          : `Mock delete completed for ${formValues.customerName || formValues.id}.`,
      },
    });
  };

  const handleOpenDesignStudio = () => {
    navigate(getStaffBookingDesignStudioRoute(bookingId), {
      state: {
        designStudio: {
          booking: {
            id: bookingId,
          },
          bookingCode: staffBookingDetail ? formatBookingCode(staffBookingDetail.bookingId) : "",
          customerName: staffBookingDetail?.customerName || formValues?.customerName || "--",
          staffName: staffBookingDetail?.artistName || "--",
          statusLabel: staffBookingDetail?.status || "Pending",
          selectedDesignName:
            staffBookingDetail?.bookingItems?.[0]?.customerNailName ||
            staffBookingDetail?.bookingItems?.[0]?.nailVariantName ||
            staffBookingDetail?.bookingItems?.[0]?.serviceName ||
            "--",
          selectedDesignImage:
            staffBookingDetail?.bookingItems?.[0]?.customerNailImageUrl ||
            staffBookingDetail?.checkInImageUrl ||
            staffBookingDetail?.checkOutImagesUrl ||
            DEFAULT_DESIGN_IMAGE,
          totalDuration: staffBookingDetail?.totalDuration || 0,
        },
      },
    });
  };

  const handleConfirmCurrentDesign = () => {
    if (isCurrentDesignConfirmed) {
      return;
    }

    setIsCurrentDesignConfirmed(true);
    setFlashMessage("Current nail design has been confirmed for this booking.");
    toast.success("Current design confirmed for this booking.");
  };

  const handleChooseAnotherDesign = () => {
    handleOpenDesignStudio();
  };

  const handleStaffNoteChange = (label, value) => {
    setStaffNotesDraft((current) => current.map((item) => (
      item.label === label ? { ...item, value } : item
    )));
  };

  if (isStaffRole) {
    if (isStaffLoading) {
      return (
        <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
            <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
            Loading booking detail...
          </div>
        </section>
      );
    }

    if (staffLoadError || !staffBookingDetail) {
      return (
        <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
          <p className="text-lg font-extrabold text-[#412643]">Booking detail unavailable</p>
          <p className="mt-2 text-sm text-[#b38a9f]">{staffLoadError || "This booking could not be loaded."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <RefreshCcw size={14} />
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate(roleConfig.listRoute)}
              className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              Back to bookings
            </button>
          </div>
        </section>
      );
    }

    const baseStaffExperience = buildStaffExperienceFromBooking(
      staffBookingDetail,
      staffNotesDraft,
      staffNailVariantDetail,
      staffCustomerDetail,
    );
    const staffExperience = isCurrentDesignConfirmed
      ? {
        ...baseStaffExperience,
        steps: baseStaffExperience.steps.map((step) => {
          if (step.key === "consult") {
            return { ...step, state: "complete" };
          }

          if (step.key === "confirm") {
            return { ...step, state: "current" };
          }

          return step;
        }),
        design: {
          ...baseStaffExperience.design,
          tags: [
            ...baseStaffExperience.design.tags,
            {
              label: "Confirmed",
              className: "border-[#cdeedb] bg-[#eefcf4] text-[#16975f]",
            },
          ],
        },
        checklist: baseStaffExperience.checklist.map((item, index) => (
          index === 0 ? { ...item, checked: true } : item
        )),
      }
      : baseStaffExperience;

  const handleOpenServiceSession = () => {
    if (!isCurrentDesignConfirmed) {
      toast.error("Confirm Current Design before starting the service session.");
      return;
    }

      navigate(getStaffBookingServiceSessionRoute(bookingId), {
        state: {
          serviceSession: buildStaffServiceSessionPayload(staffBookingDetail, {
            backRoute: location.pathname,
            designUpdateRoute: getStaffBookingDesignStudioRoute(bookingId),
          }),
        },
      });
    };

    return (
      <>
        {flashMessage || staffActionMessage ? (
          <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
            {staffActionMessage || flashMessage}
          </div>
        ) : null}
        <StaffBookingConsultationDetail
          data={staffExperience}
          isCurrentDesignConfirmed={isCurrentDesignConfirmed}
          onChooseAnotherDesign={handleChooseAnotherDesign}
          onConfirmCurrentDesign={handleConfirmCurrentDesign}
          onDelete={handleDelete}
          onOpenDesignStudio={handleOpenDesignStudio}
          onSave={handleSave}
          onStaffNoteChange={handleStaffNoteChange}
          onStartServiceSession={() => void handleOpenServiceSession()}
        />
      </>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4">
      <BookingHeroCard
        backLabel="Back to booking list"
        backTo={roleConfig.listRoute}
        badge={roleConfig.detailBadge}
        title={formValues.customerName}
        description={roleConfig.detailDescription}
        panelIcon={<CalendarClock size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="All actions here are UI-only and do not persist outside this feature."
      />

      {flashMessage || staffActionMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {staffActionMessage || flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <BookingFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
              >
                <PencilLine size={16} />
                <span>Edit booking</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>Delete booking</span>
            </button>
          </div>
        </article>

        <BookingSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Booking Changes"
        subtitle="This will update the appointment in the current mock booking flow."
        description="Confirm to apply the latest edits to this booking."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.customerName || "Booking detail", formValues.service || "Service pending", formValues.branch || "Branch pending"]}
        details={[
          { label: "Appointment Date", value: formValues.date || "No date selected" },
          { label: "Appointment Time", value: formValues.time || "No time selected" },
        ]}
        warnings={["This mock update changes the UI flow only and does not persist outside this screen."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Discard Booking Edits"
        subtitle="You are about to leave edit mode without saving."
        description="Unsaved updates to this booking will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: "Editing Mode", value: "Booking detail" },
          { label: "Result", value: "Revert to last loaded values" },
        ]}
        warnings={["Any unsaved changes to customer, service, and schedule details will be lost."]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Booking"
        subtitle="This will remove the booking from the current mock booking flow."
        description={`You are about to delete ${formValues.customerName || "this booking"}. This action cannot be undone.`}
        confirmText="Delete Booking"
        cancelText="Keep Booking"
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: formValues.customerName || "Booking record",
          meta: `${formValues.service || "Service pending"} • ${formValues.branch || "Branch pending"}`,
          note: `${formValues.date || "No date"} • ${formValues.time || "No time"}`,
        }}
        warnings={["This mock delete updates the navigation flow only and does not persist outside this feature."]}
      />
    </section>
  );
}
