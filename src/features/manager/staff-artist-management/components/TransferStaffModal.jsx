import { useEffect, useMemo, useState } from "react";
import { Modal, Spin } from "antd";
import { Check, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { fetchAdminSalons } from "../../../admin/salon-management/services/salonManagementService";
import { updateUser } from "../../../admin/staff-management/services/staffManagementService";
import { fetchAllSalonStaff } from "../services/nailArtistsService";
import { motion, AnimatePresence } from "framer-motion";
import { StaffAvatar } from "../../../../shared/components/common/StaffAvatar";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

function getStaffDisplayName(staff) {
  const rawName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  if (rawName) return rawName;
  return staff?.fullName || staff?.name || staff?.email || "Unknown staff";
}

function getStaffKey(staff) {
  return staff?.staffId || staff?.staffArtistId || staff?.userId || staff?.id || "";
}

function getStaffInitials(staff) {
  const name = getStaffDisplayName(staff);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TransferStaffModal({
  open,
  onClose,
  salonId,
  onSuccess
}) {
  const { language } = useLanguage();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [salons, setSalons] = useState([]);
  const [targetSalonId, setTargetSalonId] = useState(null);
  const [isLoadingSalons, setIsLoadingSalons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const STAFF_PER_PAGE = 4;

  // Fetch staff when modal opens
  useEffect(() => {
    if (!open) return;

    let isCancelled = false;

    (async () => {
      try {
        setIsLoadingStaff(true);
        setSelectedStaff(null);
        setTargetSalonId(null);
        const staff = await fetchAllSalonStaff(salonId);
        if (isCancelled) return;
        setStaffList(staff || []);
      } catch (err) {
        console.error("Failed to load salon staff:", err);
        if (!isCancelled) setStaffList([]);
      } finally {
        if (!isCancelled) setIsLoadingStaff(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [open, salonId]);

  // Fetch salons when staff is selected
  useEffect(() => {
    if (!open || !selectedStaff) return;

    let isCancelled = false;

    (async () => {
      try {
        setIsLoadingSalons(true);
        const { items } = await fetchAdminSalons({ pageSize: 100 });
        if (isCancelled) return;
        setSalons(items);
        if (selectedStaff?.salonId) {
          setTargetSalonId(selectedStaff.salonId);
        }
      } catch (err) {
        console.error("Failed to load salons:", err);
        if (!isCancelled) setSalons([]);
      } finally {
        if (!isCancelled) setIsLoadingSalons(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [open, selectedStaff]);

  const handleConfirmTransfer = async () => {
    const staffKey = getStaffKey(selectedStaff);
    const staffUserId = selectedStaff?.userId;

    if (!staffUserId) {
      console.warn("No userId found in selectedStaff:", selectedStaff);
      return;
    }
    if (!targetSalonId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUser(staffUserId, { salonId: targetSalonId });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to transfer staff:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStaffName = selectedStaff ? getStaffDisplayName(selectedStaff) : "";
  const selectedSalonName = useMemo(() => {
    const salon = salons.find(s => s.id === targetSalonId);
    return salon?.name || "";
  }, [salons, targetSalonId]);

  const canConfirm = selectedStaff && targetSalonId;

  // Reset page when modal opens or staff list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [open, staffList.length]);

  // Calculate current page staff
  const currentStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * STAFF_PER_PAGE;
    return staffList.slice(startIndex, startIndex + STAFF_PER_PAGE);
  }, [staffList, currentPage, STAFF_PER_PAGE]);

  return (
    <Modal
      title={null}
      open={open}
      onOk={handleConfirmTransfer}
      onCancel={() => {
        onClose();
        setSelectedStaff(null);
        setTargetSalonId(null);
        setCurrentPage(1);
      }}
      confirmLoading={isSubmitting}
      okText={language === "vi" ? "Xác nhận chuyển" : "Confirm Transfer"}
      cancelText={language === "vi" ? "Hủy" : "Cancel"}
      okButtonProps={{
        style: {
          backgroundColor: "#ea4f93",
          color: "#fff",
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px"
        },
        disabled: !canConfirm,
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px"
        }
      }}
      width={800}
      centered
      destroyOnClose
      styles={{
        content: {
          padding: 0,
          borderRadius: 32,
          overflow: "hidden"
        },
        body: { padding: 0 },
        mask: { backdropFilter: "blur(8px)" },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-[#fff0f8] via-[#fff5fb] to-[#fff9ff] px-7 pb-12 pt-7"
      >
        <div className="flex items-center gap-5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_15px_30px_rgba(234,79,147,0.25)]"
          >
            <UserRound size={24} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#3d1f3f] tracking-tight">{language === "vi" ? "Chuyển nhân viên" : "Transfer Staff"}</h3>
            <p className="mt-2 text-sm text-[#9a5f7f]">
              {language === "vi" ? "Chọn nhân viên và salon đích để chuyển." : "Select a staff member and target salon to transfer."}
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        className="-mt-8 rounded-[32px] bg-white px-7 pb-7 pt-7"
      >
        <AnimatePresence mode="wait">
          {!selectedStaff ? (
            <motion.div
              key="staff-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-5">
                <p className="text-sm text-[#6a5064] leading-relaxed">
                  {language === "vi" ? "Chọn nhân viên và salon đích để chuyển." : "Select a staff member and target salon to transfer."}
                </p>
              </div>
              {isLoadingStaff ? (
                <div className="flex items-center justify-center py-12">
                  <Spin tip={language === "vi" ? "Đang tải danh sách nhân viên..." : "Loading salon staff..."} size="large" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {staffList.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-[#a67f98]">
                        <UserRound size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-base">{language === "vi" ? "Không có nhân viên" : "No staff available right now."}</p>
                      </div>
                    ) : (
                      currentStaff.map((staff) => {
                        const key = getStaffKey(staff);
                        const name = getStaffDisplayName(staff);
                        const currentSalon = staff?.salonName || staff?.assignedSalon || "—";

                        return (
                          <motion.div
                            key={key || `${name}-${staff?.email || ""}`}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedStaff(staff);
                              setTargetSalonId(null);
                              setCurrentPage(1);
                            }}
                            className="cursor-pointer rounded-[28px] border border-[#f0cfe1] bg-gradient-to-br from-white to-[#fffafd] p-5 transition-all duration-300 hover:border-[#ea4f93] hover:shadow-[0_15px_35px_rgba(236,72,153,0.12)]"
                          >
                            <div className="flex items-start gap-4">
                              <StaffAvatar
                                staff={{
                                  ...staff,
                                  name: name,
                                  initials: getStaffInitials(staff),
                                }}
                                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                                fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d6c1ff] to-[#8b5cf6] text-base font-extrabold text-white shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-extrabold text-[#3d1f3f] truncate">{name}</p>
                                  {staff?.role ? (
                                    <span className="inline-flex items-center rounded-full bg-[#fde7f3] px-3 py-1 text-[10px] font-extrabold text-[#e1447f]">
                                      {staff.role}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                    <Mail size={14} className="text-[#b88ca8]" />
                                    <span className="truncate">{staff.email || "No email provided"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                    <Phone size={14} className="text-[#b88ca8]" />
                                    <span className="truncate">{staff.phone || staff.phoneNumber || "No phone number"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                    <MapPin size={14} className="text-[#b88ca8]" />
                                    <span className="truncate">{currentSalon}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                  {staffList.length > STAFF_PER_PAGE ? (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(staffList.length / STAFF_PER_PAGE)}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="salon-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <StaffAvatar
                      staff={{
                        ...selectedStaff,
                        name: selectedStaffName,
                        initials: getStaffInitials(selectedStaff),
                      }}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                      fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-base font-extrabold text-white shadow-[0_4px_12px_rgba(234,79,147,0.2)]"
                    />
                    <div>
                      <p className="text-base font-extrabold text-[#3d1f3f]">{selectedStaffName}</p>
                      {selectedStaff?.role ? (
                        <span className="inline-flex items-center rounded-full bg-[#fde7f3] px-3 py-1 text-[10px] font-extrabold text-[#e1447f]">
                          {selectedStaff.role}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(null);
                      setTargetSalonId(null);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 text-xs font-extrabold text-[#9a5f7f] hover:text-[#ea4f93] bg-[#fff0f8] rounded-full transition-all duration-200 hover:bg-[#fde7f3]"
                  >
                    ← {language === "vi" ? "Thay đổi nhân viên" : "Change staff"}
                  </motion.button>
                </div>

                {targetSalonId && (
                  <div className="mb-5 rounded-xl border border-[#d1f0de] bg-gradient-to-r from-[#eaf9ee] to-[#e6fff3] px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#2fa25f]">
                      <Check size={16} />
                      {language === "vi" ? "Chọn salon đích" : "Selected Salon"}: {selectedSalonName}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#ea4f93] mb-4 flex items-center gap-2">
                      <MapPin size={16} />
                      {language === "vi" ? "Chọn Salon đích" : "Select Target Salon"}
                    </p>
                    {isLoadingSalons ? (
                      <div className="flex items-center justify-center py-5">
                        <Spin size="default" />
                      </div>
                    ) : salons.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {salons.map((salon) => {
                          const isSelected = targetSalonId === salon.id;
                          return (
                            <motion.button
                              key={salon.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              type="button"
                              onClick={() => setTargetSalonId(isSelected ? null : salon.id)}
                              className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${isSelected
                                ? "border-[#ea4f93] bg-gradient-to-br from-[#fff5fb] to-[#fff9ff] shadow-[0_8px_20px_rgba(234,79,147,0.18)]"
                                : "border-[#f0cfe1] bg-white hover:border-[#ea4f93] hover:shadow-[0_8px_20px_rgba(234,79,147,0.1)]"
                                }`}
                            >
                              <p className="text-sm font-extrabold text-[#3d1f3f]">{salon.name}</p>
                              <p className="text-xs text-[#7f6478] mt-1">{salon.address}</p>
                              {salon.phone && (
                                <p className="text-xs text-[#7f6478] mt-1 flex items-center gap-1">
                                  <Phone size={12} />
                                  {salon.phone}
                                </p>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#f0cfe1] bg-[#fffafd] px-4 py-4 text-xs text-[#9a5f7f]">
                        <MapPin size={16} className="opacity-60" />
                        <span>{language === "vi" ? "Không có salon nào để chuyển đến." : "No salons available to transfer to."}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Modal>
  );
}

TransferStaffModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  salonId: PropTypes.string,
  onSuccess: PropTypes.func,
};
