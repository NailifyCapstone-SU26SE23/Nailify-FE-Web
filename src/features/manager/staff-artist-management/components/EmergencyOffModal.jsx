import React, { useState, useEffect, useMemo } from "react";
import { Modal, DatePicker, Select, Input } from "antd";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Clock,
  Calendar,
  X,
  UserCheck,
  User,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { triggerEmergencyOff } from "../../bookings/services/bookingProceduresService";
import { fetchNailArtists, getSalonId, getSalonIdAsync } from "../services/nailArtistsService";

const REASON_PRESETS = [
  "Bị sốt đột xuất 08:00 sáng.",
  "Sự cố sức khỏe khẩn cấp.",
  "Việc gia đình đột xuất.",
  "Sự cố di chuyển / Xe hỏng.",
];

export function EmergencyOffModal({ open, onClose, artist, artists = [], onSuccess }) {
  const [offDate, setOffDate] = useState(dayjs());
  const [reason, setReason] = useState("Bị sốt đột xuất 08:00 sáng.");
  const [loading, setLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  // Artist Selection State
  const [fetchedArtists, setFetchedArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [loadingArtists, setLoadingArtists] = useState(false);

  // Load available artists if not provided via props
  useEffect(() => {
    if (!open) return;

    if (artists && artists.length > 0) {
      setFetchedArtists(artists);
      return;
    }

    // Fetch if artists array not passed
    let isMounted = true;
    async function loadArtists() {
      try {
        setLoadingArtists(true);
        const salonId = (await getSalonIdAsync()) || getSalonId();
        if (salonId) {
          const raw = await fetchNailArtists(salonId);
          const list = Array.isArray(raw) ? raw : raw?.items || [];
          if (isMounted) {
            const mapped = list.map((a) => ({
              id: a.nailArtistId || a.id || a.staffId || a.userId,
              nailArtistId: a.nailArtistId || a.id,
              name:
                a.account?.fullName ||
                (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.fullName || a.name || "Nail Artist"),
              phone: a.account?.phone || a.phone || "",
              avatar: a.account?.avatarUrl || a.avatarUrl || "",
              skills: a.skills || [],
              specialty: a.specialty || "Standard Nail Specialist",
            }));
            setFetchedArtists(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load artists for Emergency Off modal:", err);
      } finally {
        if (isMounted) setLoadingArtists(false);
      }
    }

    loadArtists();
    return () => {
      isMounted = false;
    };
  }, [open, artists]);

  // Sync selected artist when modal opens or artist prop / list updates
  useEffect(() => {
    if (!open) return;

    const list = artists && artists.length > 0 ? artists : fetchedArtists;
    const initialId = artist?.nailArtistId || artist?.id || list[0]?.nailArtistId || list[0]?.id || null;
    setSelectedArtistId(initialId ? String(initialId) : null);
  }, [open, artist, artists, fetchedArtists]);

  // Combine props & fetched artists to get full list
  const combinedArtists = useMemo(() => {
    const list = artists && artists.length > 0 ? artists : fetchedArtists;
    if (artist && !list.some((a) => String(a.id || a.nailArtistId) === String(artist.id || artist.nailArtistId))) {
      return [artist, ...list];
    }
    return list;
  }, [artists, fetchedArtists, artist]);

  // Currently selected artist object
  const currentSelectedArtist = useMemo(() => {
    if (!selectedArtistId) return artist || combinedArtists[0] || null;
    return (
      combinedArtists.find(
        (a) => String(a.id || a.nailArtistId) === String(selectedArtistId)
      ) || artist || combinedArtists[0] || null
    );
  }, [selectedArtistId, combinedArtists, artist]);

  const handleClose = () => {
    setResultSummary(null);
    onClose();
  };

  const handleSubmit = async () => {
    const targetArtistId = currentSelectedArtist?.nailArtistId || currentSelectedArtist?.id;
    if (!targetArtistId) {
      toast.error("Vui lòng chọn Thợ móng áp dụng nghỉ khẩn cấp.");
      return;
    }
    if (!offDate) {
      toast.error("Vui lòng chọn ngày nghỉ khẩn cấp.");
      return;
    }

    const dateStr = offDate.format("YYYY-MM-DD");

    try {
      setLoading(true);
      const res = await triggerEmergencyOff(targetArtistId, {
        offDate: dateStr,
        reason: reason.trim() || "Sự cố sức khỏe khẩn cấp.",
      });
      setResultSummary(res);
      toast.success("Kích hoạt lịch nghỉ khẩn cấp & Tự động phân bổ lại thành công!", { icon: "🚨" });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Emergency Off failed:", err);
      toast.error(err.message || "Không thể kích hoạt nghỉ khẩn cấp.");
    } finally {
      setLoading(false);
    }
  };

  const artistName =
    currentSelectedArtist?.fullName ||
    currentSelectedArtist?.name ||
    currentSelectedArtist?.artistName ||
    "Chưa chọn Thợ";

  const artistSkillsStr =
    currentSelectedArtist?.skills
      ?.map((s) => s.skillTypeName || s.name || s.skillName)
      .filter(Boolean)
      .join(", ") ||
    currentSelectedArtist?.specialty ||
    "Standard Nail Skills";

  const artistInitials = artistName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      width={620}
      styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden", border: "1px solid #FECDD3" } }}
    >
      <div className="bg-white p-6 md:p-7 font-sans relative overflow-hidden">
        {/* Ambient Red Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-rose-500/15 to-pink-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/5 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] text-[#E11D48] shadow-sm ring-4 ring-[#FFE4E6]">
              <ShieldAlert size={26} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2B182B] tracking-tight flex items-center gap-2">
                Emergency Off Duty
                <span className="rounded-md bg-[#FFE4E6] px-2 py-0.5 text-[10px] font-black text-[#E11D48] uppercase tracking-wider">
                  BR-05
                </span>
              </h3>
              <p className="text-xs text-[#9E8497] font-medium">Kích hoạt chế độ Tạm nghỉ Khẩn cấp cho Thợ Nail</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F5] hover:text-[#E84F93] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Result Summary View */}
        {resultSummary ? (
          <div className="space-y-5 font-sans animate-fadeIn">
            <div className="rounded-2xl border border-[#6EE7B7] bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] p-4.5 text-xs text-[#065F46] shadow-2xs">
              <div className="flex items-center gap-2 font-black text-base text-[#047857] mb-1.5">
                <CheckCircle2 size={20} className="text-[#10B981]" /> Xử Lý Sự Cố Khẩn Cấp Hoàn Tất
              </div>
              <p className="text-xs leading-relaxed text-[#047857]">
                Hệ thống đã tự động quét và phân bổ lại toàn bộ <strong>{resultSummary.totalAffectedBookings || 0} đơn hàng</strong> bị ảnh hưởng của thợ <strong>{artistName}</strong> vào ngày{" "}
                <span className="font-extrabold">{dayjs(resultSummary.offDate).format("DD/MM/YYYY")}</span>.
              </p>
            </div>

            {/* 3 Metric Tiles */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-[#C7D2FE] bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF] p-3.5 shadow-2xs">
                <p className="text-2xl font-black text-[#3730A3]">{resultSummary.autoReassignedCount || 0}</p>
                <p className="text-[10px] font-black uppercase text-[#4338CA] mt-1 flex items-center justify-center gap-1">
                  <UserCheck size={13} /> Re-assigned
                </p>
                <p className="text-[9.5px] text-[#6366F1] mt-0.5 font-medium">Chuyển sang Thợ khác đủ Skill</p>
              </div>

              <div className="rounded-2xl border border-[#FDE68A] bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] p-3.5 shadow-2xs">
                <p className="text-2xl font-black text-[#92400E]">{resultSummary.rescheduleSuggestedCount || 0}</p>
                <p className="text-[10px] font-black uppercase text-[#B45309] mt-1 flex items-center justify-center gap-1">
                  <RefreshCw size={13} /> Reschedule Proposal
                </p>
                <p className="text-[9.5px] text-[#D97706] mt-0.5 font-medium">Đề xuất lùi giờ + Voucher 15%</p>
              </div>

              <div className="rounded-2xl border border-[#FECDD3] bg-gradient-to-b from-[#FEF2F2] to-[#FFE4E6] p-3.5 shadow-2xs">
                <p className="text-2xl font-black text-[#991B1B]">{resultSummary.cancelledAndRefundedCount || 0}</p>
                <p className="text-[10px] font-black uppercase text-[#E11D48] mt-1 flex items-center justify-center gap-1">
                  <XCircle size={13} /> Auto Cancel
                </p>
                <p className="text-[9.5px] text-[#E11D48] mt-0.5 font-medium">Hoàn 100% Cọc + Voucher 20%</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F3E2EC]">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-7 py-2.5 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer"
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          /* Form Controls */
          <div className="space-y-4 relative z-10">
            {/* 1. Artist Selection Dropdown */}
            <div>
              <label className="block text-xs font-black text-[#2B182B] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#E11D48]">
                  <User size={14} /> Chọn Thợ Nail Áp Dụng Nghỉ Khẩn Cấp
                </span>
                <span className="text-[10px] font-bold text-[#9E8497] capitalize">
                  ({combinedArtists.length} thợ trong danh sách)
                </span>
              </label>
              <Select
                showSearch
                loading={loadingArtists}
                value={selectedArtistId || undefined}
                onChange={(val) => setSelectedArtistId(val)}
                placeholder="-- Chọn Thợ Nail --"
                optionFilterProp="label"
                className="w-full h-11 text-xs"
                popupMatchSelectWidth={false}
                options={combinedArtists.map((a) => {
                  const aId = String(a.nailArtistId || a.id);
                  const aName = a.fullName || a.name || a.artistName || "Thợ Nail";
                  const aPhone = a.phone ? ` • ${a.phone}` : "";
                  return {
                    value: aId,
                    label: `${aName}${aPhone}`,
                  };
                })}
              />
            </div>

            {/* Selected Artist Highlight Card */}
            {currentSelectedArtist && (
              <div className="rounded-2xl border border-[#FECDD3] bg-gradient-to-r from-[#FEF2F2] via-[#FFF1F2] to-[#FFE4E6] p-3.5 text-xs text-[#2B182B] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#991B1B] text-xs font-black text-white shadow-xs border border-white/60">
                    {artistInitials}
                  </div>
                  <div>
                    <p className="font-extrabold text-[#991B1B] text-sm flex items-center gap-2">
                      {artistName}
                      {currentSelectedArtist.phone && (
                        <span className="text-[11px] font-medium text-[#BE123C] bg-white/70 px-2 py-0.5 rounded-md">
                          {currentSelectedArtist.phone}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#E11D48] font-medium mt-0.5">
                      Chuyên môn: <span className="font-bold">{artistSkillsStr}</span>
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-gradient-to-r from-[#E11D48] to-[#BE123C] px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-2xs whitespace-nowrap">
                  Emergency Mode
                </span>
              </div>
            )}

            {/* 2. Date Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#2B182B] uppercase tracking-wider mb-1.5 flex items-center gap-1 text-[#2B182B]">
                  <Calendar size={14} className="text-[#E11D48]" /> Ngày nghỉ khẩn cấp
                </label>
                <DatePicker
                  value={offDate}
                  onChange={(d) => setOffDate(d)}
                  format="DD/MM/YYYY"
                  className="w-full rounded-xl border-[#F3D7E4] py-2 text-xs font-bold"
                />
              </div>

              {/* Status Badge Info */}
              <div>
                <label className="block text-xs font-black text-[#2B182B] uppercase tracking-wider mb-1.5 flex items-center gap-1 text-[#2B182B]">
                  <Info size={14} className="text-[#E84F93]" /> Phạm vi áp dụng
                </label>
                <div className="h-10 rounded-xl border border-[#F3E2EC] bg-[#FFF9FB] px-3 flex items-center justify-between text-xs text-[#5C4559]">
                  <span className="font-bold text-[11px]">Cả ngày nghỉ (Full Off)</span>
                  <span className="rounded-md bg-[#FFE4E6] text-[#E11D48] px-2 py-0.5 text-[10px] font-extrabold">
                    Tất cả ca trong ngày
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Reason Input + Presets */}
            <div>
              <label className="block text-xs font-black text-[#2B182B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle size={14} className="text-[#E11D48]" /> Lý do nghỉ đột xuất
              </label>
              <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Nhập lý do sự cố (sốt đột xuất, lý do cá nhân khẩn cấp...)"
                className="rounded-xl border-[#F3D7E4] text-xs font-medium focus:border-[#E84F93]"
              />

              {/* Quick Preset Reason Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-[#9E8497] flex items-center gap-1">
                  <Sparkles size={11} className="text-[#E84F93]" /> Chọn nhanh:
                </span>
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className="rounded-lg border border-[#F3D7E4] bg-[#FFF0F5]/80 px-2 py-1 text-[10px] font-extrabold text-[#991B1B] hover:bg-[#FFE4EE] hover:border-[#E84F93] transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Automated Process Explanation */}
            <div className="rounded-2xl border border-[#FCD34D] bg-gradient-to-r from-[#FFFBEB] via-[#FFFDF5] to-[#FFFBEB] p-3.5 text-xs text-[#B45309] shadow-2xs">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#92400E] mb-1">
                <Clock size={15} className="text-[#D97706]" />
                <span>Quy trình Tự động Phân bổ (Re-assignment Engine):</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[#B45309] font-medium pl-5 list-disc leading-relaxed">
                <li>
                  <strong className="text-[#92400E]">Bước 1:</strong> Tự động điều chuyển lịch hẹn cho Thợ khả dụng cùng khung giờ có đủ Skill Matrix.
                </li>
                <li>
                  <strong className="text-[#92400E]">Bước 2:</strong> Đề xuất lùi/tiến giờ (+/-30-60p) + Voucher 15% bồi thường nếu thợ rảnh khung giờ khác.
                </li>
                <li>
                  <strong className="text-[#92400E]">Bước 3:</strong> Tự động Hủy đơn + Hoàn 100% Cọc + Voucher 20% + Đưa khách vào Waitlist nếu kín thợ.
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#F3E2EC]">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-[#F3D7E4] px-5 py-2.5 text-xs font-black text-[#2B182B] hover:bg-[#FAF0F5] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !currentSelectedArtist}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#991B1B] px-6 py-2.5 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert size={16} />
                {loading ? "Đang xử lý khẩn cấp..." : "Kích Hoạt Emergency Off"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

