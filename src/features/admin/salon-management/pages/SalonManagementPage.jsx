import {
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
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
  X,
} from "lucide-react";
import { Modal, Spin, Alert } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminSalonDetailRoute,
  getAdminSalonUpdateRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  LOW_OCCUPANCY_SALON,
  SALON_MODAL_STYLES,
  SALON_STATUS_FILTERS,
  TOP_PERFORMING_SALON,
  matchesSalonStatusFilter,
} from "../services/mockSalon";
import { fetchSalons, deleteSalon } from "../services/salonsService";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="24" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

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
        <img
          crossOrigin="anonymous"
          src={values.image}
          alt={branch}
          className="h-12 w-14 rounded-xl object-cover"
          referrerPolicy="no-referrer"
        />
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

function BranchCard({ branch, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-2xl border border-rose-100 bg-white text-left shadow-[0_18px_32px_rgba(226,93,143,0.08)] transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_24px_40px_rgba(226,93,143,0.14)]"
    >
      <img
        crossOrigin="anonymous"
        src={branch.image}
        alt={branch.name}
        className="h-36 w-full object-cover"
        referrerPolicy="no-referrer"
      />
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
    </button>
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
  onClick: PropTypes.func.isRequired,
};

function SmallActionButton({ children, className = "", onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-rose-500 transition hover:bg-rose-50 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

SmallActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
};

function CloseIconButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
      aria-label="Close modal"
    >
      <X size={14} />
    </button>
  );
}

CloseIconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

function mapApiSalonToUiFormat(apiSalon) {
  const status = apiSalon.status || "Active";
  
  return {
    id: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    salonId: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    name: apiSalon.salonName || apiSalon.name || "Unknown Salon",
    address: apiSalon.address || "No address",
    manager: apiSalon.managerName || apiSalon.manager || "Unassigned",
    phone: apiSalon.phone || "No phone",
    image: apiSalon.imageUrl || apiSalon.image || SALON_PLACEHOLDER_IMAGE,
    status: status,
    statusColor: "bg-[#e6fdf0] text-[#16975f]",
    statusTone: "bg-[#e6fdf0] text-[#16975f]",
    staff: apiSalon.staffAmount || 0,
    hours: "9AM - 9PM",
    schedule: "9AM - 9PM",
    rating: "4.8",
    reviews: "128",
  };
}

export function SalonManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHolidayClosureModal, setShowHolidayClosureModal] = useState(false);
  const [showSetHoursModal, setShowSetHoursModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchOverviewStart, setBranchOverviewStart] = useState(0);
  const [salonsRefreshKey, setSalonsRefreshKey] = useState(0);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [salons, setSalons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSalons = async () => {
      setIsLoading(true);
      setError("");
      try {
        const apiSalons = await fetchSalons();
        const uiSalons = apiSalons.map(mapApiSalonToUiFormat);
        setSalons(uiSalons);
      } catch (err) {
        console.error("Failed to load salons:", err);
        setError(err.message || "Failed to load salons. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSalons();
  }, [salonsRefreshKey]);

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

  const visibleBranchSalons = useMemo(
    () => filteredSalons.slice(branchOverviewStart, branchOverviewStart + 3),
    [branchOverviewStart, filteredSalons],
  );

  const canGoToPreviousBranchSet = branchOverviewStart > 0;
  const canGoToNextBranchSet = branchOverviewStart + 3 < filteredSalons.length;

  useEffect(() => {
    setBranchOverviewStart(0);
  }, [searchTerm, statusFilter]);

  const handleViewSalon = (salon) => {
    navigate(getAdminSalonDetailRoute(salon.id));
  };

  const handleUpdateSalon = (salon) => {
    navigate(getAdminSalonUpdateRoute(salon.id));
  };

  const handleDeleteSalon = (salon) => {
    setSelectedSalon(salon);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSalon) {
      return;
    }

    try {
      await deleteSalon(selectedSalon.id);
      setSalonsRefreshKey((current) => current + 1);
      setShowDeleteModal(false);
      setSelectedSalon(null);
    } catch (err) {
      console.error("Failed to delete salon:", err);
      setError(err.message || "Failed to delete salon. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setBranchOverviewStart(0);
  };

  const getSalonActionItems = (salon) => [
    {
      key: "view",
      label: "View Salon",
      icon: Eye,
      onSelect: () => handleViewSalon(salon),
    },
    {
      key: "edit",
      label: "Edit Salon",
      icon: Pencil,
      onSelect: () => handleUpdateSalon(salon),
    },
    {
      key: "delete",
      label: "Delete Salon",
      icon: Trash2,
      className: "text-[#d14c84]",
      onSelect: () => handleDeleteSalon(salon),
    },
  ];

  const salonSummary = useMemo(() => {
    return [
      {
        accent: "from-[#fdf2f7] to-[#fff]",
        icon: "briefcase",
        iconBg: "bg-rose-100",
        label: "Total Branches",
        note: "+2 this quarter",
        noteColor: "text-emerald-500",
        title: salons.length.toString(),
      },
      {
        accent: "from-[#fdf7f2] to-[#fff]",
        icon: "check",
        iconBg: "bg-amber-100",
        label: "Active Salons",
        note: "98% uptime",
        noteColor: "text-emerald-500",
        title: salons.filter((s) => s.status === "Active").length.toString(),
      },
      {
        accent: "from-[#f2fdf6] to-[#fff]",
        icon: "sparkles",
        iconBg: "bg-emerald-100",
        label: "Avg. Rating",
        note: "+0.2 vs last month",
        noteColor: "text-emerald-500",
        title: "4.8",
      },
      {
        accent: "from-[#f5f2fd] to-[#fff]",
        icon: "trendingUp",
        iconBg: "bg-violet-100",
        label: "Total Staff",
        note: "+12 new hires",
        noteColor: "text-emerald-500",
        title: salons.reduce((sum, s) => sum + (parseInt(s.staff) || 0), 0).toString(),
      },
    ];
  }, [salons]);

  return (
    <section className="mx-auto max-w-[1300px] text-slate-700">
      {flashMessage ? (
        <div className="mb-4 rounded-[20px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f] sm:mb-5 sm:px-5 sm:py-4">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <Alert
            message="Error Loading Salons"
            description={error}
            type="error"
            showIcon
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="mb-5 flex min-h-[200px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {salonSummary.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </section>
      )}

      {!isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">

          {/* ── Left column ── */}
          <div className="space-y-5">

            {/* Branch Overview */}
            <section className="rounded-[28px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[16px] font-black text-slate-800">Branch Overview</h2>
                  <p className="text-[11px] font-medium text-slate-400">
                    Snapshot cards for the branches matching your current filters
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {SALON_STATUS_FILTERS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStatusFilter(tab)}
                        className={`rounded-full px-3 py-1.5 ${
                          statusFilter === tab
                            ? "bg-rose-500 text-white"
                            : "bg-[#fff2f6] text-slate-400 hover:bg-rose-100"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {filteredSalons.length > 3 ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBranchOverviewStart((current) => Math.max(current - 3, 0))
                        }
                        disabled={!canGoToPreviousBranchSet}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous salons"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBranchOverviewStart((current) =>
                            Math.min(current + 3, Math.max(filteredSalons.length - 3, 0)),
                          )
                        }
                        disabled={!canGoToNextBranchSet}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next salons"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              {filteredSalons.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {visibleBranchSalons.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onClick={() => handleViewSalon(branch)}
                    />
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

            {/* Branch Controls */}
            <section className="rounded-[28px] bg-white/65 p-4 shadow-[0_20px_45px_rgba(226,93,143,0.06)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[16px] font-black text-slate-800">Branch Controls</h2>
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
                    <SmallActionButton onClick={() => setShowAssignManagerModal(true)}>
                      Assign Manager
                    </SmallActionButton>
                    <SmallActionButton onClick={() => setShowHolidayClosureModal(true)}>
                      Holiday Closure
                    </SmallActionButton>
                    <SmallActionButton onClick={() => setShowSetHoursModal(true)}>
                      Set Hours
                    </SmallActionButton>
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
                                crossOrigin="anonymous"
                                src={salon.image}
                                alt={salon.name}
                                className="h-10 w-10 rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-slate-700">{salon.name}</p>
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
                            <ActionDropdown
                              label="Action"
                              items={getSalonActionItems(salon)}
                              buttonClassName="min-w-[108px] justify-between border-[#f1bfd5] bg-white px-4 text-[11px] shadow-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>
          {/* ── End left column ── */}

          {/* ── Right column aside ── */}
          <aside className="space-y-5">
            <RightMetricCard {...TOP_PERFORMING_SALON} />
            <RightMetricCard {...LOW_OCCUPANCY_SALON} />
          </aside>

        </div>
      ) : null}

      <ActionConfirmModal
        open={showDeleteModal}
        intent="danger"
        title="Delete Salon"
        subtitle="This will remove the branch from salon management."
        description={`You are about to delete ${selectedSalon?.name ?? "this salon"}. This action cannot be undone.`}
        confirmText="Delete Salon"
        cancelText="Keep Salon"
        confirmIcon={Trash2}
        width={460}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        item={
          selectedSalon
            ? {
                image: selectedSalon.image,
                title: selectedSalon.name,
                meta: selectedSalon.address,
                note: `Manager: ${selectedSalon.manager}`,
              }
            : null
        }
        warnings={[
          "All salon data in the current mock state will be removed.",
          "Staff assignments linked to this branch will no longer appear.",
          "Appointment history and reporting references for this branch will be lost.",
        ]}
      />

      {/* ── Assign Manager Modal ── */}
      <Modal
        open={showAssignManagerModal}
        onCancel={() => setShowAssignManagerModal(false)}
        footer={null}
        closable={false}
        width={440}
        styles={SALON_MODAL_STYLES}
      >
        <div>
          <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2">
                  <UserRound size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-white">Assign Manager</h3>
                  <p className="text-[11px] text-white/70">Assign a new manager to a salon</p>
                </div>
              </div>
              <CloseIconButton onClick={() => setShowAssignManagerModal(false)} />
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Select Salon
              </label>
              <select className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option>Choose a salon...</option>
                {salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name} - {salon.address}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Select New Manager
              </label>
              <select className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option>Choose a staff member...</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-rose-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowAssignManagerModal(false)}
              className="rounded-full border border-rose-200 bg-white px-5 py-2 text-[11px] font-bold text-rose-400 transition hover:bg-rose-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowAssignManagerModal(false)}
              className="rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-5 py-2 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(226,93,143,0.25)] transition hover:opacity-95"
            >
              Assign Manager
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Holiday Closure Modal ── */}
      <Modal
        open={showHolidayClosureModal}
        onCancel={() => setShowHolidayClosureModal(false)}
        footer={null}
        closable={false}
        width={440}
        styles={SALON_MODAL_STYLES}
      >
        <div>
          <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2">
                  <CalendarClock size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-white">Holiday Closure</h3>
                  <p className="text-[11px] text-white/70">Schedule salon closure for holidays</p>
                </div>
              </div>
              <CloseIconButton onClick={() => setShowHolidayClosureModal(false)} />
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Select Salon
              </label>
              <select className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option>Choose a salon...</option>
                {salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Closure Date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Reason
              </label>
              <input
                type="text"
                placeholder="e.g., Christmas Holiday"
                className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-rose-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowHolidayClosureModal(false)}
              className="rounded-full border border-rose-200 bg-white px-5 py-2 text-[11px] font-bold text-rose-400 transition hover:bg-rose-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowHolidayClosureModal(false)}
              className="rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-5 py-2 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(226,93,143,0.25)] transition hover:opacity-95"
            >
              Schedule Closure
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Set Hours Modal ── */}
      <Modal
        open={showSetHoursModal}
        onCancel={() => setShowSetHoursModal(false)}
        footer={null}
        closable={false}
        width={440}
        styles={SALON_MODAL_STYLES}
      >
        <div>
          <div className="bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2">
                  <Clock3 size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-white">Set Operating Hours</h3>
                  <p className="text-[11px] text-white/70">Update salon opening and closing hours</p>
                </div>
              </div>
              <CloseIconButton onClick={() => setShowSetHoursModal(false)} />
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Select Salon
              </label>
              <select className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option>Choose a salon...</option>
                {salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Opening Time
              </label>
              <input
                type="time"
                className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Closing Time
              </label>
              <input
                type="time"
                className="w-full rounded-xl border border-rose-100 bg-[#fff8fb] px-4 py-2.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-rose-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowSetHoursModal(false)}
              className="rounded-full border border-rose-200 bg-white px-5 py-2 text-[11px] font-bold text-rose-400 transition hover:bg-rose-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowSetHoursModal(false)}
              className="rounded-full bg-gradient-to-r from-[#eb5b92] to-[#cf3d74] px-5 py-2 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(226,93,143,0.25)] transition hover:opacity-95"
            >
              Update Hours
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
