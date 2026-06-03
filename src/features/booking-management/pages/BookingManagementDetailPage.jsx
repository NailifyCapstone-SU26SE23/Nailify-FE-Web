import { CalendarClock, PencilLine, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ROLES } from "../../../shared/constants/roles";
import { BookingManagementFormFields } from "../components/BookingManagementFormFields";
import { BookingManagementHeroCard } from "../components/BookingManagementHeroCard";
import { BookingManagementSnapshotCard } from "../components/BookingManagementSnapshotCard";
import {
  BOOKING_ROLE_CONFIG,
  getMockBookingById,
} from "../services/mockBookings";

function getRoleFromPath(pathname) {
  if (pathname.startsWith("/admin")) {
    return ROLES.admin;
  }

  if (pathname.startsWith("/manager")) {
    return ROLES.manager;
  }

  return ROLES.staff;
}

export function BookingManagementDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const role = useMemo(() => getRoleFromPath(location.pathname), [location.pathname]);
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const initialBooking = getMockBookingById(bookingId);
  const [formValues, setFormValues] = useState(initialBooking);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing(false);
    setFlashMessage("Mock update completed. Changes are local to this booking detail screen.");
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormValues(initialBooking);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleDelete = () => {
    navigate(roleConfig.listRoute, {
      state: {
        flashMessage: `Mock delete completed for ${formValues.customerName || formValues.id}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <BookingManagementHeroCard
        backLabel="Back to booking list"
        backTo={roleConfig.listRoute}
        badge={roleConfig.detailBadge}
        title={formValues.customerName}
        description={roleConfig.detailDescription}
        panelIcon={<CalendarClock size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="All actions here are UI-only and do not persist outside this feature."
      />

      {flashMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <BookingManagementFormFields
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
                  onClick={handleSave}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
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
              onClick={handleDelete}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>Delete booking</span>
            </button>
          </div>
        </article>

        <BookingManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."
        />
      </div>
    </section>
  );
}
