import { CalendarPlus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../../shared/constants/roles";
import { BookingManagementFormFields } from "../components/BookingManagementFormFields";
import { BookingManagementHeroCard } from "../components/BookingManagementHeroCard";
import { BookingManagementSnapshotCard } from "../components/BookingManagementSnapshotCard";
import {
  BOOKING_ROLE_CONFIG,
  createEmptyBooking,
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

export function BookingManagementCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useMemo(() => getRoleFromPath(location.pathname), [location.pathname]);
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const [formValues, setFormValues] = useState(createEmptyBooking);

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreate = () => {
    navigate(roleConfig.listRoute, {
      state: {
        flashMessage: `Mock create completed for ${formValues.customerName || "new booking"}.`,
      },
    });
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <BookingManagementHeroCard
        backLabel="Back to booking list"
        backTo={roleConfig.listRoute}
        badge={roleConfig.detailBadge}
        title="Create booking"
        description={roleConfig.createDescription}
        panelIcon={<CalendarPlus size={18} className="text-[#d45b9f]" />}
        panelTitle="Create mode"
        panelDescription="This screen is dedicated to creating a booking, while detail pages stay focused on reviewing and editing an existing appointment."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <BookingManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
            >
              <Save size={16} />
              <span>Create booking</span>
            </button>
          </div>
        </article>

        <BookingManagementSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Create action updates the UI flow, but it does not persist data outside this screen."
        />
      </div>
    </section>
  );
}
