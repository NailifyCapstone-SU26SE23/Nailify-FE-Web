import React, { useEffect, useState } from "react";
import { Modal, Button, Select, message } from "antd";
import { AlertTriangle, Clock, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationSignalRService } from "../../../core/notifications/services/notificationSignalRService";
import { assignArtistToBooking } from "../services/bookingsService";

export const SlaViolationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Đăng ký lắng nghe SignalR cho cảnh báo đè ca
    const unsubscribe = notificationSignalRService.registerListener((type, payload) => {
      const messageType = type?.MessageType || type || "";
      if (messageType === "SLA_VIOLATION_ALERT") {
        const data = payload || type?.Payload;
        if (data) {
          setAlertData(data);
          setIsOpen(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setAlertData(null);
      setSelectedArtistId(null);
    }, 300);
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      closable={false}
      centered
      width={480}
      modalRender={(modal) => (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-red-600 to-rose-700 p-1 shadow-[0_20px_50px_-12px_rgba(225,29,72,0.5)]"
            >
              {/* Pulse effect background */}
              <div className="absolute -left-[50%] -top-[50%] h-[200%] w-[200%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(transparent,rgba(255,255,255,0.3),transparent)]" />

              <div className="relative rounded-[22px] bg-white p-6 shadow-inner">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <AlertTriangle size={32} className="animate-pulse" />
                  </div>

                  <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                    Cảnh Báo Chậm Trễ
                  </h2>
                  <p className="mb-6 text-sm text-gray-500">
                    Khách hàng đang phải chờ đợi lâu hơn dự kiến. Cần xử lý ngay!
                  </p>

                  <div className="w-full space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-left">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-red-500" />
                      <span className="font-medium text-gray-700">Khách hàng:</span>
                      <span className="font-semibold text-gray-900">{alertData?.customerName || alertData?.CustomerName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-red-500" />
                      <span className="font-medium text-gray-700">Trễ dự kiến:</span>
                      <span className="font-bold text-red-600">{alertData?.estimatedDelayMinutes || alertData?.EstimatedDelayMinutes || 0} phút</span>
                    </div>

                    {(alertData?.availableAlternativeArtists?.length > 0 || alertData?.AvailableAlternativeArtists?.length > 0) && (
                      <div className="mt-4 border-t border-red-200 pt-3">
                        <span className="mb-2 block font-medium text-gray-700 text-sm">Đổi thợ ngay lập tức (1-Click Re-assign):</span>
                        <Select
                          style={{ width: "100%" }}
                          size="large"
                          placeholder="Chọn thợ thay thế..."
                          value={selectedArtistId}
                          onChange={(val) => setSelectedArtistId(val)}
                          options={(alertData.availableAlternativeArtists || alertData.AvailableAlternativeArtists).map(artist => ({
                            value: artist.nailArtistId || artist.NailArtistId,
                            label: (
                              <div className="flex justify-between items-center w-full">
                                <span>{artist.artistName || artist.ArtistName}</span>
                                {(artist.isFullyAvailable ?? artist.IsFullyAvailable) ? (
                                  <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200">Khả dụng</span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">Có kẹt lịch</span>
                                )}
                              </div>
                            )
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex w-full gap-3">
                    <Button
                      size="large"
                      className="flex-1 rounded-xl border-gray-200"
                      onClick={handleClose}
                    >
                      Bỏ qua
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      danger
                      loading={isSubmitting}
                      className="flex-1 rounded-xl bg-red-600 shadow-[0_8px_16px_-4px_rgba(220,38,38,0.4)]"
                      onClick={async () => {
                        if (selectedArtistId) {
                          try {
                            setIsSubmitting(true);
                            const bookingId = alertData?.affectedBookingId || alertData?.AffectedBookingId;
                            await assignArtistToBooking(bookingId, selectedArtistId);
                            message.success("Đổi thợ thành công! Khách hàng đã được cập nhật.");
                            handleClose();
                          } catch (error) {
                            message.error("Có lỗi xảy ra khi đổi thợ.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        } else {
                          handleClose();
                        }
                      }}
                    >
                      {selectedArtistId ? "Xác Nhận Đổi Thợ" : "Xác Nhận Đã Biết"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    />
  );
};
