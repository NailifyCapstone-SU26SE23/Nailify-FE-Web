import {
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
  UserRound,
  Wrench,
  Camera,
  Eye,
  Upload,
  X,
  ChevronDown,
  Percent,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import {
  ROUTES,
  getAdminSalonUpdateRoute,
} from "../../../../shared/constants/routes";
import { mapSalonOperatingHours, normalizeAdminSalon, fetchAdminSalonDetail } from "../services/salonManagementService";
import { uploadSalonImage } from "../services/salonsService";
import { fetchAdminUsers } from "../../user-management/services/userManagementService";
import {
  SALON_DAYS_OF_WEEK,
} from "../services/mockSalon";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

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

/**
 * `padded` lets callers (like the new avatar hero card) opt out of the
 * default p-6 so a full-bleed banner can sit flush against the edges.
 *
 * `allowOverflow` lets callers (like the hero card, which has a dropdown
 * menu that needs to visually escape the card's rounded-corner clipping)
 * switch from `overflow-hidden` to `overflow-visible`. When using this,
 * any content that still needs cropping (like the banner image) should be
 * wrapped in its own `overflow-hidden` container instead.
 */
function PremiumCard({ className = "", children, noHover = false, padded = true, allowOverflow = false }) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`relative ${allowOverflow ? "overflow-visible" : "overflow-hidden"} rounded-[28px] border border-[#f1e7ed] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${padded ? "p-6" : ""} ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)]" : ""} ${className}`}
    >
      {children}
    </motion.article>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      className="group rounded-[16px] border border-[#f1e7ed] bg-[#fff8fb] p-5 transition-all duration-300 hover:border-[#f0b7cf] hover:bg-white hover:shadow-[0_12px_24px_-10px_rgba(234,79,147,0.18)]"
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fde7ef] text-[#ea4f93] transition-colors duration-300 group-hover:bg-[#ea4f93] group-hover:text-white">
            <Icon size={14} />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a88a9f]">
          {label}
        </span>
      </div>
      <p className="text-[14px] font-medium text-[#2d1b35] break-all">{value}</p>
    </motion.div>
  );
}

function SalonDetailLoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#ea4f93]" />
        <p className="mt-4 text-[14px] font-medium text-[#a88a9f]">Loading salon details...</p>
      </div>
    </div>
  );
}

export function SalonDetailPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salonForm, setSalonForm] = useState(null);
  const [salonRow, setSalonRow] = useState(null);
  const [managers, setManagers] = useState([]);

  // Avatar menu and modals
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showViewAvatarModal, setShowViewAvatarModal] = useState(false);
  const [showUpdateAvatarModal, setShowUpdateAvatarModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const menuRef = useRef(null);

  const salonDetail = useMemo(() => {
    if (!salonForm && !salonRow) {
      return null;
    }

    // Find manager assigned to this salon using salonId
    const matchedManager = managers.find(m => m.salonId === salonId);

    return {
      name: salonForm?.salonName || salonRow?.name || "Unknown Salon",
      address: salonForm?.address || salonRow?.address || "No address",
      manager: matchedManager ? matchedManager.name : "Unassigned",
      phone: salonForm?.phone || salonRow?.phone || "Not set",
      staff: (salonForm?.staffAmount ?? salonRow?.staffCount),
      status: salonForm?.status || salonRow?.status || "Active",
      statusColor: salonRow?.statusColor || "bg-[#eaf9ee] text-[#238a55]",
      image: salonRow?.image || SALON_PLACEHOLDER_IMAGE,
      hours: salonRow?.hours || "Operating hours unavailable",
      rating: salonRow?.rating || "-",
      reviews: salonRow?.reviews || "0",
      operatingHours: salonForm?.operatingHours || {},
      description: salonForm?.description || "",
      depositConfig: salonForm?.depositConfig || salonRow?.depositConfig || "",
    };
  }, [salonForm, salonRow, managers, salonId]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setIsNotFound(false);

      try {
        // Fetch salon details and managers
        const [normalizedSalon, managersData] = await Promise.all([
          fetchAdminSalonDetail(salonId),
          fetchAdminUsers({ role: "Manager", pageSize: 1000 })
        ]);

        setManagers(managersData.items);

        if (!isMounted) {
          return;
        }

        setSalonForm({
          salonName: normalizedSalon.name,
          address: normalizedSalon.address,
          manager: normalizedSalon.manager,
          phone: normalizedSalon.phone,
          staffAmount: normalizedSalon.staffCount,
          status: normalizedSalon.status,
          operatingHours: normalizedSalon.operatingHours,
          depositConfig: normalizedSalon.depositConfig,
        });
        setSalonRow(normalizedSalon);
      } catch (err) {
        console.error("Failed to load salon:", err);
        if (isMounted) {
          setIsNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [salonId]);

  const detailItems = useMemo(() => {
    if (!salonDetail) {
      return [];
    }

    const isVi = language === "vi";
    return [
      { icon: MapPin, label: isVi ? "Địa chỉ" : "Address", value: salonDetail.address },
      { icon: UserRound, label: isVi ? "Quản lý" : "Manager", value: salonDetail.manager === "Unassigned" ? (isVi ? "Chưa phân bổ" : "Unassigned") : salonDetail.manager || (isVi ? "Chưa phân bổ" : "Unassigned") },
      { icon: Phone, label: isVi ? "Điện thoại" : "Phone", value: salonDetail.phone === "Not set" ? (isVi ? "Chưa thiết lập" : "Not set") : salonDetail.phone || (isVi ? "Chưa thiết lập" : "Not set") },
      { icon: Percent, label: isVi ? "Phần trăm cọc" : "Deposit Config", value: salonDetail.depositConfig ? `${salonDetail.depositConfig}%` : (isVi ? "Chưa thiết lập" : "Not set") },
      { icon: Clock3, label: isVi ? "Giờ mở cửa" : "Operating Hours", value: salonDetail.hours === "Operating hours unavailable" ? (isVi ? "Không khả dụng" : "Operating hours unavailable") : salonDetail.hours },
      { icon: Wrench, label: isVi ? "Số lượng nhân viên" : "Staff Amount", value: salonDetail.staff },
      {
        icon: Star,
        label: isVi ? "Đánh giá" : "Rating",
        value: isVi ? `${salonDetail.rating || "-"} (${salonDetail.reviews || "0"} đánh giá)` : `${salonDetail.rating || "-"} (${salonDetail.reviews || "0"} reviews)`,
      },
    ];
  }, [salonDetail, language]);

  const operatingHoursMap = useMemo(
    () => {
      if (!salonDetail?.operatingHours) {
        return mapSalonOperatingHours([]);
      }

      if (Array.isArray(salonDetail.operatingHours)) {
        return mapSalonOperatingHours(salonDetail.operatingHours);
      }

      return salonDetail.operatingHours;
    },
    [salonDetail?.operatingHours],
  );

  const handleDeleteSalon = () => {
    if (!salonRow) {
      return;
    }
    // TODO: Connect to delete API
    navigate(ROUTES.adminSalons, {
      state: {
        flashMessage: `${salonRow.name} has been deleted successfully.`,
      },
    });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!selectedImage || !salonId) {
      return;
    }

    setIsUploading(true);

    try {
      await uploadSalonImage(salonId, selectedImage);

      // Refresh salon details after upload
      const normalizedSalon = await fetchAdminSalonDetail(salonId);
      setSalonRow(normalizedSalon);

      setShowUpdateAvatarModal(false);
      setSelectedImage(null);
    } catch (err) {
      console.error("Failed to update avatar:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isNotFound) {
    return <Navigate to={ROUTES.adminSalons} replace />;
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto w-full min-w-0 max-w-[1300px]"
    >

      <header className="mb-6 flex flex-col gap-5">
        <motion.div variants={fadeInUp} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className=" text-[32px] font-bold text-[#3f2034]">
              {salonDetail?.name || (t("adminSalonManagement.salonDetail"))}
            </h1>
            <p className="mt-1 text-sm text-[#a6869a]">
              {t("adminSalonManagement.reviewBranchInformationAndMana")}
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-[12px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff8fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              {t("adminSalonManagement.delete")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(getAdminSalonUpdateRoute(salonId))}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d6376f] px-6 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(234,79,147,0.32)] transition-all duration-300 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil size={16} />
              {t("adminSalonManagement.editSalon")}
            </motion.button>
          </div>
        </motion.div>
      </header>

      {isLoading ? (
        <SalonDetailLoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-6">
            {/* Salon Avatar / Hero Card */}
            <PremiumCard
              padded={false}
              noHover
              allowOverflow
              className={showAvatarMenu ? "z-20" : ""}
            >
              {/* Background image lives in its own clipped wrapper so the
                  card itself can stay overflow-visible for the dropdown */}
              <div className="relative h-52 overflow-hidden rounded-t-[28px]">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  crossOrigin="anonymous"
                  src={salonDetail.image}
                  alt={`${salonDetail.name} background`}
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#ea4f93]/40 via-[#ea4f93]/20 to-transparent" />
              </div>
              <div className="rounded-b-[28px] bg-white px-8 pb-8">
                <div className="-mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-6 min-w-0">
                    <div className="relative" ref={menuRef}>
                      <motion.img
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        crossOrigin="anonymous"
                        src={salonDetail.image}
                        alt={salonDetail.name}
                        className="h-40 w-40 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                        referrerPolicy="no-referrer"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#ea4f93] text-white shadow-lg hover:bg-[#d6376f]"
                        onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                      >
                        <Camera size={18} />
                      </motion.button>

                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {showAvatarMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute bottom-full right-0 z-30 mb-2 w-48 overflow-hidden rounded-[16px] border border-[#f1e7ed] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                          >
                            <motion.button
                              whileHover={{ backgroundColor: "#fde7ef" }}
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-3 text-left"
                              onClick={() => {
                                setShowAvatarMenu(false);
                                setShowViewAvatarModal(true);
                              }}
                            >
                              <Eye size={16} className="text-[#ea4f93]" />
                              <span className="text-[14px] font-semibold text-[#2d1b35]">{t("adminSalonManagement.viewAvatar")}</span>
                            </motion.button>
                            <div className="h-px bg-[#f1e7ed]" />
                            <motion.button
                              whileHover={{ backgroundColor: "#fde7ef" }}
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-3 text-left"
                              onClick={() => {
                                setShowAvatarMenu(false);
                                setShowUpdateAvatarModal(true);
                              }}
                            >
                              <Upload size={16} className="text-[#ea4f93]" />
                              <span className="text-[14px] font-semibold text-[#2d1b35]">{t("adminSalonManagement.updateAvatar")}</span>
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="min-w-0 pb-2">
                      <h2 className="truncate text-[26px] font-bold tracking-tight text-[#2d1b35]">
                        {salonDetail.name}
                      </h2>
                      <p className="mt-1.5 flex items-center gap-1.5 truncate text-[14px] font-medium text-[#a88a9f]">
                        <MapPin size={16} className="shrink-0 text-[#ea4f93]" />
                        {salonDetail.address}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-[12px] font-bold ${salonDetail.statusColor}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {language === "vi" && salonDetail.status === "Active" ? "Đang hoạt động" : salonDetail.status}
                  </span>
                </div>
              </div>
            </PremiumCard>

            {/* Salon Info Grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              {detailItems.map((item) => (
                <InfoItem key={item.label} {...item} />
              ))}
            </motion.div>

            {/* Weekly Schedule */}
            <PremiumCard noHover>
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-[#ea4f93]" />
                <h3 className="text-[14px] font-bold text-[#2d1b35]">Weekly Schedule</h3>
              </div>
              <div className="space-y-2">
                {SALON_DAYS_OF_WEEK.map((day, i) => {
                  const dayInfo = operatingHoursMap[day.key];
                  const isClosed = dayInfo?.closed;
                  const daysMap = { Monday: "Thứ hai", Tuesday: "Thứ ba", Wednesday: "Thứ tư", Thursday: "Thứ năm", Friday: "Thứ sáu", Saturday: "Thứ bảy", Sunday: "Chủ nhật" };

                  return (
                    <motion.div
                      key={day.key}
                      variants={fadeInUp}
                      transition={{ delay: 0.06 * i }}
                      className="flex items-center justify-between rounded-[16px] bg-[#fff8fb] px-5 py-4"
                    >
                      <span className="text-[13px] font-semibold text-[#2d1b35]">{language === "vi" ? daysMap[day.key] || day.label : day.label}</span>
                      {isClosed ? (
                        <span className="rounded-full bg-[#fdeceb] px-3 py-1 text-[11px] font-bold text-[#c94b4b]">
                          {t("adminSalonManagement.closed")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#a88a9f]">
                          <Clock3 size={13} className="text-[#ea4f93]" />
                          {dayInfo?.open} - {dayInfo?.close}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </PremiumCard>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Management Snapshot */}
            <PremiumCard noHover>
              <h3 className="mb-4 text-[14px] font-bold text-[#2d1b35]">{t("adminSalonManagement.managementSnapshot")}</h3>
              <div className="space-y-3">
                <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#fff8fb] px-4 py-3">
                  <span className="text-[12px] font-semibold text-[#a88a9f]">{t("adminSalonManagement.salonName")}</span>
                  <span className="max-w-[160px] truncate text-right text-[13px] font-medium text-[#2d1b35]">{salonDetail.name}</span>
                </motion.div>
                <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#fff8fb] px-4 py-3">
                  <span className="text-[12px] font-semibold text-[#a88a9f]">{t("adminSalonManagement.manager")}</span>
                  <span className="max-w-[160px] truncate text-right text-[13px] font-medium text-[#2d1b35]">{salonDetail.manager === "Unassigned" ? (t("adminSalonManagement.unassigned")) : salonDetail.manager}</span>
                </motion.div>
                <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#fff8fb] px-4 py-3">
                  <span className="text-[12px] font-semibold text-[#a88a9f]">{t("adminSalonManagement.staffAmount")}</span>
                  <span className="text-right text-[13px] font-medium text-[#2d1b35]">{salonDetail.staff}</span>
                </motion.div>
                <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#fff8fb] px-4 py-3">
                  <span className="text-[12px] font-semibold text-[#a88a9f]">{t("adminSalonManagement.status")}</span>
                  <span className="text-right text-[13px] font-medium text-[#2d1b35]">{language === "vi" && salonDetail.status === "Active" ? "Đang hoạt động" : salonDetail.status}</span>
                </motion.div>
              </div>
            </PremiumCard>

            {/* Description */}
            <PremiumCard noHover>
              <h3 className="mb-4 text-[14px] font-bold text-[#2d1b35]">{t("adminSalonManagement.description")}</h3>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#a88a9f]">
                {salonDetail?.description || (t("adminSalonManagement.noDescriptionAvailableYet"))}
              </p>
            </PremiumCard>
          </aside>
        </div>
      )}

      <ActionConfirmModal
        open={showDeleteModal}
        intent="danger"
        title={t("adminSalonManagement.deleteSalon")}
        subtitle={t("adminSalonManagement.deleteSalonApiIsNotConnectedYe")}
        description={language === "vi" ? `Bạn đang chuẩn bị xóa chi nhánh ${salonDetail?.name ?? "này"}.` : `You are about to delete ${salonDetail?.name ?? "this salon"}.`}
        confirmText={t("adminSalonManagement.close")}
        cancelText={t("adminSalonManagement.cancel")}
        confirmIcon={Trash2}
        onConfirm={handleDeleteSalon}
        onCancel={() => setShowDeleteModal(false)}
        item={
          salonDetail
            ? {
              image: salonDetail.image,
              title: salonDetail.name,
              meta: salonDetail.address,
              note: `${t("adminSalonManagement.manager1")} ${salonDetail.manager === "Unassigned" ? (t("adminSalonManagement.unassigned")) : salonDetail.manager}`,
            }
            : null
        }
        warnings={
          language === "vi"
            ? ["API xóa chi nhánh chưa kết nối thực tế.", "Thao tác này hiện tại chỉ hiển thị thông báo mô phỏng."]
            : ["Delete salon API is not connected yet.", "This action currently shows a placeholder notification only."]
        }
      />

      {/* View Avatar Modal */}
      <AnimatePresence>
        {showViewAvatarModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowViewAvatarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl rounded-[28px] bg-white p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#fde7ef] text-[#ea4f93] hover:bg-[#ea4f93] hover:text-white transition-colors"
                onClick={() => setShowViewAvatarModal(false)}
              >
                <X size={16} />
              </button>
              <div className="mb-4 text-center">
                <h3 className="text-[20px] font-bold text-[#2d1b35]">{t("adminSalonManagement.salonAvatar")}</h3>
              </div>
              <div className="flex justify-center">
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  crossOrigin="anonymous"
                  src={salonDetail?.image}
                  alt={`${salonDetail?.name || "Salon"}`}
                  className="h-80 w-80 rounded-full border-8 border-white object-cover shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Avatar Modal */}
      <AnimatePresence>
        {showUpdateAvatarModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowUpdateAvatarModal(false);
              setSelectedImage(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#fde7ef] text-[#ea4f93] hover:bg-[#ea4f93] hover:text-white transition-colors"
                onClick={() => {
                  setShowUpdateAvatarModal(false);
                  setSelectedImage(null);
                }}
              >
                <X size={16} />
              </button>
              <div className="mb-6">
                <h3 className="text-[20px] font-bold text-[#2d1b35]">{t("adminSalonManagement.updateAvatar")}</h3>
                <p className="mt-2 text-[13px] text-[#a88a9f]">
                  {language === "vi" ? `Tải lên ảnh mới cho chi nhánh ${salonDetail?.name || ""}` : `Upload a new image for ${salonDetail?.name || "this salon"}`}
                </p>
              </div>

              <div className="space-y-6">
                {selectedImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="h-40 w-40 rounded-full object-cover border-4 border-[#fde7ef]"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-[13px] font-semibold text-[#ea4f93]"
                    >
                      {t("adminSalonManagement.changeImage")}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[#f0b7cf] bg-[#fff8fb] px-6 py-10 cursor-pointer transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#fff5fb] hover:shadow-[0_8px_24px_rgba(234,79,147,0.12)]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d6376f] text-white shadow-lg">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-[#2d1b35]">{t("adminSalonManagement.clickToChooseAnImage")}</p>
                      <p className="mt-1 text-[11px] text-[#a88a9f]">{t("adminSalonManagement.pngOrJpgFilesSupported")}</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateAvatarModal(false);
                      setSelectedImage(null);
                    }}
                    className="flex-1 rounded-full border border-[#f1e7ed] bg-white px-4 py-3 text-[14px] font-bold text-[#2d1b35] hover:bg-[#fff8fb] transition-all"
                  >
                    {t("adminSalonManagement.cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedImage || isUploading}
                    onClick={handleUpdateAvatar}
                    className="flex-1 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#d6376f] px-4 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(234,79,147,0.3)] hover:opacity-95 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      t("adminSalonManagement.save")
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}