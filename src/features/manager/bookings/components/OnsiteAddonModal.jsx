import React, { useState, useEffect } from "react";
import { Modal, Input, InputNumber } from "antd";
import { Sparkles, Clock, CheckCircle2, Check, X, Layers, Banknote, Plus, Minus, Palette, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { confirmOnsiteAddon } from "../services/bookingProceduresService";
import { axiosClient } from "../../../../lib/axiosClient";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export function OnsiteAddonModal({ open, onClose, bookingId, booking, onSuccess }) {
  const [activeTab, setActiveTab] = useState("services"); // 'services' | 'variants' | 'custom'
  const [extraDuration, setExtraDuration] = useState(30);
  const [extraPrice, setExtraPrice] = useState(100000);
  const [notes, setNotes] = useState("Khách yêu cầu thêm dịch vụ phát sinh tại chỗ.");
  const [dbServices, setDbServices] = useState([]);
  const [dbNailVariants, setDbNailVariants] = useState([]);
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  // Map of item quantities: { [id]: count }
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [nailVariantQuantities, setNailVariantQuantities] = useState({});

  const [loadingDbData, setLoadingDbData] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDbData();
    }
  }, [open]);

  const fetchDbData = async () => {
    try {
      setLoadingDbData(true);
      const [svcRes, varRes] = await Promise.allSettled([
        axiosClient.get("/Services?pageSize=100"),
        axiosClient.get("/NailVariants?pageSize=100"),
      ]);

      if (svcRes.status === "fulfilled") {
        const items = svcRes.value.data?.data?.items || svcRes.value.data?.items || svcRes.value.data?.data || [];
        setDbServices(Array.isArray(items) ? items : []);
      }

      if (varRes.status === "fulfilled") {
        const vItems = varRes.value.data?.data?.items || varRes.value.data?.items || varRes.value.data?.data || [];
        setDbNailVariants(Array.isArray(vItems) ? vItems : []);
      }
    } catch (err) {
      console.warn("Failed to fetch DB data:", err);
    } finally {
      setLoadingDbData(false);
    }
  };

  const recalculateTotals = (svcMap, varMap) => {
    let dur = 0;
    let price = 0;
    const names = [];

    Object.entries(svcMap || {}).forEach(([sId, qty]) => {
      if (qty > 0) {
        const s = dbServices.find(
          (item) => String(item.serviceId || item.id) === String(sId)
        );
        if (s) {
          dur += (Number(s.duration) || 15) * qty;
          price += (Number(s.price) || 0) * qty;
          names.push(`${s.name || s.serviceName} (x${qty})`);
        }
      }
    });

    Object.entries(varMap || {}).forEach(([vId, qty]) => {
      if (qty > 0) {
        const v = dbNailVariants.find(
          (item) => String(item.nailVariantId || item.id) === String(vId)
        );
        if (v) {
          dur += (Number(v.duration) || 30) * qty;
          price += (Number(v.price) || 100000) * qty;
          names.push(`Mẫu: ${v.name || v.title || "Nail Art"} (x${qty})`);
        }
      }
    });

    setExtraDuration(dur > 0 ? dur : 30);
    setExtraPrice(price > 0 ? price : 100000);
    if (names.length > 0) {
      setNotes(`Dịch vụ phát sinh: ${names.join(", ")}`);
    }
  };

  const handleUpdateServiceQty = (serviceId, delta) => {
    const current = serviceQuantities[serviceId] || 0;
    const next = Math.max(0, current + delta);
    const nextMap = { ...serviceQuantities, [serviceId]: next };
    if (next === 0) delete nextMap[serviceId];
    setServiceQuantities(nextMap);
    recalculateTotals(nextMap, nailVariantQuantities);
  };

  const handleUpdateVariantQty = (variantId, delta) => {
    const current = nailVariantQuantities[variantId] || 0;
    const next = Math.max(0, current + delta);
    const nextMap = { ...nailVariantQuantities, [variantId]: next };
    if (next === 0) delete nextMap[variantId];
    setNailVariantQuantities(nextMap);
    recalculateTotals(serviceQuantities, nextMap);
  };

  const handleClose = () => {
    setServiceQuantities({});
    setNailVariantQuantities({});
    onClose();
  };

  const buildAddonItems = () => {
    const items = [];

    Object.entries(serviceQuantities).forEach(([sId, qty]) => {
      for (let i = 0; i < qty; i++) {
        items.push({ serviceId: sId, nailVariantId: null });
      }
    });

    Object.entries(nailVariantQuantities).forEach(([vId, qty]) => {
      for (let i = 0; i < qty; i++) {
        items.push({ serviceId: null, nailVariantId: Number(vId) });
      }
    });

    if (items.length === 0) {
      return [{ serviceId: dbServices[0]?.serviceId || null, nailVariantId: null }];
    }
    return items;
  };

  const totalSelectedCount =
    Object.values(serviceQuantities).reduce((a, b) => a + b, 0) +
    Object.values(nailVariantQuantities).reduce((a, b) => a + b, 0);

  const handleConfirm = async () => {
    const addonItems = buildAddonItems();
    if (!addonItems || addonItems.length === 0) {
      toast.error(isVi ? "Vui lòng chọn ít nhất một dịch vụ từ danh mục." : "Please select at least one service from the category.");
      return;
    }

    try {
      setConfirming(true);
      await confirmOnsiteAddon({
        bookingId,
        addonItems,
      });
      toast.success(isVi ? "Xác nhận & Cập nhật Lịch thành công!" : "Confirm & Update Schedule Success!", { icon: "✨" });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error("Confirm addon failed:", err);
      toast.error(err.message || (isVi ? "Không thể xác nhận dịch vụ phát sinh." : "Failed to confirm addon."));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      width={680}
      styles={{
        content: {
          padding: 0,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)",
        },
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(15, 23, 42, 0.45)",
        },
      }}
    >
      <div className="bg-white p-6 md:p-8 font-sans relative">
        {/* Ambient Beauty Glow Background */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#E84F93]/20 via-[#8B5CF6]/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-[#10B981]/15 via-[#8B5CF6]/10 to-transparent blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF0F6] via-[#FFE4EE] to-[#F5F3FF] text-[#E84F93] shadow-xs border border-[#F3E2EC]">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">{isVi ? "Thêm dịch vụ & Mẫu móng phát sinh" : "Add Extra Services & Nail Variants"}</h3>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">{isVi ? "Tùy chọn số lượng từng dịch vụ thực tế khi làm tại salon" : "Select the actual quantity of each service performed at the salon"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Segmented Control / Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] mb-4 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={[
              "flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "services"
                ? "bg-white text-[#E84F93] shadow-xs border border-[#F3D7E4]"
                : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            <Layers size={15} />
            <span>{isVi ? "Dịch Vụ Salon" : "Salon Services"}</span>
            {Object.keys(serviceQuantities).length > 0 && (
              <span className="flex h-5 px-1.5 items-center justify-center rounded-full bg-[#E84F93] text-[10px] font-bold text-white">
                {Object.values(serviceQuantities).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("variants")}
            className={[
              "flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "variants"
                ? "bg-white text-[#8B5CF6] shadow-xs border border-[#E0E7FF]"
                : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            <Palette size={15} />
            <span>{isVi ? "Mẫu Móng Art" : "Nail Art Variants"}</span>
            {Object.keys(nailVariantQuantities).length > 0 && (
              <span className="flex h-5 px-1.5 items-center justify-center rounded-full bg-[#8B5CF6] text-[10px] font-bold text-white">
                {Object.values(nailVariantQuantities).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content 1: Services List with Quantity Steppers */}
        {activeTab === "services" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                {isVi ? "Danh Mục Dịch Vụ Salon" : "Salon Service Category"}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                {isVi ? "Tăng/giảm số lượng từng dịch vụ theo yêu cầu" : "Adjust quantity of each service based on actual requirements"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-1 pr-1.5">
              {dbServices.length > 0 ? (
                dbServices.map((s) => {
                  const sId = s.serviceId || s.id;
                  const qty = serviceQuantities[sId] || 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={sId}
                      className={[
                        "flex items-center justify-between p-3 rounded-2xl border text-left transition-all relative",
                        isSelected
                          ? "border-[#E84F93] bg-[#FFF0F6] shadow-xs"
                          : "border-[#E2E8F0] bg-white hover:border-[#E84F93] hover:bg-[#FFF9FB]",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {s.name || s.serviceName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E84F93]">
                            +{Number((s.price || 0) * (qty || 1)).toLocaleString("vi-VN")} VND
                          </span>
                          <span className="text-[10px] text-[#64748B] font-semibold bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                            +{(s.duration || 15) * (qty || 1)} {isVi ? "phút" : "minutes"}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper Control */}
                      <div className="flex items-center shrink-0">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 bg-white border border-[#E84F93] rounded-full p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQty(sId, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF0F6] text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold text-[#E84F93] min-w-[18px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQty(sId, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#E84F93] to-[#8B5CF6] text-white transition cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateServiceQty(sId, 1)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F6] border border-[#F3D7E4] px-3 py-1.5 text-xs font-bold text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>{isVi ? "Thêm" : "Add"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-[#94A3B8] italic">
                  {isVi ? "Đang tải danh sách dịch vụ từ hệ thống..." : "Loading salon services..."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Nail Variants Art Gallery */}
        {activeTab === "variants" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                {isVi ? "Mẫu Móng Art & Đính Đá" : "Nail Art Variants & Adornments"}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                {isVi ? "Chọn mẫu móng thiết kế bổ sung" : "Select additional nail art designs"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1 pr-1.5">
              {dbNailVariants.length > 0 ? (
                dbNailVariants.map((v) => {
                  const vId = v.nailVariantId || v.id;
                  const isSelected = !!nailVariantQuantities[vId];
                  const thumbnail =
                    v.thumbnailUrl ||
                    v.imageUrl ||
                    v.nailVariantImageUrl ||
                    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=160&auto=format&fit=crop&q=80";

                  return (
                    <button
                      key={vId}
                      type="button"
                      onClick={() => handleUpdateVariantQty(vId, isSelected ? -1 : 1)}
                      className={[
                        "flex flex-col p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative group",
                        isSelected
                          ? "border-[#8B5CF6] bg-[#F5F3FF] shadow-xs"
                          : "border-[#E2E8F0] bg-white hover:border-[#8B5CF6] hover:bg-[#FAF5FF]",
                      ].join(" ")}
                    >
                      <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-[#F1F5F9]">
                        <img
                          crossOrigin="anonymous"
                          src={thumbnail}
                          alt={v.name || "Nail design"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#8B5CF6]/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-md">
                              <Check size={16} />
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-bold text-[#0F172A] truncate leading-snug">
                        {v.name || v.title || "Mẫu móng DB"}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-[#8B5CF6]">
                          {Number(v.price || 100000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-[10px] font-bold text-[#64748B] bg-white/90 px-1.5 py-0.5 rounded-md border border-[#E2E8F0]">
                          +{v.duration || 30}p
                        </span>
                      </div>

                      {/* Select Action Footer */}
                      <div className="mt-2 pt-2 border-t border-[#E0E7FF] text-center">
                        <span
                          className={[
                            "block w-full py-1 text-center rounded-full text-[11px] font-bold transition",
                            isSelected
                              ? "bg-[#8B5CF6] text-white"
                              : "bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white",
                          ].join(" ")}
                        >
                          {isSelected ? (isVi ? "Đã chọn ✓" : "Selected ✓") : (isVi ? "+ Chọn mẫu" : "+ Select")}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-[#94A3B8] italic">
                  {isVi ? "Đang tải mẫu móng từ hệ thống..." : "Loading nail variants from the system..."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duration, Price & Notes Section */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={13} className="text-[#E84F93]" />
                {isVi ? "Thời gian dự kiến (+phút)" : "Estimated Time (+minutes)"}
              </label>
              <InputNumber
                value={extraDuration}
                onChange={(val) => setExtraDuration(val || 0)}
                min={5}
                max={240}
                step={5}
                prefix={<Clock size={14} className="text-[#94A3B8] mr-1" />}
                className="w-full rounded-xl border-[#E2E8F0] py-1 text-xs font-bold focus:border-[#E84F93]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Banknote size={13} className="text-[#10B981]" />
                {isVi ? "Chi phí bổ sung (VNĐ)" : "Additional Cost (VND)"}
              </label>
              <InputNumber
                value={extraPrice}
                onChange={(val) => setExtraPrice(val || 0)}
                min={0}
                step={10000}
                suffix={<span className="text-xs font-bold text-[#10B981] mr-1">VND</span>}
                className="w-full rounded-xl border-[#E2E8F0] py-1 text-xs font-bold focus:border-[#E84F93]"
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                style={{ width: 150 }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              {isVi ? "Ghi chú dịch vụ phát sinh" : "Additional Service Notes"}
            </label>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isVi ? "Nhập ghi chú chi tiết cho thợ..." : "Enter detailed notes for the technician..."}
              className="rounded-xl border-[#E2E8F0] text-xs font-medium focus:border-[#E84F93]"
            />
          </div>
        </div>

        {/* Live Total Calculation Banner */}
        <div className="mt-4 rounded-2xl border border-[#F3E2EC] bg-gradient-to-r from-[#FFF0F6] via-[#F8FAFC] to-[#F5F3FF] p-3 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#E84F93] shadow-2xs border border-[#F3D7E4]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{isVi ? "Tổng CộngPhát Sinh" : "Total Additional Services"}</p>
              <p className="text-xs font-bold text-[#0F172A] truncate max-w-[240px]">
                {totalSelectedCount > 0
                  ? (isVi ? `Đã chọn tổng cộng ${totalSelectedCount} món phát sinh` : `Selected a total of ${totalSelectedCount} additional items`)
                  : (isVi ? "Chưa chọn dịch vụ nào" : "No services selected")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="bg-white/90 px-2.5 py-1 rounded-xl border border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] block font-medium">{isVi ? "Thời gian" : "Time"}</span>
              <span className="text-xs font-bold text-[#0F172A]">+{extraDuration}p</span>
            </div>
            <div className="bg-gradient-to-r from-[#E84F93] to-[#8B5CF6] px-3 py-1 rounded-xl text-white shadow-2xs">
              <span className="text-[10px] text-white/80 block font-medium">{isVi ? "Chi phí cộng" : "Additional Cost"}</span>
              <span className="text-xs font-bold">+{extraPrice.toLocaleString("vi-VN")} VND</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#F1F5F9] mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-[#E2E8F0] px-5 py-2.5 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition cursor-pointer"
          >
            {isVi ? "Hủy bỏ" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] px-7 py-2.5 text-xs font-bold text-white shadow-[0_10px_25px_-5px_rgba(232,79,147,0.4)] hover:shadow-[0_12px_30px_-4px_rgba(232,79,147,0.5)] hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            {confirming ? (isVi ? "Đang xử lý..." : "Processing...") : (isVi ? "Xác nhận & Cập nhật Lịch" : "Confirm & Update Schedule")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
