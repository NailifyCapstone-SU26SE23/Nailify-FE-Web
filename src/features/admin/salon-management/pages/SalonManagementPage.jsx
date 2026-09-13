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
import toast from "react-hot-toast";
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
import { fetchSalonsPaginated, deleteSalon, fetchSalonRatings } from "../services/salonsService";
import { fetchSalonStaffCount } from "../services/salonManagementService";
import { fetchAdminUsers, updateAdminUser, fetchRawAdminUserDetail } from "../../user-management/services/userManagementService";
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";
import { useDebounce } from "../../../../shared/hooks/useDebounce";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

const PINK_BUTTON_STYLE = { backgroundColor: "#ea4f93", borderColor: "#ea4f93" };

function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-lg border border-[#f5e2ec] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(226,93,143,0.06)]" : ""} ${className}`}
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

function BranchCard({ branch, onClick }) {
  const { t, language } = useLanguage();
  const [ratingData, setRatingData] = useState({ rating: branch.rating, reviews: branch.reviews });

  useEffect(() => {
    let isMounted = true;
    const getRatings = async () => {
      try {
        const ratings = await fetchSalonRatings(branch.id);
        if (isMounted) {
          if (ratings && ratings.length > 0) {
            const sum = ratings.reduce((acc, curr) => acc + curr.overallScore, 0);
            const avg = (sum / ratings.length).toFixed(1);
            setRatingData({ rating: avg, reviews: ratings.length });
          } else {
            setRatingData({ rating: "0.0", reviews: "0" });
          }
        }
      } catch (err) {
        console.error("Failed to load rating for branch:", branch.id);
      }
    };
    getRatings();
    return () => { isMounted = false; };
  }, [branch.id]);

  const displayStatus = branch.status.toLowerCase() === "open"
    ? (language === "vi" ? "Mở cửa" : "Open")
    : (language === "vi" ? "Đóng cửa" : "Closed");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#f5e2ec] bg-white text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all"
    >
      <div className="relative h-44 w-full shrink-0">
        <img
          crossOrigin="anonymous"
          src={branch.image}
          alt={branch.name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute right-4 top-4 z-10">
          <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[11px] font-bold shadow-md ${branch.statusColor}`}>
            {displayStatus}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold text-[#2d1b35]">{branch.name}</p>
          </div>
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

        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[#f5e2ec] pt-4">
          <div className="flex items-center gap-1 text-[#f59e0b]">
            {Array.from({ length: 5 }).map((_, i) => {
              const isFilled = i < Math.round(Number(ratingData.rating));
              return (
                <Star key={`${branch.id}-${i}`} size={16} fill={isFilled ? "currentColor" : "none"} strokeWidth={isFilled ? 0 : 1.5} color={isFilled ? "transparent" : "currentColor"} />
              );
            })}
          </div>
          <p className="text-[12px] font-semibold text-[#a88a9f]">
            <span className="font-bold text-[#2d1b35]">{ratingData.rating}</span> ({ratingData.reviews} {language === "vi" ? "đánh giá" : "reviews"})
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

  let internalStatus = "Open";
  let statusColor = "bg-[#e6fdf0] text-[#16975f]";
  let statusTone = "bg-[#e6fdf0] text-[#16975f]";

  if (apiStatus === "closed") {
    internalStatus = "Closed";
    statusColor = "bg-[#fff0f0] text-[#e53e3e]";
    statusTone = "bg-[#fff0f0] text-[#e53e3e]";
  } else if (apiStatus === "busy") {
    internalStatus = "Open";
  } else if (apiStatus === "open") {
    internalStatus = "Open";
  } else {
    internalStatus = "Closed";
    statusColor = "bg-[#fff0f0] text-[#e53e3e]";
    statusTone = "bg-[#fff0f0] text-[#e53e3e]";
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
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const { t, language } = useLanguage();
  const [salonsRefreshKey, setSalonsRefreshKey] = useState(0);
  const [salons, setSalons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "error-msg" });
    }
  }, [error]);

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
  const SALONS_PER_PAGE = 3;
  const BRANCH_CONTROLS_PER_PAGE = 5;
  const loadSalons = async (page = 1, search = "", status = statusFilter) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadMore(true);
    setError("");

    try {
      const data = await fetchSalonsPaginated({
        pageNumber: page,
        pageSize: 6,
        name: search.trim() || undefined,
        status: status !== "All" ? status : undefined
      });

      const newItems = Array.isArray(data?.items) ? data.items.map(mapApiSalonToUiFormat) : [];

      if (page === 1) {
        setSalons(newItems);
      } else {
        setSalons(prev => [...prev, ...newItems]);
      }

      setHasMore(data?.metaData?.hasNext || false);
      setPageIndex(page);
    } catch (err) {
      console.error("Failed to load salons:", err);
      toast.error(err.message || "Failed to load salons.");
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  useEffect(() => {
    const loadInitialDeps = async () => {
      try {
        const managersData = await fetchAdminUsers({ role: "Manager", pageSize: 1000 });
        setManagers(managersData.items);
      } catch (err) {
        console.error("Failed to load managers:", err);
      }
    };
    loadInitialDeps();
  }, []);

  useEffect(() => {
    loadSalons(1, debouncedSearchTerm, statusFilter);
  }, [debouncedSearchTerm, statusFilter, salonsRefreshKey]);

  useEffect(() => {
    if (location.state?.flashMessage) {
      toast.success(location.state.flashMessage, { id: "salon-flash-msg" });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state?.flashMessage, navigate]);

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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadMore) {
      loadSalons(pageIndex + 1, debouncedSearchTerm, statusFilter);
    }
  };

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
        label: isVi ? "Đánh giá trung bình" : "Avg Rating",
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
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
          <PremiumCard className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <SectionHeading
                  title={t("adminSalonManagement.branchOverview")}
                  subtitle={t("adminSalonManagement.snapshotCardsForTheBranchesMat")}
                />
                <div className="flex items-center gap-3">
                  <Link
                    to={ROUTES.adminSalonsCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#cf3d74] px-6 py-3 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(226,93,143,0.32)] transition-all duration-300 hover:opacity-90"
                  >
                    <Plus size={20} />
                    {t("adminSalonManagement.addSalon")}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-slate-50/50 rounded-2xl p-4 border border-slate-100/60">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <Select
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                    }}
                    className="w-full sm:w-[150px] min-w-[150px] custom-select"
                    style={{ height: "46px" }}
                    options={[
                      { value: "All", label: language === "vi" ? "Tất cả" : "All" },
                      { value: "Open", label: language === "vi" ? "Mở cửa" : "Open" },
                      { value: "Closed", label: language === "vi" ? "Đóng cửa" : "Closed" },
                    ]}
                  />
                  <div className="flex flex-1 sm:flex-none items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-inner shadow-slate-50 sm:w-[340px] focus-within:border-[#ea4f93] focus-within:ring-2 focus-within:ring-[#ea4f93]/20 transition-all">
                    <Search size={18} className="text-[#a88a9f]" />
                    <input
                      type="text"
                      placeholder={t("adminSalonManagement.searchSalons")}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full bg-transparent text-[13px] text-[#2d1b35] outline-none placeholder:text-[#a88a9f]"
                    />
                    {searchTerm ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={clearFilters}
                        className="rounded-full bg-[#fde7ef] p-1.5 text-[#ea4f93] transition-all duration-300 hover:bg-[#f0b7cf]"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </motion.button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200/60 xl:border-l xl:pl-4">
                  <SmallActionButton onClick={() => setShowAssignManagerModal(true)}>
                    <UserRound size={14} className="mr-1.5 inline" />
                    {t("adminSalonManagement.assignManager")}
                  </SmallActionButton>
                  <SmallActionButton onClick={() => setShowHolidayClosureModal(true)}>
                    <Calendar size={14} className="mr-1.5 inline" />
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
                    <Clock3 size={14} className="mr-1.5 inline" />
                    {t("adminSalonManagement.setHours")}
                  </SmallActionButton>
                </div>
              </div>
            </div>
          </PremiumCard>

          {salons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onClick={() => handleViewSalon(branch)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#f0b7cf] bg-white px-8 py-12 text-center">
              <p className="text-[16px] font-bold text-[#2d1b35]">{t("adminSalonManagement.noBranchesMatchedYourFilters")}</p>
              <p className="mt-2 text-[13px] font-medium text-[#a88a9f]">
                {t("adminSalonManagement.tryADifferentKeywordOrSwitchTh")}
              </p>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-8 pb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLoadMore}
                disabled={isLoadMore}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#ea4f93] bg-white px-8 py-3 text-[15px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb] disabled:opacity-50"
              >
                {isLoadMore ? <Spin size="small" /> : language === 'vi' ? "Hiện thêm" : "View more"}
              </motion.button>
            </div>
          )}
        </motion.div>
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
        filteredSalons={salons}
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
