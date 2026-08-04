import React, { useState, useEffect } from 'react';
import { useAuth } from "../../auth/hooks/useAuth";
import { useSalonChairs, useLiveChairStatus } from "../hooks/useChairs";
import ChairMap from "../../../../shared/components/ui/ChairMap";
import { Modal, Spin, Button, Tooltip } from "antd";
import { LoaderCircle, Armchair, User, Plus, Eye } from "lucide-react";
import dayjs from "dayjs";
import { AssignBookingModal } from "../components/AssignBookingModal";
import { useQueryClient } from "@tanstack/react-query";
import { CHAIRS_QUERY_KEYS } from "../hooks/useChairs";

export function ChairsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const salonId = user?.salonId;

  // Use today's date for live status, formatted as YYYY-MM-DD
  const todayDate = dayjs().format('YYYY-MM-DD');

  const { data: chairsData, isLoading: isLoadingChairs, error: chairsError } = useSalonChairs(salonId);
  const { data: liveStatusData, isLoading: isLoadingLiveStatus, error: liveStatusError } = useLiveChairStatus(salonId, todayDate);

  const [selectedChair, setSelectedChair] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [assignChair, setAssignChair] = useState(null);

  const isLoading = isLoadingChairs || isLoadingLiveStatus;
  const error = chairsError || liveStatusError;

  const handleChairClick = (chairInfo, liveInfo) => {
    setSelectedChair({ chairInfo, liveInfo });
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedChair(null);
  };

  const renderCell = (cellName, chairInfo) => {
    if (!chairInfo) {
      return (
        <div key={cellName} className="w-[90px] h-[90px] border border-dashed border-gray-200 rounded-2xl flex items-center justify-center opacity-40 bg-gray-50/50">
          <span className="text-gray-400 font-medium text-xs">{cellName}</span>
        </div>
      );
    }

    // Find live status for this chair
    const liveInfo = liveStatusData?.find(status => status.chairId === chairInfo.chairId) || {};
    const isOccupied = liveInfo.isOccupied;
    const currentCustomer = liveInfo.currentCustomer;

    const bgColor = isOccupied ? 'bg-pink-50' : 'bg-emerald-50';
    const borderColor = isOccupied ? 'border-pink-200' : 'border-emerald-200';
    const textColor = isOccupied ? 'text-pink-600' : 'text-emerald-600';

    return (
      <div
        key={cellName}
        className={`group w-[90px] h-[90px] border ${borderColor} ${bgColor} rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all`}
      >
        <span className={`font-bold ${textColor} text-lg mb-1 group-hover:opacity-10 transition-opacity`}>{chairInfo.chairName}</span>
        {isOccupied ? (
          <div className="flex flex-col items-center leading-tight px-1 w-full group-hover:opacity-10 transition-opacity">
            <span className="inline-flex rounded-full bg-pink-500 px-2 py-0.5 text-[9px] font-bold text-white mb-0.5 whitespace-nowrap">
              Occupied
            </span>
            <span className="text-[9px] text-pink-600 font-semibold text-center w-full truncate px-1">
              {typeof currentCustomer === 'object' ? currentCustomer?.customerName : currentCustomer}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center leading-tight w-full group-hover:opacity-10 transition-opacity">
            <span className="inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
              Available
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="flex flex-row justify-center items-center align-center gap-2 absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 px-3">
          <Tooltip title="View details" placement="top">
            <Button
              type="primary"
              size="small"
              icon={<Eye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleChairClick(chairInfo, liveInfo);
              }}
              className="w-full text-[11px] font-medium bg-blue-500 hover:bg-blue-600 border-none rounded-md shadow-sm flex items-center justify-center gap-1"
            >
            </Button>
          </Tooltip>

          {!isOccupied && (
            <Tooltip title="Assign chair" placement="top">
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignChair(chairInfo);
                }}
                className="w-full text-[11px] font-medium !text-black !bg-yellow-500 hover:!bg-yellow-400 !border-none rounded-md shadow-sm flex items-center justify-center gap-1"
              >
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-24 lg:pb-8 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-[24px] border border-[#f7e0ea] bg-white p-6 shadow-[0_10px_40px_rgba(234,79,147,0.04)]">
            <div className="flex flex-col items-center gap-3 text-[#b38a9f]">
              <LoaderCircle size={32} className="animate-spin text-[#ea4f93]" />
              <p className="text-sm font-medium">Loading chair data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#f7e0ea] bg-white p-6 text-center shadow-[0_10px_40px_rgba(234,79,147,0.04)] text-[#ea4f93]">
            <p>Failed to load chair data. Please try again later.</p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[#f7e0ea] bg-white p-6 shadow-[0_10px_40px_rgba(234,79,147,0.04)]">
            <ChairMap chairs={chairsData || []} renderCell={renderCell} />
          </div>
        )}
      </div>

      {selectedChair && (
        <Modal
          title={
            <div className="flex items-center gap-2 text-[#432744]">
              <Armchair className="text-[#ea4f93]" size={20} />
              <span className="font-bold text-lg">Chair {selectedChair?.chairInfo?.chairName} Details</span>
            </div>
          }
          open={isModalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={400}
          centered
          className="rounded-2xl"
        >
          <div className="mt-4 space-y-4 text-sm text-[#584654]">
            <div className="flex justify-between items-center py-2 border-b border-[#f7e0ea]">
              <span className="font-semibold text-[#aa8a99]">isOccupied</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedChair.liveInfo?.isOccupied ? "bg-pink-50 text-pink-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                {selectedChair.liveInfo?.isOccupied ? "true" : "false"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#f7e0ea]">
              <span className="font-semibold text-[#aa8a99]">System Status</span>
              <span className="font-bold">{selectedChair.chairInfo?.status}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#f7e0ea]">
              <span className="font-semibold text-[#aa8a99]">Salon Name</span>
              <span className="font-bold">{selectedChair.chairInfo?.salonName}</span>
            </div>

            <div className="bg-[#fff8fb] rounded-xl p-4 border border-[#f7e0ea] mt-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedChair.liveInfo?.isOccupied ? 'bg-pink-100 text-pink-500' : 'bg-emerald-100 text-emerald-500'}`}>
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#aa8a99]">currentCustomer</p>
                <p className="font-bold text-[#432744] text-base truncate">
                  {selectedChair.liveInfo?.isOccupied ? (
                    typeof selectedChair.liveInfo?.currentCustomer === 'object'
                      ? selectedChair.liveInfo?.currentCustomer?.customerName
                      : (selectedChair.liveInfo?.currentCustomer || "Walk-In")
                  ) : (
                    <span className="text-gray-400 italic">None</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <AssignBookingModal
        isOpen={!!assignChair}
        onClose={() => setAssignChair(null)}
        salonId={salonId}
        chair={assignChair}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: CHAIRS_QUERY_KEYS.liveStatus(salonId, todayDate) });
        }}
      />
    </div>
  );
}
