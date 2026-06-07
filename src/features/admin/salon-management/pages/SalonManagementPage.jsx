import { Modal } from "antd";
import {
  AlertTriangle,
  BellRing,
  BriefcaseBusiness,
  Check,
  Clock3,
  Eye,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES, getAdminSalonUpdateRoute } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  LOW_OCCUPANCY_SALON,
  SALON_ALERTS,
  SALON_BRANCHES,
  SALON_MODAL_STYLES,
  SALON_STATUS_FILTERS,
  SALON_SUMMARY,
  TOP_PERFORMING_SALON,
  getSalonsWithUpdates,
  matchesSalonStatusFilter,
  removeMockSalonById,
} from "../services/mockSalon";

const SUMMARY_ICON_MAP = {
  briefcase: BriefcaseBusiness,
  check: Check,
  sparkles: Sparkles,
  trendingUp: TrendingUp,
};

function StatCard({ item }) {
  const Icon = SUMMARY_ICON_MAP[item.icon] ?? BriefcaseBusiness;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br ${item.accent} p-4 shadow-[0_18px_35px_rgba(226,93,143,0.08)]`}
    >
      <div className="absolute right-[-12px] top-[-12px] h-12 w-12 rounded-full bg-white/45" />
      <div
        className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg}`}
      >
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <p className="text-[30px] font-bold leading-none text-slate-800">{item.title}</p>
      <p className="mt-2 text-[12px] font-semibold text-slate-500">{item.label}</p>
      <p className={`mt-1 text-[11px] font-semibold ${item.noteColor}`}>{item.note}</p>
    </div>
  );
}

StatCard.propTypes = {
  item: PropTypes.shape({
    accent: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    iconBg: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    noteColor: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

function ProgressRow({ label, value, tone = "bg-rose-500" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-[11px] text-slate-500">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-rose-100">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: value }} />
      </div>
    </div>
  );
}

ProgressRow.propTypes = {
  label: PropTypes.string.isRequired,
  tone: PropTypes.string,
  value: PropTypes.string.isRequired,
};

function RightMetricCard({ title, branch, city, concern, values, buttonLabel }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-700">
        <Sparkles size={14} className="text-rose-500" />
        <span>{title}</span>
      </div>
      <div className="mb-4 flex gap-3">
        <img src={values.image} alt={branch} className="h-12 w-14 rounded-xl object-cover" />
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold text-slate-800">{branch}</p>
          <p className="text-[11px] font-semibold text-slate-400">{city}</p>
          <p className={`text-[11px] font-bold ${concern.color}`}>{concern.text}</p>
        </div>
      </div>
      <div className="space-y-3">
        <ProgressRow label="Occupancy Rate" value={values.occupancy} tone="bg-rose-500" />
        <ProgressRow label="Monthly Revenue" value={values.revenue} tone="bg-rose-500" />
        <ProgressRow label="Staff Utilization" value={values.utilization} tone="bg-rose-500" />
      </div>
      {buttonLabel ? (
        <button
          type="button"
          className="mt-4 w-full rounded-full border border-rose-200 px-4 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
        >
          {buttonLabel}
        </button>
      ) : null}
    </div>
  );
}

RightMetricCard.propTypes = {
  branch: PropTypes.string.isRequired,
  buttonLabel: PropTypes.string,
  city: PropTypes.string.isRequired,
  concern: PropTypes.shape({
    color: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  title: PropTypes.string.isRequired,
  values: PropTypes.shape({
    image: PropTypes.string.isRequired,
    occupancy: PropTypes.string.isRequired,
    revenue: PropTypes.string.isRequired,
    utilization: PropTypes.string.isRequired,
  }).isRequired,
};

function BranchCard({ branch }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
      <img src={branch.image} alt={branch.name} className="h-36 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-slate-800">{branch.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
              #{branch.id}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${branch.statusTone}`}>
            {branch.status}
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-rose-400" />
            <span>{branch.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound size={12} className="text-rose-400" />
            <span>Manager: {branch.manager}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-rose-400" />
            <span>{branch.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 size={12} className="text-rose-400" />
            <span>{branch.schedule}</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-rose-50 pt-3">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={`${branch.id}-${index}`} size={12} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            <span className="font-bold text-slate-700">{branch.rating}</span> ({branch.reviews}{" "}
            reviews)
          </p>
        </div>
      </div>
    </div>
  );
}

BranchCard.propTypes = {
  branch: PropTypes.shape({
    address: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    manager: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
    reviews: PropTypes.string.isRequired,
    schedule: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    statusTone: PropTypes.string.isRequired,
  }).isRequired,
};

function CloseIconButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

CloseIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

function SmallActionButton({ children, className = "", type = "button" }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-rose-500 transition hover:bg-rose-50 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

SmallActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  type: PropTypes.string,
};

export function SalonManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [salons, setSalons] = useState(getSalonsWithUpdates);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    setSalons(getSalonsWithUpdates());
  }, [location.pathname]);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredSalons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return salons.filter((salon) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [salon.name, salon.address, salon.manager]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus = matchesSalonStatusFilter(salon.status, statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [salons, searchTerm, statusFilter]);

  const handleViewSalon = (salon) => {
    setSelectedSalon(salon);
    setShowViewModal(true);
  };

  const handleUpdateSalon = (salon) => {
    navigate(getAdminSalonUpdateRoute(salon.id));
  };

  const handleDeleteSalon = (salon) => {
    setSelectedSalon(salon);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedSalon) {
      return;
    }

    removeMockSalonById(selectedSalon.id);
    setSalons(getSalonsWithUpdates());
    setShowDeleteModal(false);
    setSelectedSalon(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  return (
    <section className="mx-auto max-w-[1300px] text-slate-700">
      {flashMessage ? (
        <div className="mb-4 rounded-[20px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f] sm:mb-5 sm:px-5 sm:py-4">
          {flashMessage}
        </div>
      ) : null}

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SALON_SUMMARY.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          <section className="rounded-[28px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[16px] font-black text-slate-800">Branch Overview</h2>
                <p className="text-[11px] font-medium text-slate-400">
                  Snapshot cards for the branches matching your current filters
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                {SALON_STATUS_FILTERS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`rounded-full px-3 py-1.5 ${statusFilter === tab
                      ? "bg-rose-500 text-white"
                      : "bg-[#fff2f6] text-slate-400 hover:bg-rose-100"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            {filteredSalons.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {filteredSalons.slice(0, 3).map((branch) => (
                  <BranchCard key={branch.id} branch={branch} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10 text-center">
                <p className="text-[14px] font-bold text-slate-700">No branches matched your filters</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Try a different keyword or switch the status tab.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[16px] font-black text-slate-xl">Branch Controls</h2>
                <p className="text-[11px] font-medium text-slate-400">
                  Showing {filteredSalons.length} of {salons.length} salons
                  {searchTerm ? ` • Search: "${searchTerm}"` : ""}
                  {statusFilter !== "All" ? ` • Status: ${statusFilter}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-3 xl:ml-auto xl:min-w-[620px] xl:items-end">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 shadow-inner shadow-rose-50 sm:w-full sm:max-w-[300px]">
                    <Search size={14} className="text-rose-300" />
                    <input
                      type="text"
                      placeholder="Search salons..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full bg-transparent text-[12px] text-slate-500 outline-none placeholder:text-rose-200"
                    />
                    {searchTerm || statusFilter !== "All" ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-full bg-rose-100 p-1 text-rose-500 hover:bg-rose-200"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={ROUTES.adminSalonsCreate}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-4 py-2 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition hover:opacity-95"
                    >
                      <Plus size={20} />
                      Add Salon
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <SmallActionButton >Assign Manager</SmallActionButton>
                  <SmallActionButton >Holiday Closure</SmallActionButton>
                  <SmallActionButton >Set Hours</SmallActionButton>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-rose-100">
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full text-left">
                  <thead className="bg-[#fff5f8]">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <th className="px-4 py-3">Salon Name</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Manager</th>
                      <th className="px-4 py-3">Staff</th>
                      <th className="px-4 py-3">Operating Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalons.map((salon) => (
                      <tr
                        key={`${salon.name}-${salon.id}`}
                        className="border-t border-rose-50 text-[12px] text-slate-500"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={salon.image}
                              alt={salon.name}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-700">{salon.name}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                                #{salon.salonId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{salon.address}</td>
                        <td className="px-4 py-3">{salon.manager}</td>
                        <td className="px-4 py-3">{salon.staff}</td>
                        <td className="px-4 py-3">{salon.hours}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${salon.statusColor}`}
                          >
                            {salon.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-rose-400">
                            <button
                              type="button"
                              onClick={() => handleViewSalon(salon)}
                              className="rounded-lg border border-rose-100 p-1.5 hover:bg-rose-50"
                              title="View"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSalon(salon)}
                              className="rounded-lg border border-rose-100 p-1.5 hover:bg-rose-50"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSalon(salon)}
                              className="rounded-lg border border-rose-100 p-1.5 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <RightMetricCard {...TOP_PERFORMING_SALON} />
          <RightMetricCard {...LOW_OCCUPANCY_SALON} />
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_32px_rgba(226,93,143,0.08)]">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-bold text-slate-700">
              <BellRing size={14} className="text-rose-500" />
              <span>Branch Alerts</span>
            </div>
            <div className="space-y-4">
              {SALON_ALERTS.map((alert) => (
                <div key={alert.title} className="flex gap-3">
                  <div className={`pt-0.5 ${alert.color}`}>
                    <AlertTriangle size={13} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold leading-5 text-slate-600">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={showViewModal}
        onCancel={() => setShowViewModal(false)}
        footer={null}
        closable={false}
        width={440}
        styles={SALON_MODAL_STYLES}
      >
        {selectedSalon ? (
          <div>
            <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2">
                    <Eye size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-white">Salon Details</h3>
                    <p className="text-[11px] text-white/70">View salon information</p>
                  </div>
                </div>
                <CloseIconButton onClick={() => setShowViewModal(false)} />
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-4">
                <img
                  src={selectedSalon.image}
                  alt={selectedSalon.name}
                  className="h-20 w-20 rounded-xl object-cover shadow-sm"
                />
                <div>
                  <h3 className="text-[17px] font-bold text-slate-800">{selectedSalon.name}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                    #{selectedSalon.salonId}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedSalon.statusColor}`}
                  >
                    {selectedSalon.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: "Address", value: selectedSalon.address },
                  { icon: UserRound, label: "Manager", value: selectedSalon.manager },
                  { icon: Phone, label: "Phone", value: selectedSalon.phone },
                  { icon: Clock3, label: "Operating Hours", value: selectedSalon.hours },
                  { icon: Wrench, label: "Staff Amount", value: selectedSalon.staff },
                  {
                    icon: Star,
                    label: "Rating",
                    value: `${selectedSalon.rating} (${selectedSalon.reviews} reviews)`,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-rose-50 bg-[#fff8fb] p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Icon size={11} className="text-rose-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {label}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-rose-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="rounded-full border border-rose-200 bg-white px-5 py-2 text-[11px] font-bold text-rose-400 transition hover:bg-rose-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        footer={null}
        closable={false}
        width={440}
        styles={SALON_MODAL_STYLES}
      >
        {selectedSalon ? (
          <div>
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2">
                    <Trash2 size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-white">Delete Salon</h3>
                    <p className="text-[11px] text-white/70">This action cannot be undone</p>
                  </div>
                </div>
                <CloseIconButton onClick={() => setShowDeleteModal(false)} />
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-rose-100 bg-[#fff8fb] p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSalon.image}
                    alt={selectedSalon.name}
                    className="h-14 w-14 rounded-xl object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{selectedSalon.name}</p>
                    <p className="text-[11px] text-slate-400">
                      #{selectedSalon.salonId} • {selectedSalon.address}
                    </p>
                    <p className="text-[11px] text-slate-400">Manager: {selectedSalon.manager}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <p className="text-[12px] font-bold text-amber-600">Warning</p>
                </div>
                <ul className="space-y-1.5">
                  {[
                    "All salon data will be permanently deleted",
                    "Staff assignments will be removed",
                    "Appointment history will be lost",
                    "This action affects reporting and analytics",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-amber-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-rose-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full border border-rose-200 bg-white px-5 py-2 text-[11px] font-bold text-rose-400 transition hover:bg-rose-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(239,68,68,0.35)] transition hover:opacity-90"
              >
                <Trash2 size={12} />
                Delete Salon
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
