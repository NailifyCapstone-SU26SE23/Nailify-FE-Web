import { Modal } from "antd";
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
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ROUTES,
  getAdminSalonUpdateRoute,
} from "../../../../shared/constants/routes";
import {
  SALON_DAYS_OF_WEEK,
  SALON_FORM_MODAL_STYLES,
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

    loadSalon();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const detailItems = useMemo(() => {
    if (!salonRow || !salonForm) {
      return [];
    }

    return [
      { icon: MapPin, label: "Address", value: salonRow.address },
      { icon: UserRound, label: "Manager", value: salonRow.manager },
      { icon: Phone, label: "Phone", value: salonRow.phone || salonForm.phone || "Not set" },
      { icon: Clock3, label: "Operating Hours", value: salonRow.hours || "Custom schedule" },
      { icon: Wrench, label: "Staff Amount", value: salonRow.staff || salonForm.staffAmount || "0" },
      {
        icon: Star,
        label: "Rating",
        value: `${salonRow.rating || "—"} (${salonRow.reviews || "0"} reviews)`,
      },
    ];
  }, [salonForm, salonRow]);

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
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="overflow-hidden rounded-[20px] bg-white/70 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
              <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-5 py-5 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={salonRow.image}
                    alt={salonRow.name}
                    className="h-24 w-24 rounded-2xl object-cover shadow-lg"
                  />
                  <div className="min-w-0">
                    <h2 className="text-[22px] font-black tracking-tight">{salonRow.name}</h2>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                      #{salonRow.salonId}
                    </p>
                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${salonRow.statusColor}`}
                    >
                      {salonRow.status}
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
                          {salonForm.operatingHours[day.key].open} -{" "}
                          {salonForm.operatingHours[day.key].close}
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
                    <span className="text-right">{salonForm.salonName}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                    <span className="font-semibold">Salon ID</span>
                    <span className="text-right">{salonForm.salonId}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                    <span className="font-semibold">Manager</span>
                    <span className="text-right">{salonForm.manager}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                    <span className="font-semibold">Staff Amount</span>
                    <span className="text-right">{salonForm.staffAmount}</span>
                  </div>
                  <div className="flex justify-between gap-3 rounded-xl bg-[#fff6f9] px-4 py-3">
                    <span className="font-semibold">Status</span>
                    <span className="text-right">{salonForm.status}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] bg-white/70 p-5 shadow-[0_20px_45px_rgba(226,93,143,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
                <h2 className="text-[16px] font-bold text-slate-800">Description</h2>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-slate-500">
                  {salonForm.description?.trim() || "No description available for this salon."}
                </p>
              </section>
            </aside>
          </div>
        </>
      )}

      <Modal
        title="Confirm Delete"
        open={showDeleteModal}
        onOk={handleDeleteSalon}
        onCancel={() => setShowDeleteModal(false)}
        okText="Yes, Delete Salon"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          className: "bg-rose-500 hover:bg-rose-600 text-white border-rose-500",
        }}
        cancelButtonProps={{
          className: "border-rose-200 text-rose-500 hover:text-rose-600",
        }}
        styles={SALON_FORM_MODAL_STYLES}
      >
        <div className="py-4">
          <p className="mb-2 text-slate-700">Are you sure you want to delete this salon?</p>
          <p className="text-sm text-slate-500">
            This will remove {salonRow?.name ?? "the selected salon"} from the mock salon list.
          </p>
        </div>
      </Modal>
    </section>
  );
}
