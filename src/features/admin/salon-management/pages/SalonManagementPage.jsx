import {
  BriefcaseBusiness,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  Moon,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Trash2,
  TrendingUp,
  UserRound,
  X,
  AlertTriangle,
} from "lucide-react";
import AssignManagerModal from "../components/AssignManagerModal";
import HolidayClosureModal from "../components/HolidayClosureModal";
import SetOperatingHoursModal from "../components/SetOperatingHoursModal";
import { Modal, Spin, Alert, Form, Select, DatePicker, TimePicker, Input, Tooltip, Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getAdminSalonDetailRoute,
  getAdminSalonUpdateRoute,
} from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  SALON_STATUS_FILTERS,
  matchesSalonStatusFilter,
} from "../services/mockSalon";
import { fetchSalons, deleteSalon } from "../services/salonsService";
import { fetchAdminSalons, normalizeAdminSalon, fetchSalonStaffCount } from "../services/salonManagementService";
import { fetchAdminUsers, updateAdminUser, fetchRawAdminUserDetail } from "../../user-management/services/userManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

const PINK_BUTTON_STYLE = { backgroundColor: "#ea4f93", borderColor: "#ea4f93" };

function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-[#f5e2ec] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(226,93,143,0.06)]" : ""} ${className}`}
    >
      {children}
    </article>
  );
}

PremiumCard.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  noHover: PropTypes.bool,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#3f2034]">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-[#a6869a] leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};



function ProgressRow({ label, value, tone = "bg-[#ea4f93]" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span className="text-[11px] text-slate-500">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#f5e2ec]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: value }}
          transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${tone}`}
        />
      </div>
    </div>
  );
}

ProgressRow.propTypes = {
  label: PropTypes.string.isRequired,
  tone: PropTypes.string,
  value: PropTypes.string.isRequired,
};

function RightMetricCard({ title, branch, city, concern, values, buttonLabel, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index || 0) * 0.15, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <PremiumCard className="p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-[#2d1b35]">
          <Sparkles size={14} className="text-[#ea4f93]" />
          <span>{title}</span>
        </div>
        <div className="mb-4 flex gap-3">
          <img
            crossOrigin="anonymous"
            src={values.image}
            alt={branch}
            className="h-12 w-14 shrink-0 rounded-[12px] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-[13px] font-bold text-[#2d1b35]">{branch}</p>
            <p className="truncate text-[11px] font-semibold text-[#a88a9f]">{city}</p>
            <p className={`truncate text-[11px] font-bold ${concern.color}`}>{concern.text}</p>
          </div>
        </div>
        <div className="space-y-3">
          <ProgressRow label="Occupancy Rate" value={values.occupancy} tone="bg-[#ea4f93]" />
          <ProgressRow label="Monthly Revenue" value={values.revenue} tone="bg-[#ea4f93]" />
          <ProgressRow label="Staff Utilization" value={values.utilization} tone="bg-[#ea4f93]" />
        </div>
        {buttonLabel ? (
          <button
            type="button"
            className="mt-4 w-full rounded-full border border-[#f0b7cf] bg-white px-3 py-1.5 text-[11px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
          >
            {buttonLabel}
          </button>
        ) : null}
      </PremiumCard>
    </motion.div>
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
  index: PropTypes.number,
};

/**
 * FIX: card now stretches full height (h-full) inside its fixed-width wrapper,
 * uses `truncate` + `min-w-0` on text so long content never pushes the card
 * wider, and pins the rating row to the bottom with `mt-auto` so every card
 * in the row ends up the same height regardless of how much text it holds.
 */
function BranchCard({ branch, onClick }) {

  const { t, language } = useLanguage();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#f5e2ec] bg-white text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all"
    >
      <img
        crossOrigin="anonymous"
        src={branch.image}
        alt={branch.name}
        className="h-44 w-full shrink-0 object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold text-[#2d1b35]">{branch.name}</p>
          </div>
          <span className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold ${branch.statusColor}`}>
            {branch.status}
          </span>
        </div>
        <div className="space-y-3 text-[13px] text-[#5b4256]">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-[#ea4f93]" />
            <span className="truncate">{t("adminSalonManagement.address1")} {branch.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound size={16} className="shrink-0 text-[#ea4f93]" />
            <span className="truncate">{t("adminSalonManagement.manager1")} {branch.manager}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="shrink-0 text-[#ea4f93]" />
            <span className="truncate">{t("adminSalonManagement.phone")} {branch.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="shrink-0 text-[#ea4f93]" />
            <span className="truncate">{t("adminSalonManagement.hours")} {branch.hours}</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[#f5e2ec] pt-4">
          <div className="flex items-center gap-1 text-[#f59e0b]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={`${branch.id}-${i}`} size={16} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p className="text-[12px] font-semibold text-[#a88a9f]">
            <span className="font-bold text-[#2d1b35]">{branch.rating}</span> ({branch.reviews} reviews)
          </p>
        </div>
      </div>
    </motion.button>
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
    hours: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    statusColor: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

function SmallActionButton({ children, className = "", onClick, type = "button" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border border-[#f0b7cf] bg-white px-4 py-2 text-[11px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb] ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
}

SmallActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
};

function mapApiSalonToUiFormat(apiSalon) {
  // Map API status values to our internal statuses
  const apiStatus = (apiSalon.status || "Open").toLowerCase();

  let internalStatus = "Open"; // Default to Open
  let statusColor = "bg-[#e6fdf0] text-[#16975f]";
  let statusTone = "bg-[#e6fdf0] text-[#16975f]";

  if (apiStatus === "closed") {
    internalStatus = "CLOSED";
    statusColor = "bg-[#fff0f0] text-[#e53e3e]";
    statusTone = "bg-[#fff0f0] text-[#e53e3e]";
  } else if (apiStatus === "busy") {
    internalStatus = "BUSY";
    statusColor = "bg-[#fffbeb] text-[#d69e2e]";
    statusTone = "bg-[#fffbeb] text-[#d69e2e]";
  } else if (apiStatus === "open") {
    internalStatus = "Open";
  }

  return {
    id: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    salonId: (apiSalon.salonId || apiSalon.id || "").toString().trim(),
    name: apiSalon.salonName || apiSalon.name || "Unknown Salon",
    address: apiSalon.address || "No address",
    manager: apiSalon.managerName || apiSalon.manager || "Unassigned",
    phone: apiSalon.phone || "No phone",
    imageUrl: apiSalon.imageUrl || apiSalon.image || "",
    image: apiSalon.imageUrl || apiSalon.image || SALON_PLACEHOLDER_IMAGE,
    status: internalStatus,
    statusColor: statusColor,
    statusTone: statusTone,
    staff: apiSalon.staffAmount || 0,
    hours: "9AM - 9PM",
    schedule: "9AM - 9PM",
    rating: "4.8",
    reviews: "128",
  };
}

// Time slot configuration
const TIME_SLOTS = {
  morning: {
    label: "Morning",
    icon: Sunrise,
    slots: [
      "07:00 - 07:30", "07:30 - 08:00", "08:00 - 08:30", "08:30 - 09:00",
      "09:00 - 09:30", "09:30 - 10:00", "10:00 - 10:30", "10:30 - 11:00",
      "11:00 - 11:30", "11:30 - 12:00"
    ]
  },
  afternoon: {
    label: "Afternoon",
    icon: Sun,
    slots: [
      "12:00 - 12:30", "12:30 - 13:00", "13:00 - 13:30", "13:30 - 14:00",
      "14:00 - 14:30", "14:30 - 15:00", "15:00 - 15:30", "15:30 - 16:00",
      "16:00 - 16:30", "16:30 - 17:00"
    ]
  },
  evening: {
    label: "Evening",
    icon: Moon,
    slots: [
      "17:00 - 17:30", "17:30 - 18:00", "18:00 - 18:30", "18:30 - 19:00",
      "19:00 - 19:30", "19:30 - 20:00", "20:00 - 20:30", "20:30 - 21:00"
    ]
  }
};

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
  const [branchControlsPage, setBranchControlsPage] = useState(1);
  const { t, language } = useLanguage();
  const [salonsRefreshKey, setSalonsRefreshKey] = useState(0);
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [salons, setSalons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlots, setSelectedSlots] = useState({
    morning: TIME_SLOTS.morning.slots,
    afternoon: TIME_SLOTS.afternoon.slots,
    evening: TIME_SLOTS.evening.slots,
  });
  const [activePeriod, setActivePeriod] = useState(null);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  // Assign Manager Modal state
  const [assignManagerForm, setAssignManagerForm] = useState({ salonId: "", managerId: "" });
  const [managers, setManagers] = useState([]);
  const [isManagersLoading, setIsManagersLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  // Notification Modal state
  const [notificationModal, setNotificationModal] = useState({ open: false, success: false, title: "", message: "" });
  const CARD_WIDTH = 340;
  const GAP = 24;
  const SALONS_PER_PAGE = 2;
  const BRANCH_CONTROLS_PER_PAGE = 5;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch all salons with large page size
        const salonsData = await fetchAdminSalons({ pageSize: 1000 });
        // Fetch all managers to match with salons
        const managersData = await fetchAdminUsers({ role: "Manager", pageSize: 1000 });
        setManagers(managersData.items);

        // fetch staff count for each salon
        const salonsWithCount = await Promise.all(
          salons.map(async (salon) => {
            const [artist, receptionist] = await Promise.all([
              fetchSalonStaffCount(salon.salonId, "Staff_Artist"),
              fetchSalonStaffCount(salon.salonId, "Receptionist"),
            ]);

            return {
              ...salon,
              staffCount: artist + receptionist,
            };
          })
        );

        setSalons(salonsWithCount);

        // Match managers to salons using the new salonId field
        const enrichedSalons = salonsData.items.map(salon => {
          const matchedManager = managersData.items.find(m => m.salonId === salon.id);
          return {
            ...salon,
            manager: matchedManager ? matchedManager.name : "Unassigned"
          };
        });

        setSalons(enrichedSalons);
      } catch (err) {
        console.error("Failed to load salons/managers:", err);
        setError(err.message || "Failed to load salons. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [salonsRefreshKey]);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // Load managers when assign manager modal opens
  useEffect(() => {
    if (showAssignManagerModal) {
      const loadManagers = async () => {
        setIsManagersLoading(true);
        try {
          const result = await fetchAdminUsers({ role: "Manager", pageSize: 1000 });
          setManagers(result.items);
        } catch (err) {
          console.error("Failed to load managers:", err);
        } finally {
          setIsManagersLoading(false);
        }
      };
      loadManagers();
    }
  }, [showAssignManagerModal]);

  // Handle opening assign manager
  const handleAssignManager = async (formData) => {
    const { managerId, salonId } = formData || assignManagerForm;
    console.log("handleAssignManager called with:", { managerId, salonId });

    // Find the selected salon and manager names for the notification
    const selectedSalon = filteredSalons.find(s => s.id === salonId);
    const selectedManager = managers.find(m => m.id === managerId);

    setIsAssigning(true);
    try {
      // First fetch the current raw user data
      const rawUser = await fetchRawAdminUserDetail(managerId);
      console.log("Raw user data:", rawUser);

      // Send all user data plus updated salonId
      await updateAdminUser(managerId, {
        ...rawUser,
        salonId: salonId
      });

      // Show success notification
      setNotificationModal({
        open: true,
        success: true,
        title: "Manager Assigned Successfully",
        message: `${selectedManager?.name || "Manager"} has been assigned to ${selectedSalon?.name || "Salon"} successfully!`
      });

      setSalonsRefreshKey(current => current + 1);
      setShowAssignManagerModal(false);
      setAssignManagerForm({ salonId: "", managerId: "" });
    } catch (err) {
      console.error("Failed to assign manager:", err);
      // Try to get the actual error message from the API response
      const apiErrorMessage = err?.response?.data?.message || err.message;

      // Show error notification instead of just setting error state
      setNotificationModal({
        open: true,
        success: false,
        title: "Failed to Assign Manager",
        message: apiErrorMessage
      });
    } finally {
      setIsAssigning(false);
    }
  };

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
    () => filteredSalons.slice(branchOverviewStart, branchOverviewStart + SALONS_PER_PAGE),
    [filteredSalons, branchOverviewStart],
  );

  const canGoToPreviousBranchSet = branchOverviewStart > 0;
  const canGoToNextBranchSet = branchOverviewStart + SALONS_PER_PAGE < filteredSalons.length;

  // Branch Controls pagination
  const totalBranchControlsPages = useMemo(
    () => Math.ceil(filteredSalons.length / BRANCH_CONTROLS_PER_PAGE),
    [filteredSalons],
  );

  const visibleBranchControlsSalons = useMemo(() => {
    const start = (branchControlsPage - 1) * BRANCH_CONTROLS_PER_PAGE;
    const end = start + BRANCH_CONTROLS_PER_PAGE;
    return filteredSalons.slice(start, end);
  }, [filteredSalons, branchControlsPage]);

  const canGoToPreviousBranchControls = branchControlsPage > 1;
  const canGoToNextBranchControls = branchControlsPage < totalBranchControlsPages;

  const handleNext = () => {
    if (canGoToNextBranchSet) {
      setBranchOverviewStart((prev) => prev + SALONS_PER_PAGE);
    }
  };

  const handlePrev = () => {
    if (canGoToPreviousBranchSet) {
      setBranchOverviewStart((prev) => Math.max(0, prev - SALONS_PER_PAGE));
    }
  };

  // Branch Controls handlers
  const handleBranchControlsNext = () => {
    if (canGoToNextBranchControls) {
      setBranchControlsPage((prev) => prev + 1);
    }
  };

  const handleBranchControlsPrev = () => {
    if (canGoToPreviousBranchControls) {
      setBranchControlsPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    setBranchOverviewStart(0);
    setBranchControlsPage(1);
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

  const handleToggleSlot = (period, slot) => {
    setSelectedSlots(prev => {
      const currentSlots = prev[period];
      const isSelected = currentSlots.includes(slot);

      return {
        ...prev,
        [period]: isSelected
          ? currentSlots.filter(s => s !== slot)
          : [...currentSlots, slot]
      };
    });
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
      label: t("adminSalonManagement.viewSalon"),
      icon: Eye,
      onSelect: () => handleViewSalon(salon),
    },
    {
      key: "edit",
      label: t("adminSalonManagement.editSalon"),
      icon: Pencil,
      onSelect: () => handleUpdateSalon(salon),
    },
    {
      key: "delete",
      label: t("adminSalonManagement.deleteSalon"),
      icon: Trash2,
      className: "text-[#d14c84]",
      onSelect: () => handleDeleteSalon(salon),
    },
  ];

  const salonOptions = useMemo(
    () => salons.map((salon) => ({ value: salon.id, label: salon.name })),
    [salons],
  );

  const salonOptionsWithAddress = useMemo(
    () => salons.map((salon) => ({ value: salon.id, label: `${salon.name} - ${salon.address}` })),
    [salons],
  );

  const salonSummary = useMemo(() => {
    const isVi = language === "vi";
    return [
      {
        label: t("adminDashboard.widgets.totalBranches") || "Total Branches",
        value: salons.length.toString(),
        unit: "",
        note: isVi ? "+2 quý này" : "+2 this quarter",
        icon: BriefcaseBusiness,
        color: "#ea4f93",
      },
      {
        label: isVi ? "Chi nhánh hoạt động" : "Open Salons",
        value: salons.filter((s) => s.status === "Open").length.toString(),
        unit: "",
        note: "98% uptime",
        icon: Check,
        color: "#f59e0b",
      },
      {
        label: isVi ? "Đánh giá trung bình" : "Avg. Rating",
        value: "4.8",
        unit: "/ 5.0",
        note: isVi ? "+0.2 so với tháng trước" : "+0.2 vs last month",
        icon: Sparkles,
        color: "#10b981",
      },
      {
        label: isVi ? "Tổng số nhân viên" : "Total Staff",
        value: salons.reduce((sum, s) => sum + (parseInt(s.staff) || 0), 0).toString(),
        unit: "",
        note: isVi ? "+12 tuyển mới" : "+12 new hires",
        icon: TrendingUp,
        color: "#6366f1",
      },
    ];
  }, [salons, t, language]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <section className="w-full text-slate-700">
      {/*  */}
      {flashMessage ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-[20px] bg-[#edfdf4] px-6 py-4 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </motion.div>
      ) : null}

      {error ? (
        <div className="mb-6">
          <Alert
            message="Error Loading Salons"
            description={error}
            type="error"
            showIcon
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="mb-8 flex min-h-[200px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="mb-8">
          <TopMetricsRow metrics={salonSummary} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
        </div>
      )}

      {!isLoading ? (
        <>
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Branch Overview */}
              <PremiumCard className="p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <SectionHeading
                    title={t("adminSalonManagement.branchOverview")}
                    subtitle={t("adminSalonManagement.snapshotCardsForTheBranchesMat")}
                  />
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {SALON_STATUS_FILTERS.map((tab) => (
                      <motion.button
                        key={tab}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setStatusFilter(tab)}
                        className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-300 ${statusFilter === tab
                          ? "bg-[#ea4f93] text-white shadow-[0_10px_20px_rgba(226,93,143,0.22)]"
                          : "bg-[#fff5fb] text-[#a88a9f] hover:bg-[#fde7ef] hover:text-[#ea4f93]"
                          }`}
                      >
                        {tab === "All" ? (t("adminSalonManagement.all")) : tab === "Open" ? (t("adminSalonManagement.active")) : tab === "Closed" ? (t("adminSalonManagement.inactive")) : (t("adminSalonManagement.busy"))}
                      </motion.button>
                    ))}
                  </div>
                </div>
                {filteredSalons.length > 0 ? (
                  <div className="flex items-center gap-3">
                    {(filteredSalons.length > SALONS_PER_PAGE) && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={handlePrev}
                        disabled={!canGoToPreviousBranchSet}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] shadow-[0_10px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-[#fff5fb] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous salons"
                      >
                        <ChevronLeft size={18} />
                      </motion.button>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden flex justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={branchOverviewStart}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="flex gap-6"
                        >
                          {visibleBranchSalons.map((branch) => (
                            <div
                              key={branch.id}
                              className="w-[340px] shrink-0"
                            >
                              <BranchCard
                                branch={branch}
                                onClick={() => handleViewSalon(branch)}
                              />
                            </div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {(filteredSalons.length > SALONS_PER_PAGE) && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={handleNext}
                        disabled={!canGoToNextBranchSet}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] shadow-[0_10px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-[#fff5fb] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next salons"
                      >
                        <ChevronRight size={18} />
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[#f0b7cf] bg-white px-8 py-12 text-center">
                    <p className="text-[16px] font-bold text-[#2d1b35]">{t("adminSalonManagement.noBranchesMatchedYourFilters")}</p>
                    <p className="mt-2 text-[13px] font-medium text-[#a88a9f]">
                      {t("adminSalonManagement.tryADifferentKeywordOrSwitchTh")}
                    </p>
                  </div>
                )}
              </PremiumCard>
            </div>
            {/* End Left Column */}

            {/* Right Column Aside */}
            <aside className="space-y-6">
              {salons.length > 0 && (
                <>
                  <RightMetricCard
                    title="Top Performing Salon"
                    branch={salons[0].name}
                    city={salons[0].address}
                    concern={{ text: "Great performance!", color: "text-emerald-600" }}
                    values={{
                      image: salons[0].image,
                      occupancy: "92%",
                      revenue: "88%",
                      utilization: "95%"
                    }}
                    buttonLabel="View Details"
                    index={0}
                  />
                  {salons.length > 1 && (
                    <RightMetricCard
                      title="Low Occupancy Salon"
                      branch={salons[salons.length - 1].name}
                      city={salons[salons.length - 1].address}
                      concern={{ text: "Needs attention", color: "text-amber-600" }}
                      values={{
                        image: salons[salons.length - 1].image,
                        occupancy: "35%",
                        revenue: "42%",
                        utilization: "38%"
                      }}
                      buttonLabel="View Details"
                      index={1}
                    />
                  )}
                </>
              )}
            </aside>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mt-6">
            {/* Branch Controls */}
            <PremiumCard className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <SectionHeading
                    title={t("adminSalonManagement.branchControls")}
                    subtitle={language === "vi"
                      ? `Hiển thị ${filteredSalons.length} trên ${salons.length} chi nhánh${searchTerm ? ` • Tìm kiếm: "${searchTerm}"` : ""}${statusFilter !== "All" ? ` • Trạng thái: ${statusFilter === "Open" ? "Đang hoạt động" : statusFilter === "Closed" ? "Ngừng hoạt động" : "Bận"}` : ""}`
                      : `Showing ${filteredSalons.length} of ${salons.length} salons${searchTerm ? ` • Search: "${searchTerm}"` : ""}${statusFilter !== "All" ? ` • Status: ${statusFilter}` : ""}`}
                  />
                </div>
                <div className="flex flex-col gap-4 xl:ml-auto xl:min-w-[640px] xl:items-end">
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex w-full items-center gap-3 rounded-full border border-[#f0b7cf] bg-white px-5 py-3 shadow-inner shadow-[#fff0f8] sm:max-w-[340px]">
                      <Search size={18} className="text-[#ea4f93]" />
                      <input
                        type="text"
                        placeholder={t("adminSalonManagement.searchSalons")}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-[13px] text-[#2d1b35] outline-none placeholder:text-[#c8b0bf]"
                      />
                      {searchTerm || statusFilter !== "All" ? (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={clearFilters}
                          className="rounded-full bg-[#fde7ef] p-2 text-[#ea4f93] transition-all duration-300 hover:bg-[#f0b7cf]"
                        >
                          <X size={14} />
                        </motion.button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        to={ROUTES.adminSalonsCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] px-6 py-3 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition-all duration-300 hover:opacity-90"
                      >
                        <Plus size={20} />
                        {t("adminSalonManagement.addSalon")}
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <SmallActionButton onClick={() => setShowAssignManagerModal(true)}>
                      {t("adminSalonManagement.assignManager")}
                    </SmallActionButton>
                    <SmallActionButton onClick={() => setShowHolidayClosureModal(true)}>
                      {t("adminSalonManagement.holidayClosure")}
                    </SmallActionButton>
                    <SmallActionButton onClick={() => {
                      setActivePeriod(null);
                      setSelectedSlots({
                        morning: TIME_SLOTS.morning.slots,
                        afternoon: TIME_SLOTS.afternoon.slots,
                        evening: TIME_SLOTS.evening.slots
                      });
                      setSelectedSalonId(null);
                      setShowSetHoursModal(true);
                    }}>
                      {t("adminSalonManagement.setHours")}
                    </SmallActionButton>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-[#f5e2ec]">
                <div className="bg-white overflow-x-auto">
                  <Table
                    rowKey="id"
                    dataSource={filteredSalons}
                    pagination={{ pageSize: 5, className: "!mr-6 !mb-6" }}
                    columns={[
                      {
                        title: t("adminSalonManagement.avatar"),
                        dataIndex: "image",
                        key: "image",
                        width: 64,
                        render: (image, salon) => (
                          <img
                            crossOrigin="anonymous"
                            src={image || SALON_PLACEHOLDER_IMAGE}
                            alt={salon.name}
                            className="h-10 w-10 rounded-[14px] object-cover shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        )
                      },
                      {
                        title: t("adminSalonManagement.salon"),
                        key: "salon",
                        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
                        render: (_, salon) => (
                          <div className="min-w-0">
                            <p className="font-bold text-[#2d1b35] truncate">{salon.name}</p>
                            <p className="text-[11px] text-[#a88a9f] truncate">{salon.phone}</p>
                          </div>
                        )
                      },
                      {
                        title: t("adminSalonManagement.address"),
                        dataIndex: "address",
                        key: "address",
                        sorter: (a, b) => (a.address || "").localeCompare(b.address || ""),
                        render: (address) => <p className="truncate max-w-[150px]">{address}</p>
                      },
                      {
                        title: t("adminSalonManagement.manager"),
                        dataIndex: "manager",
                        key: "manager",
                        sorter: (a, b) => (a.manager || "").localeCompare(b.manager || ""),
                        render: (manager) => (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#fde7ef] flex items-center justify-center text-[#ea4f93]">
                              <UserRound size={12} />
                            </div>
                            <span className="truncate max-w-[100px]">{manager}</span>
                          </div>
                        )
                      },
                      {
                        title: t("adminSalonManagement.staff"),
                        dataIndex: "staffCount",
                        key: "staffCount",
                        sorter: (a, b) => (a.staffCount || 0) - (b.staffCount || 0),
                        render: (staffCount) => (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff9fb] px-2.5 py-1 text-[11px] font-semibold">
                            <UserRound size={12} className="text-[#ea4f93]" />
                            {staffCount}
                          </div>
                        )
                      },
                      {
                        title: t("adminSalonManagement.hours1"),
                        dataIndex: "hours",
                        key: "hours",
                        render: (hours) => <p className="truncate max-w-[140px]">{hours}</p>
                      },
                      {
                        title: t("adminSalonManagement.status"),
                        key: "status",
                        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
                        render: (_, salon) => (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold ${salon.statusColor}`}>
                            {salon.status}
                          </span>
                        )
                      },
                      {
                        title: t("adminSalonManagement.actions"),
                        key: "actions",
                        align: "right",
                        render: (_, salon) => (
                          <div className="flex items-center justify-end gap-1.5">
                            <Tooltip title={t("adminSalonManagement.viewSalon")}>
                              <button
                                type="button"
                                onClick={() => handleViewSalon(salon)}
                                aria-label="View Salon"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                              >
                                <Eye size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip title={t("adminSalonManagement.editSalon")}>
                              <button
                                type="button"
                                onClick={() => handleUpdateSalon(salon)}
                                aria-label="Edit Salon"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                              >
                                <Pencil size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip title={t("adminSalonManagement.deleteSalon")}>
                              <button
                                type="button"
                                onClick={() => handleDeleteSalon(salon)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f0b7cf] bg-[#fff0f0] border-rose-200 text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        )
                      }
                    ]}
                    className="custom-admin-table [&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-[#fff9fb] [&_.ant-table-thead_th]:!text-[10px] [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!tracking-[0.14em] [&_.ant-table-thead_th]:!text-[#a88a9f] [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row>td]:!border-b [&_.ant-table-tbody_.ant-table-row>td]:!border-[#f5e2ec] [&_.ant-table-tbody_.ant-table-row]:hover>td:!bg-[#fff9fb] [&_.ant-table-tbody_.ant-table-row>td]:!py-4 [&_.ant-table-tbody_.ant-table-row>td]:!text-[12px] [&_.ant-table-tbody_.ant-table-row>td]:!text-[#5b4256]"
                  />
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </>
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

      <AssignManagerModal
        open={showAssignManagerModal}
        onCancel={() => {
          setShowAssignManagerModal(false);
          setAssignManagerForm({ salonId: "", managerId: "" });
        }}
        onConfirm={handleAssignManager}
        confirmLoading={isAssigning}
        filteredSalons={filteredSalons}
        isLoading={isLoading}
        assignManagerForm={assignManagerForm}
        setAssignManagerForm={setAssignManagerForm}
      />
      <HolidayClosureModal
        open={showHolidayClosureModal}
        onCancel={() => setShowHolidayClosureModal(false)}
        salonOptions={salonOptions}
      />
      <SetOperatingHoursModal
        open={showSetHoursModal}
        onCancel={() => setShowSetHoursModal(false)}
        salonOptions={salonOptions}
      />

      <ActionConfirmModal
        open={notificationModal.open}
        intent={notificationModal.success ? "success" : "danger"}
        title={notificationModal.title}
        subtitle=""
        description={notificationModal.message}
        confirmText={notificationModal.success ? "Okay" : "Close"}
        cancelText={notificationModal.success ? "" : "Cancel"}
        onConfirm={() => setNotificationModal({ ...notificationModal, open: false })}
        onCancel={() => setNotificationModal({ ...notificationModal, open: false })}
        confirmIcon={notificationModal.success ? Check : AlertTriangle}
        width={480}
      />
    </section>
  );
}