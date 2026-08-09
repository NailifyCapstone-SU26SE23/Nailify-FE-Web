import { Modal, Spin, Button } from "antd";
import { BrushCleaning, Check, LoaderCircle, Sparkles, Star, UserCheck, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  assignReceptionistArtistToBooking,
  fetchAvailableArtistsForReceptionist,
} from "../services/receptionistBookingService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

function getArtistKey(artist) {
  return String(artist?.nailArtistId || "").trim();
}

function getArtistName(artist) {
  return String(artist?.fullName || "").trim() || "Unknown artist";
}

// function getArtistInitials(artist) {
//   return getArtistName(artist)
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0])
//     .join("")
//     .toUpperCase() || "NA";
// }

function getArtistInitials(artist) {
  const parts = getArtistName(artist)
    .split(" ")
    .filter(Boolean);

  if (!parts.length) return "NA";

  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AssignReceptionistArtistModal({
  bookingId,
  currentArtistName = "",
  onAssigned,
  onClose,
  open,
}) {
  const { t, language } = useLanguage();
  const [artists, setArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isCancelled = false;

    const loadArtists = async () => {
      setIsLoading(true);
      setSelectedArtistId("");

      try {
        const data = await fetchAvailableArtistsForReceptionist(bookingId);

        if (!isCancelled) {
          setArtists(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!isCancelled) {
          setArtists([]);
          toast.error(error instanceof Error ? error.message : (t("receptionist.bookings.assignArtistFailed") || "Failed to load available artists."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadArtists();

    return () => {
      isCancelled = true;
    };
  }, [bookingId, open]);

  const selectedArtist = useMemo(
    () => artists.find((artist) => getArtistKey(artist) === selectedArtistId) || null,
    [artists, selectedArtistId],
  );

  const handleAssign = async () => {
    if (!selectedArtistId) {
      toast.error(t("receptionist.bookings.selectArtistError") || "Vui lòng chọn thợ làm móng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedBooking = await assignReceptionistArtistToBooking(bookingId, selectedArtistId);
      toast.success(t("receptionist.bookings.assignArtistSuccess") || "Phân công thợ thành công.");
      onAssigned?.(updatedBooking);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (t("receptionist.bookings.assignArtistFailed") || "Không thể phân công thợ."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [imageErrors, setImageErrors] = useState({});
  const handleImageError = (artistId) => {
    setImageErrors((prev) => ({
      ...prev,
      [artistId]: true,
    }));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={780}
      styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden" } }}
      destroyOnClose
    >
      <div className="bg-white p-6 md:p-7 relative font-sans">
        {/* Ambient Pink/Purple Top Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#E84F93]/10 blur-3xl" />

        {/* Modal Header Bar */}
        <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] text-white shadow-xs">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B182B] tracking-tight">{t("receptionist.bookings.assignArtistTitle") || "Phân Công / Đổi Thợ Làm Móng"}</h3>
              <p className="text-xs text-[#9E8497] font-medium">{t("receptionist.bookings.assignArtistDesc") || "Chọn thợ làm móng chính đảm nhận cho đơn đặt lịch này"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F6] hover:text-[#E84F93] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Booking Context Card */}
        <div className="mb-5 rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF5FA] to-[#F5F3FF] p-4 text-xs shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#E84F93]" />
            <span className="font-bold text-[#9E8497]">{t("receptionist.bookings.currentlyAssigned") || "Thợ Đang Được Phân Công:"}</span>
            <span className="font-bold text-[#2B182B] text-sm">{currentArtistName || (t("receptionist.bookings.unassigned") || "Chưa phân công thợ nào")}</span>
          </div>
          {currentArtistName && (
            <span className="rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-bold text-[#047857]">
              {t("receptionist.bookings.currentBadge") || "Hiện Tại"}
            </span>
          )}
        </div>

        {/* Available Artists Grid */}
        {isLoading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8">
            <LoaderCircle size={28} className="animate-spin text-[#E84F93]" />
            <p className="text-xs font-bold text-[#2B182B]">{t("receptionist.bookings.loadingArtists") || "Đang tải danh sách thợ khả dụng..."}</p>
          </div>
        ) : artists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8 text-center text-xs font-bold text-[#9E8497]">
            {t("receptionist.bookings.noAvailableArtists") || "Không tìm thấy thợ nào khả dụng cho đơn đặt lịch này."}
          </div>
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2 max-h-[50vh] overflow-y-auto pr-1">
            {artists.map((artist) => {
              const artistId = getArtistKey(artist);
              const isSelected = artistId === selectedArtistId;

              return (
                <button
                  key={artistId}
                  type="button"
                  onClick={() => setSelectedArtistId(artistId)}
                  className={`relative flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${isSelected
                    ? "border-[#E84F93] bg-[#FFF0F6] ring-2 ring-[#E84F93]/20 shadow-md scale-[1.01]"
                    : "border-[#F3E2EC] bg-white hover:border-[#E84F93]/50 hover:bg-[#FFF9FB] hover:shadow-xs"
                    }`}
                >
                  {artist?.avatarUrl && !imageErrors[artistId] ? (
                    <img
                      crossOrigin="anonymous"
                      src={artist.avatarUrl}
                      alt={getArtistName(artist)}
                      onError={() => handleImageError(artistId)}
                      className="h-13 w-13 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-base font-bold text-white shadow-xs shrink-0">
                      {getArtistInitials(artist)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-[#2B182B]">
                        {getArtistName(artist)}
                      </p>
                      <span className="rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[10px] font-bold text-[#047857] shrink-0">
                        {artist?.status || (t("receptionist.bookings.ready") || "Sẵn sàng")}
                      </span>
                    </div>

                    {/* Skill Pills */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {(artist?.skills ?? []).length ? (
                        artist.skills.map((skill, index) => (
                          <span
                            key={`${skill?.skillTypeName || "skill"}-${index}`}
                            className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 text-[10px] font-bold text-[#B45309]"
                          >
                            <Star size={9} className="fill-current" />
                            {skill?.skillTypeName || "Skill"} Lv.{skill?.level ?? 0}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]">
                          <BrushCleaning size={9} />
                          Nail Staff
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Check Circle */}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5">
                    {isSelected ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E84F93] text-white shadow-2xs">
                        <Check size={14} />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-[#D1C2CD]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Artist Confirmation Box */}
        {selectedArtist && (
          <div className="mt-4 rounded-xl border border-[#E84F93]/30 bg-[#FFF0F6] px-4 py-2.5 text-xs flex items-center justify-between">
            <span className="font-bold text-[#9E8497]">{t("receptionist.bookings.selectedArtistLabel") || "Đã chọn thợ:"}</span>
            <span className="font-bold text-[#E84F93] text-sm">{getArtistName(selectedArtist)}</span>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F3E2EC] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#F3E2EC] bg-[#FFF5F8] hover:bg-[#FCE2EE] px-5 py-2.5 text-xs font-bold text-[#2B182B] transition cursor-pointer"
          >
            {t("receptionist.common.cancel") || "Hủy Bỏ"}
          </button>
          <button
            type="button"
            onClick={() => void handleAssign()}
            disabled={!selectedArtistId || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(232,79,147,0.25)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <UserCheck size={15} />
            )}
            <span>{isSubmitting ? (t("receptionist.bookings.assigning") || "Đang Phân Công...") : (t("receptionist.bookings.confirmAssignArtist") || "Xác Nhận Phân Công Thợ")}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

AssignReceptionistArtistModal.propTypes = {
  bookingId: PropTypes.string,
  currentArtistName: PropTypes.string,
  onAssigned: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

