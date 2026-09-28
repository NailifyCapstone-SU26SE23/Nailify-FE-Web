import React, { useState } from "react";
import { Modal, Spin } from "antd";
import { UserPlus, CheckCircle2, User, RefreshCcw, LoaderCircle, Users, ArrowRightLeft, BrushCleaning } from "lucide-react";
import toast from "react-hot-toast";
import { confirmOnsiteAddon } from "../../../manager/bookings/services/bookingProceduresService";
import { AssignReceptionistArtistModal } from "./AssignReceptionistArtistModal";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const formatTime = (minutes, language) => {
  if (!minutes) return language === "vi" ? "0 phút" : "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return language === "vi" ? `${h} giờ ${m} phút` : `${h}h ${m}p`;
  if (h > 0) return language === "vi" ? `${h} giờ` : `${h}h`;
  return language === "vi" ? `${m} phút` : `${m}p`;
};

export function OnsiteAddonConflictModal({
  open,
  onClose,
  bookingId,
  conflictData,
  addonItems,
  onSuccess,
}) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [isConfirming, setIsConfirming] = useState(false);
  const [showChangeArtistModal, setShowChangeArtistModal] = useState(false);

  if (!conflictData) return null;

  const {
    suggestedSecondaryArtistId,
    suggestedSecondaryArtistName,
    message,
    totalAddonDurationMinutes,
  } = conflictData;

  const handleConfirmSuggested = async () => {
    try {
      setIsConfirming(true);
      await confirmOnsiteAddon({
        bookingId,
        addonItems,
        assignedArtistId: suggestedSecondaryArtistId,
      });
      toast.success(isVi ? "Xác nhận & Cập nhật lịch thành công!" : "Confirm & Update Schedule Success!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || (isVi ? "Không thể phân công thợ phụ." : "Failed to assign secondary artist."));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleChangeArtist = () => {
    // Ẩn modal conflict và hiện modal chọn thợ
    setShowChangeArtistModal(true);
  };

  const handleCustomAssign = async (artistId) => {
    try {
      setIsConfirming(true);
      await confirmOnsiteAddon({
        bookingId,
        addonItems,
        assignedArtistId: artistId,
      });
      toast.success(isVi ? "Xác nhận & Cập nhật lịch thành công!" : "Confirm & Update Schedule Success!");
      setShowChangeArtistModal(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || (isVi ? "Không thể phân công thợ phụ." : "Failed to assign secondary artist."));
    } finally {
      setIsConfirming(false);
    }
  };

  if (showChangeArtistModal) {
    return (
      <AssignReceptionistArtistModal
        bookingId={bookingId}
        currentArtistName=""
        open={showChangeArtistModal}
        onClose={() => setShowChangeArtistModal(false)}
        // We intercept the assigned artist here
        onAssigned={(dummyUpdatedBooking, customArtistId) => {
          // We might need to handle custom assign differently if AssignReceptionistArtistModal 
          // always calls assignReceptionistArtistToBooking immediately. 
          // BUT wait, AssignReceptionistArtistModal calls `assignReceptionistArtistToBooking` internally!
          // This is a problem. We need to pass the selected artist back. 
        }}
      />
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={480}
      styles={{
        content: {
          padding: 0,
          borderRadius: 24,
          overflow: "hidden",
        },
      }}
    >
      <div className="bg-white p-6 relative font-sans">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F6] text-[#E84F93] mb-4 shadow-sm border border-[#F3D7E4]">
            <ArrowRightLeft size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#0F172A] mb-2">{isVi ? "Xung Đột Lịch Thợ Chính!" : "Main Technician Schedule Conflict!"}</h3>

          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 mb-4 w-full text-sm text-[#991B1B] text-left">
            {message || (isVi ? "Thợ chính đang bận, không thể thực hiện thêm các dịch vụ phát sinh." : "Main technician is busy, cannot perform additional services.")}
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 w-full mb-6 text-left">
            <p className="text-xs font-bold text-[#64748B] mb-2 uppercase">{isVi ? "Gợi ý phân công thợ phụ:" : "Suggested secondary artist:"}</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white">
                <BrushCleaning size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{suggestedSecondaryArtistName || (isVi ? "Thợ phụ" : "Secondary artist")}</p>
                <p className="text-xs text-[#64748B]">{isVi ? "Dự kiến:" : "Estimated:"} {formatTime(totalAddonDurationMinutes)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirmSuggested}
            disabled={isConfirming}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E84F93] to-[#8B5CF6] px-6 py-3 text-sm font-bold text-white shadow-md hover:scale-[1.02] transition disabled:opacity-50"
          >
            {isConfirming ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {isVi ? "Đồng ý giao cho " : "Confirm assignment to "}{suggestedSecondaryArtistName}
          </button>

          {/* <button
            onClick={handleChangeArtist}
            disabled={isConfirming}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition disabled:opacity-50"
          >
            <Users size={18} />
            Chọn một thợ phụ khác
          </button> */}

          <button
            onClick={onClose}
            disabled={isConfirming}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-6 py-2 text-sm font-bold text-[#94A3B8] hover:text-[#0F172A] transition disabled:opacity-50"
          >
            {isVi ? "Hủy thao tác" : "Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
