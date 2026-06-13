import { CalendarClock, PencilLine, Save, Trash2, X } from "lucide-react";
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
  getStaffBookingExperienceById,
} from "../services/mockBookings";
import { getBookingRoleFromPath } from "../utils/bookingMapper";
import { ROLES } from "../../../../shared/constants/roles";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";

export function BookingDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const role = useMemo(
    () => getBookingRoleFromPath(location.pathname),
    [location.pathname],
  );
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const initialBooking = getMockBookingById(bookingId);
  const [formValues, setFormValues] = useState(initialBooking);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(
    role !== ROLES.staff && Boolean(location.state?.requestDelete),
  );
  const staffActionMessage = useMemo(() => {
    const action = location.state?.staffAction;

    if (role !== ROLES.staff || !action) {
      return "";
    }

    return {
      complete: "Mock complete action opened. Review the checklist before marking this service done.",
      delete: "Mock delete requested from the action menu. Use Back to Queue if you want to leave this booking.",
      notes: "Staff notes panel is ready for review. This remains a UI-only mock flow.",
      start: "Mock start action opened. Confirm the design and proceed to service when ready.",
    }[action] ?? "";
  }, [location.state, role]);
  const deleteRequested = role !== ROLES.staff && Boolean(location.state?.requestDelete);

  useEffect(() => {
    if (!staffActionMessage && !deleteRequested) {
      return;
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [deleteRequested, location.pathname, navigate, staffActionMessage]);

  if (!initialBooking) {
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
    setFlashMessage("Mock update completed. Changes are local to this booking detail screen.");
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
        flashMessage: `Mock delete completed for ${formValues.customerName || formValues.id}.`,
      },
    });
  };

  const handleOpenDesignStudio = () => {
    navigate(getStaffBookingDesignStudioRoute(bookingId));
  };

  if (role === ROLES.staff) {
    const staffExperience = getStaffBookingExperienceById(bookingId) ?? {
      bookingCode: initialBooking.id.replace("BKG", "BK"),
      statusLabel: initialBooking.status,
      artistInitials: "L",
      steps: [
        { key: "detail", label: "Booking Detail", state: "complete" },
        { key: "consult", label: "Consultation", state: "current" },
        { key: "confirm", label: "Confirm Design", state: "upcoming" },
        { key: "start", label: "Start Service", state: "upcoming" },
      ],
      customer: {
        name: initialBooking.customerName,
        phone: initialBooking.customerPhone,
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
        memberTier: "Returning Guest",
        facts: [
          { label: "Last Booking", value: initialBooking.createdAt.split(" ")[0] },
          { label: "Total Visits", value: "6 sessions" },
          { label: "Preferred Shape", value: "Oval / Almond" },
          { label: "Preferred Length", value: "Short to Medium" },
        ],
        allergyNote: "No allergy note on file. Confirm product sensitivity before service.",
        preferences: "Minimal design, clean finish, neutral or pastel palette",
      },
      bookingInfo: [
        { label: "Service", value: initialBooking.service, note: initialBooking.notes || "No add-on recorded" },
        { label: "Appointment", value: initialBooking.bookingTime, note: initialBooking.bookingDate },
        { label: "Duration", value: initialBooking.duration, note: "Schedule confirmed" },
        { label: "Assigned Chair", value: "Chair 02", note: "Standard Section" },
        { label: "Payment", value: initialBooking.paymentStatus, note: initialBooking.total },
        { label: "Staff Artist", value: initialBooking.staffName, note: "Assigned artist" },
      ],
      design: {
        name: "Consultation Pending",
        image:
          "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80",
        details: [
          { label: "Shape", value: "To be confirmed" },
          { label: "Length", value: "To be confirmed" },
          { label: "Color", value: "To be confirmed" },
          { label: "Finish", value: "To be confirmed" },
          { label: "Decoration", value: "To be confirmed" },
          { label: "Base", value: "Gel or classic" },
        ],
        tags: [
          { label: "Consultation", className: "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]" },
        ],
      },
      sessionStatus: [
        { label: "Status", value: initialBooking.status },
        { label: "Staff Artist", value: initialBooking.staffName },
        { label: "Chair", value: "Chair 02" },
        { label: "Time Slot", value: `${initialBooking.bookingTime} - Scheduled` },
      ],
      customerHistory: {
        favoriteStyles: [
          { label: "Minimal", className: "border-[#cbe0ff] bg-[#f1f7ff] text-[#4b80e0]" },
          { label: "Pastel", className: "border-[#d9f2c8] bg-[#f3fce9] text-[#61a437]" },
        ],
        previousShapes: "No history synced yet",
        lastUpload: {
          title: "Reference pending",
          date: initialBooking.createdAt.split(" ")[0],
          image:
            "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=240&q=80",
        },
      },
      suggestedDesigns: [
        {
          name: "Soft Nude",
          meta: "Quick service - Neutral finish",
          image:
            "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=240&q=80",
        },
      ],
      staffNotes: [
        { label: "Customer Requests", value: initialBooking.notes || "No customer notes yet." },
        { label: "Design Adjustments", value: "Capture preferred shape and finish during consultation." },
        { label: "Notes Before Service", value: "Verify timing, confirm final design, then start session." },
      ],
      checklist: [
        { label: "Customer confirmed nail design", checked: false },
        { label: "Total price confirmed with customer", checked: false },
        { label: "Estimated duration confirmed", checked: false },
        { label: "Service notes captured", checked: false },
      ],
    };

    const handleOpenServiceSession = () => {
      navigate(getStaffBookingServiceSessionRoute(bookingId), {
        state: {
          serviceSession: {
            bookingCode: staffExperience.bookingCode,
            customerName: staffExperience.customer.name,
            customerPhone: staffExperience.customer.phone,
            customerAvatar: staffExperience.customer.avatar,
            serviceLabel: initialBooking.service,
            staffArtist: initialBooking.staffName,
            chair: "Chair 02",
            appointmentTime: `${initialBooking.bookingTime} - ${initialBooking.duration}`,
            estimatedDuration: initialBooking.duration,
            designName: staffExperience.design.name,
            totalPrice: initialBooking.total,
            backRoute: location.pathname,
            designUpdateRoute: getStaffBookingDesignStudioRoute(bookingId),
            confirmations: [
              "Customer identity confirmed",
              "Service design confirmed",
              "Price confirmed",
              "Before photo uploaded",
            ],
          },
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
          onDelete={handleDelete}
          onOpenDesignStudio={handleOpenDesignStudio}
          onSave={handleSave}
          onStartServiceSession={handleOpenServiceSession}
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
