import { Modal, Spin, Alert, Select, Drawer } from "antd";
import {
  Users,
  Clock3,
  CheckCircle2,
  Star,
  Plus,
  Download,
  Search,
  Building2,
  X,
  User,
  Edit3,
  CalendarDays,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES, getAdminStaffUpdateRoute } from "../../../../shared/constants/routes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { fetchAdminSalons } from "../../salon-management/services/salonManagementService";
import { fetchSalonStaff, fetchArtistSchedule, fetchTodaySchedules } from "../services/staffManagementService";
import { fetchUserById } from "../../../manager/bookings/services/bookingsService";
import { fetchNailArtistSkills } from "../../../manager/staff-artist-management/services/nailArtistsService";

const ALL_ROLES_VALUE = "__all__";

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-2xl border border-[#f0d9e8] bg-white p-6 shadow-[0_4px_16px_rgba(236,72,153,0.08)] transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(236,72,153,0.12)] md:p-7 ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-base font-bold text-[#2d1b35]">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-xs text-[#a88a9f]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function MetricCard({ item }) {
  const Icon = item.icon || Users;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.iconClassName} shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold leading-none text-[#2d1b35]">{item.value}</p>
      <p className="mt-2 text-sm font-medium text-[#8b7382]">{item.label}</p>
      <p className={`mt-2 text-xs font-medium ${item.noteClassName}`}>{item.note}</p>
    </Card>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.elementType,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    noteClassName: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">{label}</p>
      <div className="mt-2 text-sm font-medium text-[#2d1b35] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function StaffAvatar({ staff, className, fallbackClassName = "" }) {
  const [hasImageError, setHasImageError] = useState(false);
  const avatarUrl = typeof staff.avatarUrl === "string" ? staff.avatarUrl.trim() : "";

  if (avatarUrl && !hasImageError) {
    return (
      <img
        crossOrigin="anonymous"
        src={avatarUrl}
        alt={staff.name}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <div className={fallbackClassName}>{staff.initials}</div>;
}

StaffAvatar.propTypes = {
  className: PropTypes.string,
  fallbackClassName: PropTypes.string,
  staff: PropTypes.shape({
    avatarUrl: PropTypes.string,
    initials: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

function StaffCard({ staff, onClick }) {
  const { t, language } = useLanguage();
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-[#f0d9e8] bg-white p-5 shadow-[0_4px_16px_rgba(236,72,153,0.08)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(236,72,153,0.12)]"
    >
      <div className="flex items-start gap-3">
        <StaffAvatar
          staff={staff}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
          fallbackClassName={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} text-xs font-bold text-white`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#2d1b35] truncate">{staff.name}</p>
          <p className="text-xs text-[#a88a9f] truncate">{staff.role}</p>
          {staff.phone && <p className="mt-1 text-xs text-[#8b7382] truncate">{staff.phone}</p>}
        </div>
        {staff.hasScheduleToday && (
          <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
            {t("adminStaffManagement.workingToday")}
          </span>
        )}
      </div>
    </div>
  );
}

StaffCard.propTypes = {
  staff: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    initials: PropTypes.string.isRequired,
    avatarTone: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
};

// Helper: đọc field theo nhiều tên có thể có (giống style normalizeStaffMember
// bên service) vì chưa biết chính xác field name BE trả về cho lịch làm việc.
function pickField(entry, keys) {
  for (const key of keys) {
    if (entry?.[key] !== undefined && entry[key] !== null && entry[key] !== "") {
      return entry[key];
    }
  }
  return null;
}

function ScheduleEntryRow({ entry }) {
  const date = pickField(entry, ["date", "workDate", "scheduleDate", "day"]);
  const start = pickField(entry, ["startTime", "start", "from", "checkIn"]);
  const end = pickField(entry, ["endTime", "end", "to", "checkOut"]);
  const status = pickField(entry, ["status", "scheduleStatus"]);

  // Format date nicely
  const { t, language } = useLanguage();
  const formattedDate = useMemo(() => {
    if (!date) return "—";
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }
    } catch (e) {
      // Ignore
    }
    return date;
  }, [date, language]);

  const getStatusColor = () => {
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus.includes("active") || lowerStatus.includes("working")) {
      return "bg-[#eaf9ee] text-[#2fa25f] border-[#b8e6c7]";
    }
    if (lowerStatus.includes("leave") || lowerStatus.includes("off")) {
      return "bg-[#fff0f8] text-[#ea4f93] border-[#f0d9e8]";
    }
    return "bg-[#fff0f8] text-[#8b7382] border-[#f0d9e8]";
  };

  const getStatusIcon = () => {
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus.includes("active") || lowerStatus.includes("working")) {
      return <CheckCircle size={12} />;
    }
    if (lowerStatus.includes("leave") || lowerStatus.includes("off")) {
      return <XCircle size={12} />;
    }
    return <Clock size={12} />;
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#f0d9e8] bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#ea4f93] hover:shadow-md">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#ff8ebb] to-[#ea4f93]"></div>
      <div className="ml-2 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fff0f8] to-[#fff5f9] text-[#ea4f93]">
            <Calendar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#2d1b35] truncate">{formattedDate}</p>
            {(start || end) && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#a88a9f]">
                <Clock size={12} />
                <span>{start || "?"} - {end || "?"}</span>
              </div>
            )}
          </div>
        </div>
        {status && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusColor()}`}>
            {getStatusIcon()}
            {(status.toLowerCase().includes("active") || status.toLowerCase().includes("working") ? t("adminStaffManagement.workingToday") : (status.toLowerCase().includes("leave") || status.toLowerCase().includes("off") ? t("adminStaffManagement.onLeave") : status))
            }
          </span>
        )}
      </div>
    </div>
  );
}

ScheduleEntryRow.propTypes = {
  entry: PropTypes.object.isRequired,
};

export function StaffManagementPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(ALL_ROLES_VALUE);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
  const [staffSkills, setStaffSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [staffSchedule, setStaffSchedule] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loadingTodaySchedules, setLoadingTodaySchedules] = useState(false);

  // const availableTodayCount = useMemo(() => {
  //   return new Set(
  //     todaySchedules
  //       .filter(s => s.salonId === selectedSalonId)
  //       .map(s => s.nailArtistId)
  //   ).size;
  // }, [todaySchedules, selectedSalonId]);


  const todayArtistIds = useMemo(() => {
    return new Set(todaySchedules.map(s => s.nailArtistId));
  }, [todaySchedules]);

  const availableTodayCount = useMemo(() => {
    return staffList.filter(staff =>
      staff.role === "Staff_Artist" &&
      todayArtistIds.has(staff.staffId)
    ).length;
  }, [staffList, todayArtistIds]);

  // Handle opening staff detail drawer
  const handleOpenDrawer = useCallback(async (userId) => {
    setIsDrawerOpen(true);
    setIsLoadingDrawer(true);
    setIsLoadingSkills(true);
    setIsLoadingSchedule(true);
    setStaffSkills([]);
    setStaffSchedule([]);
    try {
      const staffData = await fetchUserById(userId);

      const isNailArtist = staffData.role === 'Staff_Artist' || staffData.role === 'NAIL_ARTIST';

      // Fetch skills + schedule song song nếu staff là nail artist và có staffId
      // (staffId ở đây là nailArtistId, không phải userId)
      if (isNailArtist && staffData.staffId) {
        const [skillsResult, scheduleResult] = await Promise.allSettled([
          fetchNailArtistSkills(staffData.staffId),
          fetchArtistSchedule(staffData.staffId),
        ]);

        if (skillsResult.status === "fulfilled") {
          setStaffSkills(skillsResult.value || []);
        } else {
          console.warn("Failed to load staff skills:", skillsResult.reason);
          setStaffSkills([]);
        }

        if (scheduleResult.status === "fulfilled") {
          setStaffSchedule(scheduleResult.value || []);
        } else {
          console.warn("Failed to load staff schedule:", scheduleResult.reason);
          setStaffSchedule([]);
        }
      } else {
        setStaffSkills([]);
        setStaffSchedule([]);
      }

      setSelectedStaff(staffData);
    } catch (err) {
      console.error("Failed to load staff details:", err);
    } finally {
      setIsLoadingDrawer(false);
      setIsLoadingSkills(false);
      setIsLoadingSchedule(false);
    }
  }, []);

  const itemsPerPage = 6;

  const roleOptions = [
    { value: ALL_ROLES_VALUE, label: t("adminStaffManagement.allRoles") },
    { value: "Staff_Artist", label: t("adminStaffManagement.staffArtist") },
    { value: "Manager", label: t("adminStaffManagement.manager") },
    { value: "Receptionist", label: t("adminStaffManagement.receptionist") },
  ];

  const loadSalons = useCallback(async () => {
    try {
      setLoadingSalons(true);
      setError(null);
      const result = await fetchAdminSalons({ pageSize: 100 });
      setSalons(result.items || []);
      if (result.items && result.items.length > 0) {
        setSelectedSalonId(result.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load salons:", err);
      setError(err.message || "Failed to load salons.");
    } finally {
      setLoadingSalons(false);
    }
  }, []);

  const loadStaffForSalon = useCallback(async (salonId) => {
    if (!salonId) {
      setStaffList([]);
      return;
    }

    try {
      setLoadingStaff(true);
      const result = await fetchSalonStaff(salonId, {
        pageIndex: currentPage,
        pageSize: itemsPerPage,
        role: selectedRole === ALL_ROLES_VALUE ? null : selectedRole,
      });
      setStaffList(result.items || []);
      setTotalPages(result.metaData?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  }, [currentPage, selectedRole]);

  useEffect(() => {
    Promise.resolve().then(() => loadSalons());
  }, [loadSalons]);

  useEffect(() => {
    if (selectedSalonId) {
      loadStaffForSalon(selectedSalonId);
    }
  }, [selectedSalonId, selectedRole, loadStaffForSalon]);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) {
      return staffList;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return staffList.filter(staff =>
      staff.name.toLowerCase().includes(lowerQuery) ||
      (staff.role && staff.role.toLowerCase().includes(lowerQuery))
    );
  }, [staffList, searchQuery]);


  const stats = useMemo(() => {
    const selectedSalon = salons.find(s => s.id === selectedSalonId);
    const isVi = language === "vi";
    return [
      {
        label: isVi ? "Tổng số nhân viên" : "Total Staff",
        value: staffList.length.toString(),
        icon: Users,
        iconClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white",
        note: selectedSalon?.name || (isVi ? "Tất cả chi nhánh" : "All Salons"),
        noteClassName: "text-[#c08aa4]",
      },
      {
        label: isVi ? "Sẵn sàng hôm nay" : "Available Today",
        value: availableTodayCount,
        icon: CheckCircle2,
        iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
        note: isVi ? "Trạng thái hiện tại" : "Current status",
        noteClassName: "text-[#c08aa4]",
      },
      {
        label: isVi ? "Đánh giá trung bình" : "Average Rating",
        value: selectedSalon?.avgRating?.toFixed(2) || 0,
        icon: Star,
        iconClassName: "bg-[#fff8e1] text-[#f59e0b]",
        note: isVi ? "Sự hài lòng khách hàng" : "Customer satisfaction",
        noteClassName: "text-[#2fa25f]",
      },
      {
        label: isVi ? "Đang nghỉ phép" : "On Leave",
        value: selectedSalon?.onLeaveStaffCount || 0,
        icon: Clock3,
        iconClassName: "bg-[#fff0f8] text-[#ea4f93]",
        note: isVi ? "Nhân viên nghỉ phép" : "Staff on leave",
        noteClassName: "text-[#c08aa4]",
      },
    ];
  }, [salons, selectedSalonId, staffList, language]);

  const loadTodaySchedules = useCallback(async () => {
    try {
      setLoadingTodaySchedules(true);

      const schedules = await fetchTodaySchedules();
      setTodaySchedules(schedules);
    } catch (err) {
      console.error(err);
      setTodaySchedules([]);
    } finally {
      setLoadingTodaySchedules(false);
    }
  }, []);

  useEffect(() => {
    loadTodaySchedules();
  }, [loadTodaySchedules]);


  return (
    <section className="flex min-h-full flex-col gap-4">
      {error && (
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
        />
      )}

      <Card className="overflow-hidden border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-0 shadow-lg">
        <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-xl">
                <Users size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2d1b35]">
                  {t("menus.admin-staff") || "Staff Management"}
                </h1>
                <p className="text-sm text-[#a6869a]">
                  {t("adminStaffManagement.manageStaffDesc")}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#8b7382]">
              {t("adminStaffManagement.viewManageStaffDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f0d9e8] bg-white px-4 py-2.5 text-xs font-semibold text-[#ea4f93] shadow-md hover:shadow-lg hover:border-[#ea4f93] transition duration-200"
            >
              <Download size={16} />
              {t("adminStaffManagement.export")}
            </button>
            <Link
              to={ROUTES.adminStaffCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ea4f93] to-[#ff8ebb] px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:shadow-xl transition duration-200"
            >
              <Plus size={16} />
              {t("adminStaffManagement.addStaff")}
            </Link>
          </div>
        </div>
      </Card>

      {!loadingSalons && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <MetricCard key={index} item={item} />
          ))}
        </div>
      )}

      <div className="grid gap-4">
        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-[#f0d9e8] bg-gradient-to-b from-[#fff9fb] to-[#fffafb] p-6 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeading
              title={t("adminStaffManagement.salonStaff")}
              subtitle={filteredStaff.length === 1 ? t("adminStaffManagement.staffCountSingle", { count: 1 }) : t("adminStaffManagement.staffCount", { count: filteredStaff.length })}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#a88a9f]" />
                <Select
                  style={{ width: 250 }}
                  placeholder={t("adminStaffManagement.selectSalon")}
                  value={selectedSalonId}
                  onChange={setSelectedSalonId}
                  options={salons.map(s => ({ label: s.name, value: s.id }))}
                  disabled={loadingSalons}
                />
              </div>
              <Select
                style={{ width: 180 }}
                placeholder={t("adminStaffManagement.selectRole")}
                value={selectedRole}
                onChange={setSelectedRole}
                options={roleOptions.map((option) => ({
                  ...option,
                  value: option.value ?? ALL_ROLES_VALUE,
                }))}
                disabled={loadingStaff}
              />
              <label className="relative block min-w-[220px]">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a88a9f]"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("adminStaffManagement.searchStaffPlaceholder")}
                  className="h-10 w-full rounded-full border border-[#f0d9e8] bg-white pl-9 pr-4 text-xs text-[#5c4158] outline-none transition placeholder:text-[#d198b0] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/20"
                />
              </label>
            </div>
          </div>

          <div className="p-6">
            {loadingSalons ? (
              <div className="flex justify-center py-10">
                <Spin size="large" />
              </div>
            ) : loadingStaff ? (
              <div className="flex justify-center py-10">
                <Spin size="large" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f8]">
                  <Users size={32} className="text-[#ea4f93]" />
                </div>
                <p className="text-sm text-[#8b7382]">
                  {selectedSalonId
                    ? (t("adminStaffManagement.noStaffFound"))
                    : (t("adminStaffManagement.selectSalonToView"))}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {/* {filteredStaff.map((staff) => (
                    <StaffCard
                      key={staff.id}
                      staff={staff}
                      onClick={() => handleOpenDrawer(staff.userId || staff.id)}
                    />
                  ))} */}
                  {filteredStaff.map((staff) => (
                    <StaffCard
                      key={staff.id}
                      staff={{
                        ...staff,
                        hasScheduleToday: todayArtistIds.has(staff.staffId),
                      }}
                      onClick={() => handleOpenDrawer(staff.userId || staff.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-end pt-6 border-t border-[#f0d9e8] bg-gradient-to-b from-[#fffafb] to-white">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Staff Detail Drawer */}
        <Drawer
          title={null}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedStaff(null);
          }}
          size="large"
          styles={{
            body: { padding: 0 },
            section: { background: "#fafafa" }
          }}
          placement="right"
          mask={true}
          maskClosable={true}
          destroyOnClose
          closable={false}
        >
          {isLoadingDrawer ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : selectedStaff ? (
            <div className="bg-[#fafafa] h-full flex flex-col">
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-[#ea4f93] via-[#ff7ba4] to-[#ffaab6] shadow-md p-6 rounded-b-3xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <StaffAvatar
                      staff={{
                        ...selectedStaff,
                        name: `${selectedStaff.firstName || ""} ${selectedStaff.lastName || ""}`.trim() || "Avatar",
                        initials: `${(selectedStaff.firstName || "S")[0]}${(selectedStaff.lastName || "")[0]}`.toUpperCase(),
                      }}
                      className="h-14 w-14 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                      fallbackClassName="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white text-2xl font-bold border-2 border-white/30 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/85">
                        {t("adminStaffManagement.staffDetails")}
                      </p>
                      <h2 className="text-xl font-bold text-white mt-1 truncate">
                        {selectedStaff.firstName || ''} {selectedStaff.lastName || ''}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setSelectedStaff(null);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 flex-shrink-0"
                  >
                    <X size={20} color="#ffffff" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {selectedStaff.role && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                      {selectedStaff.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Personal Information */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                  <h3 className="text-sm font-bold text-[#2d1b35] mb-4">
                    {t("adminStaffManagement.personalInfo")}
                  </h3>
                  <div className="space-y-4">
                    <InfoItem label={t("adminStaffManagement.firstName")}>{selectedStaff.firstName || '-'}</InfoItem>
                    <InfoItem label={t("adminStaffManagement.lastName")}>{selectedStaff.lastName || '-'}</InfoItem>
                    <InfoItem label="Email">{selectedStaff.email || '-'}</InfoItem>
                    <InfoItem label={t("adminStaffManagement.phoneNumber")}>{selectedStaff.phone || '-'}</InfoItem>
                  </div>
                </div>

                {/* Account Information */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                  <h3 className="text-sm font-bold text-[#2d1b35] mb-4">
                    {t("adminStaffManagement.accountInfo")}
                  </h3>
                  <div className="space-y-4">
                    <InfoItem label={t("adminStaffManagement.role")}>{selectedStaff.role || '-'}</InfoItem>
                    <InfoItem label={language === "vi" ? "Trạng thái" : "Status"}>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#eaf9ee] text-[#2fa25f]">
                        {selectedStaff.status === 'Active' || !selectedStaff.status ? t("adminStaffManagement.workingToday") : selectedStaff.status}
                      </span>
                    </InfoItem>
                  </div>
                </div>

                {/* Skills Section (for Nail Artists) */}
                {(selectedStaff.role === 'Staff_Artist' || selectedStaff.role === 'NAIL_ARTIST') && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                    <h3 className="text-sm font-bold text-[#2d1b35] mb-4">
                      {t("adminStaffManagement.skillsSpecialties")}
                    </h3>
                    {isLoadingSkills ? (
                      <div className="flex justify-center py-4">
                        <Spin size="small" />
                      </div>
                    ) : staffSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {staffSkills.map((skill, index) => (
                          <span
                            key={skill.id || index}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#fff0f8] to-[#fff5f9] px-3 py-1.5 text-xs font-semibold text-[#ea4f93] border border-[#f0d9e8]"
                          >
                            {skill.skillTypeName || skill.name || 'Skill'}
                            {skill.level ? (
                              <span className="text-[10px] text-[#c07f9e]">
                                (Level {skill.level})
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#a88a9f]">
                        {t("adminStaffManagement.noSkillsAssigned")}
                      </p>
                    )}
                  </div>
                )}

                {/* Working Schedule Section (for Nail Artists) */}
                {(selectedStaff.role === 'Staff_Artist' || selectedStaff.role === 'NAIL_ARTIST') && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays size={16} className="text-[#ea4f93]" />
                      <h3 className="text-sm font-bold text-[#2d1b35]">
                        {t("adminStaffManagement.workingSchedule")}
                      </h3>
                    </div>
                    {isLoadingSchedule ? (
                      <div className="flex justify-center py-4">
                        <Spin size="small" />
                      </div>
                    ) : staffSchedule.length > 0 ? (
                      <div className="space-y-2">
                        {staffSchedule.map((entry, index) => (
                          <ScheduleEntryRow key={entry.id || index} entry={entry} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#a88a9f]">
                        {t("adminStaffManagement.noScheduleAvailable")}
                      </p>
                    )}
                  </div>
                )}

                {/* Update Button */}
                <div className="pt-4 border-t border-[#f0d9e8]">
                  <Link
                    to={getAdminStaffUpdateRoute(selectedStaff.id || selectedStaff.userId)}
                    onClick={() => {
                      setIsDrawerOpen(false);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-violet-500 bg-white px-4 py-3 text-xs font-bold text-violet-600 shadow-lg transition-all hover:bg-violet-50 hover:border-violet-600 hover:scale-[1.02]"
                  >
                    <Edit3 size={14} />
                    {t("adminStaffManagement.updateProfile")}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </Drawer>
      </div>
    </section>
  );
}