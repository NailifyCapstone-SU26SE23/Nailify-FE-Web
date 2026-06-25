import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  ROUTES,
  getAdminSalonUpdateRoute,
} from "../../../../shared/constants/routes";
import {
  SALON_DAYS_OF_WEEK,
  fetchMockSalonFormById,
  getSalonsWithUpdates,
  removeMockSalonById,
} from "../services/mockSalon";

function SalonDetailLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[20px] bg-white/65 p-8 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
        <p className="mt-4 text-sm text-slate-600">Loading salon details...</p>
      </div>
    </div>
  );
}

function mapApiSalonToFormAndRow(apiSalon) {
  console.log("Mapping API salon to form/row:", apiSalon);
  const salonForm = {
    salonId: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    salonName: apiSalon.salonName || apiSalon.name || "Unknown Salon",
    manager: apiSalon.managerName || apiSalon.manager || "Unassigned",
    staffAmount: apiSalon.staffAmount || 0,
    status: apiSalon.status || "Active",
    description: apiSalon.description || "",
    operatingHours: {
      monday: { open: "09:00", close: "21:00" },
      tuesday: { open: "09:00", close: "21:00" },
      wednesday: { open: "09:00", close: "21:00" },
      thursday: { open: "09:00", close: "21:00" },
      friday: { open: "09:00", close: "21:00" },
      saturday: { open: "10:00", close: "20:00" },
      sunday: { open: "10:00", close: "20:00" },
    },
    phone: apiSalon.phone || "No phone",
  };

  const salonRow = {
    id: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    salonId: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    name: apiSalon.salonName || apiSalon.name || "Unknown Salon",
    address: apiSalon.address || "No address",
    manager: apiSalon.managerName || apiSalon.manager || "Unassigned",
    phone: apiSalon.phone || "No phone",
    image: apiSalon.imageUrl || apiSalon.image || "https://placehold.co/400x200/eb5b92/ffffff?text=Salon",
    status: apiSalon.status || "Active",
    statusColor: "bg-[#e6fdf0] text-[#16975f]",
    staff: apiSalon.staffAmount || 0,
    hours: "9AM - 9PM",
    rating: "4.8",
    reviews: "128",
  };

  return { salonForm, salonRow };
}

export function SalonDetailPage() {
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salonForm, setSalonForm] = useState(null);
  const [salonRow, setSalonRow] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSalon = async () => {
      setIsLoading(true);
      setIsNotFound(false);

      const form = await fetchMockSalonFormById(salonId);
      const row = getSalonsWithUpdates().find(
        (entry) =>
          String(entry.id) === String(salonId) || entry.salonId === String(salonId),
      );

      if (!isMounted) {
        return;
      }

      if (!form || !row) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setSalonForm(form);
      setSalonRow(row);
      setIsLoading(false);
    };

    void loadSalon();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const detailItems = useMemo(() => {
    if (!salonDetail) {
      return [];
    }

    return [
      { icon: MapPin, label: "Address", value: salonDetail.address },
      { icon: UserRound, label: "Manager", value: salonDetail.manager || "Unassigned" },
      { icon: Phone, label: "Phone", value: salonDetail.phone || "Not set" },
      { icon: Clock3, label: "Operating Hours", value: salonDetail.hours || "Operating hours unavailable" },
      { icon: Wrench, label: "Staff Amount", value: salonDetail.staff || "--" },
      {
        icon: Star,
        label: "Rating",
        value: `${salonDetail.rating || "-"} (${salonDetail.reviews || "0"} reviews)`,
      },
    ];
  }, [salonDetail]);

  const operatingHoursMap = useMemo(
    () => mapSalonOperatingHours(salonDetail?.operatingHours),
    [salonDetail?.operatingHours],
  );

  const handleDeleteSalon = () => {
    if (!salonRow) {
      return;
    }

    removeMockSalonById(salonRow.id);
    navigate(ROUTES.adminSalons, {
      state: {
        flashMessage: `${salonRow.name} has been deleted successfully.`,
      },
    });
  };

  if (isNotFound) {
    return <Navigate to={ROUTES.adminSalons} replace />;
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1300px] text-slate-700">
      {error ? (
        <div className="mb-4">
          <Alert
            message="Error Loading Salon"
            description={error}
            type="error"
            showIcon
          />
        </div>
      ) : null}
      <header className="mb-4 flex flex-col gap-4 rounded-[20px] bg-white/70 px-4 py-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)] backdrop-blur sm:mb-5 sm:rounded-[24px] sm:px-5 lg:rounded-[28px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to={ROUTES.adminSalons}
            className="inline-flex shrink-0 rounded-xl border border-rose-100 bg-white p-2 text-rose-500 transition hover:bg-rose-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#cf3d74] sm:text-2xl lg:text-[28px]">
              Salon Detail
            </h1>
            <p className="text-[11px] font-medium text-slate-400 sm:text-[12px]">
              Review branch information and manage this salon from one page
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(getAdminSalonUpdateRoute(salonId))}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={14} />
            Edit Salon
          </button>
        </div>
      </header>

      {isLoading ? (
        <SalonDetailLoadingState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="overflow-hidden rounded-[20px] bg-white/70 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
            <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-5 py-5 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={salonDetail.image}
                  alt={salonDetail.name}
                  className="h-24 w-24 rounded-2xl object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <h2 className="text-[22px] font-black tracking-tight">{salonDetail.name}</h2>
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${salonDetail.statusColor}`}
                  >
                    {salonDetail.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {detailItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={14} className="text-rose-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {label}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-rose-100 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays size={15} className="text-rose-400" />
                  <h3 className="text-[15px] font-bold text-slate-800">Weekly Schedule</h3>
                </div>
                <div className="grid gap-2">
                  {SALON_DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day.key}
                      className="flex items-center justify-between rounded-xl bg-[#fff6f9] px-4 py-3 text-[12px]"
                    >
                      <span className="font-semibold text-slate-600">{day.label}</span>
                      <span className="text-slate-500">
                        {operatingHoursMap[day.key]?.closed
                          ? "Closed"
                          : `${operatingHoursMap[day.key]?.open} - ${operatingHoursMap[day.key]?.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[20px] bg-white/70 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
              <h2 className="text-[16px] font-bold text-slate-800">Management Snapshot</h2>
              <div className="mt-4 space-y-3 text-[12px] text-slate-600">
                <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                  <span className="font-semibold">Salon Name</span>
                  <span className="text-right">{salonDetail.name}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                  <span className="font-semibold">Manager</span>
                  <span className="text-right">{salonDetail.manager || "Unassigned"}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                  <span className="font-semibold">Staff Amount</span>
                  <span className="text-right">{salonDetail.staff}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                  <span className="font-semibold">Status</span>
                  <span className="text-right">{salonDetail.status}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] bg-white/70 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
              <h2 className="text-[16px] font-bold text-slate-800">Description</h2>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-slate-500">
                Salon detail API does not return description yet.
              </p>
            </section>
          </aside>
        </div>
      )}

      <ActionConfirmModal
        open={showDeleteModal}
        intent="danger"
        title="Delete Salon"
        subtitle="Delete salon API is not connected yet."
        description={`You are about to delete ${salonDetail?.name ?? "this salon"}.`}
        confirmText="Close"
        cancelText="Cancel"
        confirmIcon={Trash2}
        onConfirm={handleDeleteSalon}
        onCancel={() => setShowDeleteModal(false)}
        item={
          salonDetail
            ? {
                image: salonDetail.image,
                title: salonDetail.name,
                meta: salonDetail.address,
                note: `Manager: ${salonDetail.manager || "Unassigned"}`,
              }
            : null
        }
        warnings={[
          "Delete salon API is not connected yet.",
          "This action currently shows a placeholder notification only.",
        ]}
      />
    </section>
  );
}
