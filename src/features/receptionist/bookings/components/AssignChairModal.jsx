import React, { useState, useEffect } from "react";
import { Modal, Button, Spin, Tooltip } from "antd";
import toast from "react-hot-toast";
import ChairMap from "../../../../shared/components/ui/ChairMap";
import { fetchSalonChairs, fetchAvailableSalonChairs, assignChairToBooking } from "../services/receptionistBookingService";
import { Armchair } from "lucide-react";

export function AssignChairModal({ isOpen, onClose, booking, onSuccess, onAssign }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chairs, setChairs] = useState([]);
  const [availableChairIds, setAvailableChairIds] = useState(new Set());
  const [selectedChair, setSelectedChair] = useState(null);

  useEffect(() => {
    if (isOpen && booking?.salonId) {
      loadChairs();
    }
  }, [isOpen, booking]);

  const loadChairs = async () => {
    setLoading(true);
    setSelectedChair(null);
    try {
      const salonId = booking.salonId;

      const [chairsData, availableChairsData] = await Promise.all([
        fetchSalonChairs(salonId),
        fetchAvailableSalonChairs(salonId, {
          bookingDate: booking?.bookingDate || new Date().toISOString().split('T')[0],
          startTime: booking?.startTime || new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
          duration: booking?.totalDuration || 60,
        }).catch(err => {
          // If available chairs API fails, return empty array
          console.error("Failed to load available chairs", err);
          return [];
        })
      ]);

      const allChairs = Array.isArray(chairsData?.items) ? chairsData.items : [];
      setChairs(allChairs);

      const availableChairs = Array.isArray(availableChairsData) ? availableChairsData : [];
      setAvailableChairIds(new Set(availableChairs.map(c => c.chairId)));

    } catch (error) {
      toast.error("Failed to load chairs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedChair) return;

    setSubmitting(true);
    try {
      if (onAssign) {
        await onAssign(selectedChair);
      } else if (booking?.bookingId) {
        await assignChairToBooking(booking.bookingId, selectedChair.chairId);
        toast.success("Chair assigned successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to assign chair");
    } finally {
      setSubmitting(false);
    }
  };

  const renderChairCell = (cellName, chair) => {
    if (!chair) {
      return (
        <div key={cellName} className="flex h-16 w-[90px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <span className="text-xs font-medium text-gray-400">{cellName}</span>
        </div>
      );
    }

    const isAvailable = availableChairIds.has(chair.chairId);
    const isSelected = selectedChair?.chairId === chair.chairId;

    let baseClasses = "flex flex-col h-16 w-[90px] items-center justify-center rounded-xl border-2 cursor-pointer transition-all duration-200";
    let stateClasses = "";

    if (isSelected) {
      stateClasses = "border-pink-500 bg-pink-50 text-pink-700 shadow-md scale-105";
    } else if (isAvailable) {
      stateClasses = "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-sm";
    } else {
      stateClasses = "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed";
    }

    return (
      <Tooltip key={cellName} title={!isAvailable ? "Ghế đã có khách" : "Ghế trống"}>
        <div
          className={`${baseClasses} ${stateClasses}`}
          onClick={() => {
            if (isAvailable) {
              setSelectedChair(isSelected ? null : chair);
            }
          }}
        >
          <Armchair size={16} className={isSelected ? "text-pink-500 mb-1" : "mb-1"} />
          <span className="text-xs font-bold">{chair.chairName}</span>
        </div>
      </Tooltip>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <Armchair size={16} />
          </span>
          Assign Chair
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      destroyOnClose
      className="rounded-2xl"
    >
      <div className="mt-2 text-sm text-gray-600 mb-6">
        <p>Vui lòng chọn ghế trống cho khách hàng <strong>{booking?.customerName}</strong> lúc <strong>{booking?.startTime ? booking.startTime.substring(0, 5) : "--"}</strong></p>
      </div>

      <div className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
            <Spin size="large" />
          </div>
        ) : null}

        <div className="bg-[#FFF9FB] border border-[#F3E2EC] p-6 rounded-2xl overflow-x-auto shadow-inner">
          <ChairMap chairs={chairs} renderCell={renderChairCell} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-50 border border-emerald-200"></div>
            <span className="text-xs font-medium text-gray-600">Còn trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gray-100 border border-gray-200"></div>
            <span className="text-xs font-medium text-gray-600">Đã bận</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-pink-50 border border-pink-500"></div>
            <span className="text-xs font-medium text-gray-600">Đang chọn</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} className="rounded-xl font-semibold">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleAssign}
            disabled={!selectedChair}
            loading={submitting}
            className="!bg-[#ea4f93] hover:!bg-[#d63d7e] border-none !font-semibold !rounded-xl !shadow-sm !shadow-pink-200/50"
          >
            Confirm Assignment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
