import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button, Select, Popconfirm, Tooltip, Spin, Modal, Alert, Popover } from 'antd';
import { Plus, Edit2, Trash2, Armchair, Building2, Eye, Store, MapPin, Phone, Clock, Search, ListFilter, CircleCheck, CircleX, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { chairManagementService } from '../services/chairManagementService';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { fetchAdminSalons } from '../../salon-management/services/salonManagementService';
import ChairFormModal from '../components/ChairFormModal';
import toast from 'react-hot-toast';
import ChairMap from '../../../../shared/components/ui/ChairMap';
import { CHAIR_STATUS, SALON_STATUS_FILTER } from '../../../../shared/utils/statusFormatters';

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const getInitials = (name) => {
  return (name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
};

export default function ChairManagementPage() {
  const { t, language } = useLanguage();

  // Salons State
  const [salons, setSalons] = useState([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [salonsError, setSalonsError] = useState(null);
  const [salonSearchQuery, setSalonSearchQuery] = useState("");
  const [salonStatusFilter, setSalonStatusFilter] = useState("all");
  const [salonSortOption, setSalonSortOption] = useState("name");

  const [salonPageIndex, setSalonPageIndex] = useState(1);
  const [hasMoreSalons, setHasMoreSalons] = useState(false);
  const [isLoadMoreSalons, setIsLoadMoreSalons] = useState(false);
  const [debouncedSalonSearchQuery, setDebouncedSalonSearchQuery] = useState("");

  const [selectedSalon, setSelectedSalon] = useState(null);

  // Chairs State
  const [chairs, setChairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChair, setSelectedChair] = useState(null);
  const [initialChairName, setInitialChairName] = useState("");
  const [detailChair, setDetailChair] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSalonSearchQuery(salonSearchQuery);
      setSalonPageIndex(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [salonSearchQuery]);

  const loadSalons = async () => {
    if (salonPageIndex === 1) setLoadingSalons(true);
    else setIsLoadMoreSalons(true);
    setSalonsError(null);
    try {
      const response = await fetchAdminSalons({
        pageIndex: salonPageIndex,
        pageSize: 6,
        searchTerm: debouncedSalonSearchQuery
      });
      const items = response.items || [];
      if (salonPageIndex === 1) {
        setSalons(items);
      } else {
        setSalons(prev => [...prev, ...items]);
      }
      setHasMoreSalons(response?.metaData?.hasNext || false);
    } catch (err) {
      setSalonsError(err.message || t("adminChairs.failedToLoadSalons"));
    } finally {
      setLoadingSalons(false);
      setIsLoadMoreSalons(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, [salonPageIndex, debouncedSalonSearchQuery]);

  const handleLoadMoreSalons = () => {
    if (!isLoadMoreSalons && hasMoreSalons) {
      setSalonPageIndex(prev => prev + 1);
    }
  };

  const filteredSalons = useMemo(() => {
    let items = [...salons];

    if (salonStatusFilter !== "all") {
      items = items.filter(
        (s) => (s.status || "Active").toLowerCase() === salonStatusFilter.toLowerCase()
      );
    }

    if (salonSortOption === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (salonSortOption === "rating") {
      items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return items;
  }, [salons, salonStatusFilter, salonSortOption]);

  const loadChairs = useCallback(async (salonId) => {
    if (!salonId) return;
    setLoading(true);
    try {
      const response = await chairManagementService.getChairsBySalonId({
        salonId,
        pageIndex: 1,
        pageSize: 100,
      });
      setChairs(response.items || []);
    } catch (error) {
      console.error(error);
      toast.error(t("adminChairs.failedToLoadChairs"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (selectedSalon) {
      loadChairs(selectedSalon.id);
    }
  }, [selectedSalon, loadChairs]);

  const handleBackToSalons = () => {
    setSelectedSalon(null);
    setChairs([]);
  };

  const handleDelete = async (chairId) => {
    try {
      await chairManagementService.deleteChair(chairId);
      toast.success(t("adminChairs.chairDeletedSuccess"));
      loadChairs(selectedSalon?.id);
    } catch (error) {
      toast.error(error.message || t("adminChairs.failedToDeleteChair"));
    }
  };

  const openCreateModal = (cellName = "") => {
    setSelectedChair(null);
    setInitialChairName(cellName);
    setIsModalOpen(true);
  };

  const openEditModal = (chair) => {
    setSelectedChair(chair);
    setInitialChairName("");
    setIsModalOpen(true);
  };

  const openDetailModal = (chair) => {
    setDetailChair(chair);
  };

  const handleModalSuccess = () => {
    loadChairs(selectedSalon?.id);
  };

  const getStatusColor = (status) => {
    return CHAIR_STATUS[status]?.tone || CHAIR_STATUS.Active.tone;
  };

  const handleDragStart = (e, chair) => {
    e.dataTransfer.setData("chairId", chair.chairId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetCellName) => {
    e.preventDefault();
    const chairIdStr = e.dataTransfer.getData("chairId");
    if (!chairIdStr) return;

    const chair = chairs.find(c => String(c.chairId) === chairIdStr);
    if (!chair) return;

    if (chair.chairName?.trim().toUpperCase() === targetCellName.toUpperCase()) return;

    const isOccupied = chairs.some(c => c.chairName?.trim().toUpperCase() === targetCellName.toUpperCase());
    if (isOccupied) {
      toast.warning(t("adminChairs.positionOccupied", { name: targetCellName }));
      return;
    }

    try {
      setLoading(true);
      await chairManagementService.updateChair(chair.chairId, {
        chairName: targetCellName,
        status: chair.status,
      });
      toast.success(t("adminChairs.chairMovedSuccess", { name: targetCellName }));
      loadChairs(selectedSalon?.id);
    } catch (error) {
      toast.error(error.message || t("adminChairs.failedToMoveChair"));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col text-slate-800 font-sans overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ea4f93]/7 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[300px] left-[-100px] -z-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#ffa26f]/4 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="rounded-lg top-0 z-30 flex flex-col gap-4 border-b border-white/40 bg-white/60 px-8 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between shadow-[0_8px_30px_rgb(236,72,153,0.04)] m-6 mb-2 lg:m-8 lg:mb-2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ec4899_0%,#fb7185_100%)] text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)]">
            <Armchair size={24} />
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#432744]">
              {t("adminChairs.title")}
            </h1>
            <p className="text-[13px] text-[#a88a9d] font-medium mt-1">
              {t("adminChairs.description")}
            </p>
          </div>
        </div>
        {selectedSalon && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleBackToSalons}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-3 text-xs font-bold text-[#2d1b35] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-[#ea4f93]/30 transition-all duration-300 active:scale-[0.98]"
            >
              <ArrowLeft size={13} />
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </button>
            <Button
              style={{ background: "#ec4899", color: "white", border: "#432744" }}
              icon={<Plus size={18} strokeWidth={3} />}
              onClick={() => openCreateModal()}
              className="flex h-11 items-center justify-center rounded-2xl border-none bg-[linear-gradient(180deg,#f25b99_0%,#d92f7b_100%)] px-6 font-bold text-white shadow-[0_10px_20px_rgba(236,72,153,0.25)] transition-all hover:scale-105 hover:shadow-[0_14px_28px_rgba(236,72,153,0.35)]"
            >
              {t("adminChairs.addChair")}
            </Button>
          </div>
        )}
      </div>

      <div className="p-6 lg:p-8 pt-2 mx-auto w-full max-w-[1400px]">
        {!selectedSalon ? (
          <div className="space-y-6">
            {/* Salon Search & Filters Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200/75 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88a9f]" size={15} />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm kiếm chi nhánh...' : 'Search salons...'}
                  value={salonSearchQuery}
                  onChange={(e) => setSalonSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 text-xs md:text-sm text-[#2d1b35] placeholder-[#a88a9f] bg-[#fafaf9]/30 focus:outline-none focus:bg-white focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10 transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative grid grid-cols-3 items-center gap-1.5 bg-[#fcf9fb] p-1 rounded-xl border border-[#f1e7ed]">
                  <div
                    className="absolute top-1 bottom-1 left-1 w-[calc((100%-20px)/3)] rounded-lg bg-[#ea4f93] shadow-[0_3px_10px_rgba(234,79,147,0.18)] pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      transform: salonStatusFilter === "all" ? "translateX(0)" : salonStatusFilter === "open" ? "translateX(calc(100% + 6px))" : "translateX(calc((100% + 6px) * 2))",
                    }}
                  />
                  {[
                    { value: "all", labelVi: "Tất cả", labelEn: "All", icon: ListFilter },
                    { value: "open", labelVi: "Mở cửa", labelEn: "Open", icon: CircleCheck },
                    { value: "closed", labelVi: "Đóng cửa", labelEn: "Closed", icon: CircleX },
                  ].map(({ value, labelVi, labelEn, icon: Icon }) => {
                    const isActive = salonStatusFilter === value;
                    return (
                      <Tooltip key={value} title={language === "vi" ? labelVi : labelEn}>
                        <button
                          type="button"
                          onClick={() => setSalonStatusFilter(value)}
                          className={`relative z-10 w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 focus:outline-none ${isActive ? "text-white" : "text-[#7f6478] hover:text-[#2d1b35]"}`}
                        >
                          <Icon size={14} strokeWidth={2} className={`transition-all duration-300 ${isActive ? "text-white scale-105" : "text-[#a88a9f] scale-100"}`} />
                          <span>{language === "vi" ? labelVi : labelEn}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* <div className="flex items-center gap-2 self-end md:self-auto">
                  <Tooltip title={language === "vi" ? "Sắp xếp theo" : "Sort by"}>
                    <Select
                      value={salonSortOption}
                      onChange={(val) => setSalonSortOption(val)}
                      className="w-36 h-10 select-premium-antd"
                      popupClassName="select-premium-dropdown"
                      prefix={<SlidersHorizontal size={15} strokeWidth={2} className="text-[#ea4f93]" />}
                      options={[
                        { value: "name", label: language === 'vi' ? 'Tên chi nhánh' : 'Salon Name' },
                        { value: "rating", label: language === 'vi' ? 'Đánh giá' : 'Rating' },
                      ]}
                    />
                  </Tooltip>
                </div> */}
              </div>
            </div>

            {loadingSalons ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white/40 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm">
                <Spin size="large" className="text-[#ea4f93]" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#a88a9f] animate-pulse">
                  {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                </p>
              </div>
            ) : salonsError ? (
              <div className="p-6 bg-rose-50/50 rounded-lg border border-rose-100">
                <Alert
                  message={t("adminChairs.failedToLoadSalons")}
                  description={salonsError}
                  type="warning"
                  showIcon
                  action={
                    <button
                      onClick={loadSalons}
                      className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {language === 'vi' ? 'Thử lại' : 'Retry'}
                    </button>
                  }
                />
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-lg border border-slate-200/60 shadow-sm">
                <Store size={36} className="text-[#a88a9f] mb-3 stroke-[1.2]" />
                <h3 className="text-sm font-bold text-[#2d1b35]">
                  {language === 'vi' ? 'Không tìm thấy chi nhánh nào' : 'No salons found'}
                </h3>
              </div>
            ) : (
              <>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredSalons.map((salon) => (
                    <motion.div
                      key={salon.id}
                      variants={fadeInUp}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      onClick={() => setSelectedSalon(salon)}
                      className="group bg-white/80 backdrop-blur-md rounded-lg border border-[#f1e7ed]/60 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(234,79,147,0.06)] hover:border-[#ea4f93]/20 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/50">
                          {salon.image ? (
                            <img
                              src={salon.image}
                              alt={salon.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ea4f93]/5 to-[#ffa26f]/5 text-[#ea4f93] font-bold text-2xl">
                              {getInitials(salon.name)}
                            </div>
                          )}

                          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${SALON_STATUS_FILTER[salon.status || "Active"]?.tone || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {language === "vi"
                              ? (SALON_STATUS_FILTER[salon.status || "Active"]?.vi || salon.status || "Hoạt động")
                              : (SALON_STATUS_FILTER[salon.status || "Active"]?.en || salon.status || "Active")
                            }
                          </span>

                          <div className="absolute bottom-3 left-3 bg-[#2d1b35]/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                            ★ {salon.rating || "4.8"} ({salon.reviews || "120"} {language === 'vi' ? 'đánh giá' : 'reviews'})
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <h3 className="text-base font-bold text-[#2d1b35] group-hover:text-[#ea4f93] transition-colors leading-tight">
                            {salon.name}
                          </h3>
                          <div className="space-y-1 text-xs text-[#a88a9f] pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="shrink-0 text-[#ea4f93]" />
                              <span className="truncate">{salon.address}</span>
                            </div>
                            {salon.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={13} className="shrink-0 text-[#ea4f93]" />
                                <span>{salon.phone}</span>
                              </div>
                            )}
                            <Popover
                              content={
                                <div className="flex flex-col gap-1.5 text-xs w-48">
                                  {salon.operatingHours && salon.operatingHours.length > 0 ? [...salon.operatingHours].sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)).map(h => (
                                    <div key={h.dayOfWeek} className="flex justify-between gap-4">
                                      <span className="font-medium text-[#2d1b35]">{language === "vi" ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][h.dayOfWeek] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][h.dayOfWeek]}</span>
                                      <span className="text-[#a88a9f]">
                                        {h.isClosed ? (language === "vi" ? "Đóng cửa" : "Closed") : `${h.openTime.slice(0, 5)} - ${h.closeTime.slice(0, 5)}`}
                                      </span>
                                    </div>
                                  )) : (
                                    <span className="text-[#a88a9f]">{language === "vi" ? "Chưa cập nhật" : "Not updated"}</span>
                                  )}
                                </div>
                              }
                              title={language === "vi" ? "Giờ hoạt động" : "Operating Hours"}
                              trigger="hover"
                              placement="bottomLeft"
                            >
                              <div className="flex items-center gap-2 cursor-pointer transition-colors group/hours">
                                <Clock size={13} className="shrink-0 text-[#ea4f93]" />
                                <p className="truncate">{language === "vi" ? "Giờ hoạt động" : "Operating Hours"}: </p>
                                <span className="truncate border-b border-dashed border-[#a88a9f] group-hover/hours:text-[#ea4f93] group-hover/hours:border-[#ea4f93]">
                                  {(() => {
                                    const today = new Date().getDay();
                                    const todayHours = salon.operatingHours?.find(h => h.dayOfWeek === today);
                                    if (todayHours) {
                                      return todayHours.isClosed
                                        ? (language === "vi" ? "Đóng cửa hôm nay" : "Closed today")
                                        : `${todayHours.openTime.slice(0, 5)} - ${todayHours.closeTime.slice(0, 5)}`;
                                    }
                                    return language === "vi" ? "Chưa cập nhật giờ mở cửa" : "Hours not updated";
                                  })()}
                                </span>
                              </div>
                            </Popover>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#ea4f93]">
                        <span>{language === 'vi' ? 'Quản lý ghế' : 'Manage Chairs'}</span>
                        <span className="h-8 w-8 rounded-full bg-[#ea4f93]/10 text-[#ea4f93] flex items-center justify-center group-hover:bg-[#ea4f93] group-hover:text-white transition-colors duration-300 shadow-sm">
                          →
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {hasMoreSalons && (
                  <div className="flex justify-center mt-8 pb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLoadMoreSalons}
                      disabled={isLoadMoreSalons}
                      className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#ea4f93] bg-white px-8 py-3 text-[15px] font-bold text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb] disabled:opacity-50"
                    >
                      {isLoadMoreSalons ? <Spin size="small" /> : language === 'vi' ? "Hiện thêm" : "View more"}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-lg shadow-xl shadow-pink-500/5 p-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" className="text-[#ea4f93]" />
              </div>
            ) : (
              <ChairMap
                chairs={chairs}
                renderCell={(cellName, chair) => {
                  if (chair) {
                    return (
                      <div
                        key={cellName}
                        draggable
                        onDragStart={(e) => handleDragStart(e, chair)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, cellName)}
                        className={`group relative flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl border-2 transition-all duration-300 ${getStatusColor(chair.status)} hover:shadow-lg hover:shadow-pink-500/10 hover:border-pink-300 hover:scale-[1.02] bg-white cursor-grab active:cursor-grabbing overflow-hidden`}
                      >
                        <Armchair size={28} className="mb-1.5 opacity-80" />
                        <span className="font-bold text-[15px]">{chair.chairName}</span>

                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-95 group-hover:scale-100">
                          <Tooltip title={t("adminChairs.view")}>
                            <Button
                              type="text"
                              size="small"
                              icon={<Eye size={16} />}
                              className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                              onClick={() => openDetailModal(chair)}
                            />
                          </Tooltip>
                          <Tooltip title={t("adminChairs.edit")}>
                            <Button
                              type="text"
                              size="small"
                              icon={<Edit2 size={16} />}
                              className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                              onClick={() => openEditModal(chair)}
                            />
                          </Tooltip>
                          {chair?.status === "Active" && (
                            <Popconfirm
                              title={t("adminChairs.deleteConfirmTitle")}
                              description={t("adminChairs.deleteConfirmDesc")}
                              onConfirm={(e) => {
                                e.stopPropagation();
                                handleDelete(chair.chairId);
                              }}
                              okText={t("adminChairs.yes")}
                              cancelText={t("adminChairs.no")}
                              okButtonProps={{ danger: true, className: 'rounded-lg font-semibold' }}
                              cancelButtonProps={{ className: 'rounded-lg font-semibold' }}
                            >
                              <Tooltip title={t("adminChairs.delete")}>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<Trash2 size={16} />}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Tooltip>
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={cellName}
                        onClick={() => openCreateModal(cellName)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, cellName)}
                        className="group flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-pink-50 hover:border-pink-300 cursor-pointer transition-all duration-200"
                      >
                        <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-pink-500 group-hover:scale-110 transition-all duration-200 pointer-events-none">
                          <Plus size={18} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-pink-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          {t("adminChairs.addPosition", { name: cellName })}
                        </span>
                      </div>
                    );
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      <ChairFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chair={selectedChair}
        initialChairName={initialChairName}
        salonId={selectedSalon?.id}
        salons={selectedSalon ? [selectedSalon] : []}
        existingChairs={chairs}
        onSuccess={handleModalSuccess}
      />

      <Modal
        title={
          <div className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Armchair className="text-[#ea4f93]" size={24} />
            {t("adminChairs.chairDetails")}
          </div>
        }
        open={!!detailChair}
        onCancel={() => setDetailChair(null)}
        footer={[
          <Button key="close" onClick={() => setDetailChair(null)} className="rounded-xl border-slate-200 font-semibold">
            {t("adminChairs.close")}
          </Button>
        ]}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      >
        {detailChair && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">{t("adminChairs.chairName")}</span>
              <span className="font-bold text-slate-800 text-base">{detailChair.chairName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">{t("adminChairs.status")}</span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(detailChair.status).replace('border-2', '')}`}>
                {detailChair.status === 'Active' ? t("adminChairs.active") : t("adminChairs.inactive")}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">{t("adminChairs.salon")}</span>
              <span className="font-bold text-slate-800">{detailChair.salonName}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
