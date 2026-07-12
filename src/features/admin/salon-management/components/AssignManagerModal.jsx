import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Spin } from "antd";
import { Users, Mail, Phone, MapPin, X } from "lucide-react";
import { fetchAdminUsers } from "../../user-management/services/userManagementService";

const SALON_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" rx="28" fill="#fde7ef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8f365c" font-family="Arial, sans-serif" font-size="30" font-weight="700">Salon</text></svg>',
)}`;

export default function AssignManagerModal({
  open,
  onCancel,
  onConfirm,
  confirmLoading,
  filteredSalons,
  isLoading,
  assignManagerForm,
  setAssignManagerForm,
}) {
  const [managers, setManagers] = useState([]);
  const [isManagersLoading, setIsManagersLoading] = useState(false);

  useEffect(() => {
    if (open && assignManagerForm.salonId) {
      loadManagers();
    }
  }, [open, assignManagerForm.salonId]);

  const loadManagers = async () => {
    try {
      setIsManagersLoading(true);
      const response = await fetchAdminUsers({ role: "Manager" });
      setManagers(response.items || []);
    } catch (error) {
      console.error("Failed to load managers", error);
    } finally {
      setIsManagersLoading(false);
    }
  };

  const handleReset = () => {
    setAssignManagerForm({ salonId: "", managerId: "" });
    setManagers([]);
    onCancel();
  };

  return (
    <Modal
      open={open}
      onOk={() => onConfirm(assignManagerForm)}
      onCancel={handleReset}
      confirmLoading={confirmLoading}
      okText="Confirm"
      cancelText="Cancel"
      okButtonProps={{
        style: {
          backgroundColor: "#ea4f93",
          color: "#fff",
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px",
        },
        disabled: !assignManagerForm.salonId || !assignManagerForm.managerId,
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 9999,
          fontWeight: 700,
          padding: "8px 20px",
        },
      }}
      width={700}
      centered
      destroyOnClose
      styles={{
        content: {
          padding: 0,
          borderRadius: 32,
          overflow: "hidden",
          maxHeight: "80vh",
        },
        body: { padding: 0, overflow: "hidden" },
        mask: { backdropFilter: "blur(8px)" },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-[#fff0f8] via-[#fff5fb] to-[#fff9ff] px-6 pb-8 pt-5"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_15px_30px_rgba(234,79,147,0.25)]"
          >
            <Users size={20} />
          </motion.div>
          <div>
            <h3 className="text-xl font-extrabold text-[#3d1f3f] tracking-tight">
              Assign Salon Manager
            </h3>
            <p className="mt-1 text-xs text-[#9a5f7f]">
              Select a salon and manager to assign.
            </p>
          </div>
        </div>
      </motion.div>
      <>
        <style>{`
          .assign-manager-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .assign-manager-scrollbar::-webkit-scrollbar-track {
            background: #fde7ef;
            border-radius: 8px;
          }
          .assign-manager-scrollbar::-webkit-scrollbar-thumb {
            background: #ea4f93;
            border-radius: 8px;
          }
          .assign-manager-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #db2777;
          }
        `}</style>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          className="assign-manager-scrollbar -mt-6 rounded-[32px] bg-white px-6 pb-6 pt-6 overflow-y-auto"
          style={{
            maxHeight: "calc(80vh - 140px)",
            scrollbarWidth: "thin",
            scrollbarColor: "#ea4f93 #fde7ef",
          }}
        >
          <div className="mb-4 rounded-2xl border border-[#f3d7e7] bg-[#fffafd] p-4">
            <p className="text-sm text-[#6a5064] leading-relaxed">
              Choose a salon and then select a manager to assign to that salon.
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!assignManagerForm.salonId ? (
                <motion.div
                  key="salon-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#9a5f7f] mb-3">
                    Select Salon
                  </p>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Spin tip="Loading salons..." size="large" />
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredSalons.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-[#a67f98]">
                          <MapPin size={40} className="mx-auto mb-2 opacity-50" />
                          <p className="text-base">No salons available right now.</p>
                        </div>
                      ) : (
                        filteredSalons.map((salon) => {
                          const isSelected = assignManagerForm.salonId === salon.id;
                          return (
                            <motion.div
                              key={salon.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                console.log("Selected salon:", salon);
                                setAssignManagerForm((prev) => ({
                                  ...prev,
                                  salonId: salon.id,
                                }));
                              }}
                              className={`cursor-pointer rounded-[24px] border p-4 transition-all duration-300 ${
                                isSelected
                                  ? "border-[#ea4f93] bg-gradient-to-br from-[#fff5fb] to-white shadow-[0_10px_25px_rgba(236,72,153,0.12)]"
                                  : "border-[#f0cfe1] bg-gradient-to-br from-white to-[#fffafd] hover:border-[#ea4f93] hover:shadow-[0_10px_25px_rgba(236,72,153,0.12)]"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <motion.div
                                  whileHover={{ scale: 1.08 }}
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-[0_4px_12px ${
                                    isSelected
                                      ? "shadow-[0_4px_12px_rgba(234,79,147,0.3)]"
                                      : "shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
                                  }`}
                                >
                                  <img
                                    crossOrigin="anonymous"
                                    src={salon.imageUrl || salon.image || SALON_PLACEHOLDER_IMAGE}
                                    alt={salon.name}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = SALON_PLACEHOLDER_IMAGE;
                                    }}
                                  />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-extrabold text-[#3d1f3f] truncate">
                                    {salon.name}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2 text-xs text-[#7f6478]">
                                    <MapPin size={12} className="text-[#b88ca8]" />
                                    <span className="truncate">{salon.address}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="manager-list"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#9a5f7f]">
                      Select Manager
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setAssignManagerForm((prev) => ({
                          ...prev,
                          salonId: "",
                          managerId: "",
                        }));
                      }}
                      className="px-3 py-1.5 text-xs font-extrabold text-[#9a5f7f] hover:text-[#ea4f93] bg-[#fff0f8] rounded-full transition-all duration-200 hover:bg-[#fde7f3]"
                    >
                      ← Change salon
                    </motion.button>
                  </div>
                  {isManagersLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Spin tip="Loading managers..." size="large" />
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {managers.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-[#a67f98]">
                          <Users size={40} className="mx-auto mb-2 opacity-50" />
                          <p className="text-base">No managers available right now.</p>
                        </div>
                      ) : (
                        managers.map((manager) => {
                          const isSelected = assignManagerForm.managerId === manager.id;
                          return (
                            <motion.div
                              key={manager.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                console.log("Selected manager:", manager);
                                setAssignManagerForm((prev) => ({
                                  ...prev,
                                  managerId: manager.id,
                                }));
                              }}
                              className={`cursor-pointer rounded-[24px] border p-4 transition-all duration-300 ${
                                isSelected
                                  ? "border-[#ea4f93] bg-gradient-to-br from-[#fff5fb] to-white shadow-[0_10px_25px_rgba(236,72,153,0.12)]"
                                  : "border-[#f0cfe1] bg-gradient-to-br from-white to-[#fffafd] hover:border-[#ea4f93] hover:shadow-[0_10px_25px_rgba(236,72,153,0.12)]"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <motion.div
                                  whileHover={{ scale: 1.08 }}
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white shadow-[0_4px_12px ${
                                    isSelected
                                      ? "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]"
                                      : "bg-gradient-to-br from-[#d6c1ff] to-[#8b5cf6]"
                                  }`}
                                >
                                  {manager.name
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-[#3d1f3f]">
                                      {manager.name}
                                    </p>
                                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#fde7f3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#e1447f]">
                                      {manager.role}
                                    </span>
                                  </div>
                                  <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                      <Mail size={12} className="text-[#b88ca8]" />
                                      <span className="truncate">
                                        {manager.email && manager.email !== "--" ? manager.email : "No email"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[#7f6478]">
                                      <Phone size={12} className="text-[#b88ca8]" />
                                      <span className="truncate">
                                        {manager.phone && manager.phone !== "--" ? manager.phone : "No phone"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </>
    </Modal>
  );
}
