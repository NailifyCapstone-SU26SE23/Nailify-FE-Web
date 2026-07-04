import { Modal, Spin } from "antd";
import { BrushCleaning, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  assignReceptionistArtistToBooking,
  fetchAvailableArtistsForReceptionist,
} from "../services/receptionistBookingService";

function getArtistKey(artist) {
  return String(artist?.nailArtistId || "").trim();
}

function getArtistName(artist) {
  return String(artist?.fullName || "").trim() || "Unknown artist";
}

function getArtistInitials(artist) {
  return getArtistName(artist)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";
}

export function AssignReceptionistArtistModal({
  bookingId,
  currentArtistName = "",
  onAssigned,
  onClose,
  open,
}) {
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
          toast.error(error instanceof Error ? error.message : "Failed to load available artists.");
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
      toast.error("Please select a nail artist.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedBooking = await assignReceptionistArtistToBooking(bookingId, selectedArtistId);
      toast.success("Nail artist assigned successfully.");
      onAssigned?.(updatedBooking);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign nail artist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => void handleAssign()}
      confirmLoading={isSubmitting}
      okText="Assign Artist"
      cancelText="Cancel"
      okButtonProps={{
        disabled: !selectedArtistId,
        style: { backgroundColor: "#ea4f93", borderRadius: 9999, fontWeight: 700 },
      }}
      cancelButtonProps={{ style: { borderRadius: 9999, fontWeight: 700 } }}
      centered
      width={760}
      title="Assign Nail Artist"
      destroyOnClose
    >
      <div className="space-y-4 py-2">
        <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] px-4 py-4 text-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
            Booking Context
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-[#8f7b88]">Current artist</span>
            <span className="font-bold text-[#4a3741]">{currentArtistName || "Unassigned"}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spin tip="Loading available artists..." />
          </div>
        ) : artists.length === 0 ? (
          <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#a48796]">
            No available artists found for this booking.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {artists.map((artist) => {
              const artistId = getArtistKey(artist);
              const isSelected = artistId === selectedArtistId;

              return (
                <button
                  key={artistId}
                  type="button"
                  onClick={() => setSelectedArtistId(artistId)}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    isSelected
                      ? "border-[#ea4f93] bg-[#fff1f6] shadow-[0_12px_24px_rgba(236,72,153,0.08)]"
                      : "border-[#f4d6e2] bg-white hover:border-[#ef8eb6]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {artist?.avatarUrl ? (
                      <img crossOrigin="anonymous"
                        src={artist.avatarUrl}
                        alt={getArtistName(artist)}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd6e5_0%,#ef5b94_100%)] text-sm font-black text-white">
                        {getArtistInitials(artist)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-[#412643]">
                          {getArtistName(artist)}
                        </p>
                        <span className="rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[10px] font-bold text-[#1f9d61]">
                          {artist?.status || "Available"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(artist?.skills ?? []).length ? (
                          artist.skills.map((skill, index) => (
                            <span
                              key={`${skill?.skillTypeName || "skill"}-${index}`}
                              className="inline-flex items-center gap-1 rounded-full bg-[#fff7d8] px-2.5 py-1 text-[10px] font-bold text-[#b18211]"
                            >
                              <Star size={10} />
                              {skill?.skillTypeName || "Skill"} Lv.{skill?.level ?? 0}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4efff] px-2.5 py-1 text-[10px] font-bold text-[#7c63d8]">
                            <BrushCleaning size={10} />
                            No skill data
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f1d7e3] bg-white">
                      <UserRound size={14} className={isSelected ? "text-[#ea4f93]" : "text-[#c38ea8]"} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedArtist ? (
          <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] px-4 py-3 text-sm">
            <span className="text-[#8f7b88]">Selected artist:</span>
            <span className="ml-2 font-bold text-[#4a3741]">{getArtistName(selectedArtist)}</span>
          </div>
        ) : null}
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

