import React, { useEffect, useState } from "react";
import { Modal, Button, Rate } from "antd";
import { MessageSquareWarning, X, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationSignalRService } from "../../../core/notifications/services/notificationSignalRService";

export const NegativeReviewModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    // Lắng nghe SignalR cho cảnh báo NegativeReviewAlert
    const unsubscribe = notificationSignalRService.registerListener((type, payload) => {
      const messageType = type?.MessageType || type || "";
      if (messageType === "NegativeReviewAlert" || messageType === "NEGATIVE_REVIEW_ALERT") {
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
    }, 300);
  };

  const handleProcess = () => {
    // Chuyển hướng hoặc thực hiện action xử lý
    handleClose();
    // TODO: Navigate to review details if needed
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
              className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-500 to-rose-600 p-1 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.5)]"
            >
              {/* Pulse effect background */}
              <div className="absolute -left-[50%] -top-[50%] h-[200%] w-[200%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(transparent,rgba(255,255,255,0.3),transparent)]" />
              
              <div className="relative rounded-[22px] bg-white p-6 shadow-inner">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    <AlertOctagon size={32} className="animate-pulse" />
                  </div>
                  
                  <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                    Bình Luận Tiêu Cực!
                  </h2>
                  <p className="mb-6 text-sm text-gray-500">
                    Hệ thống AI vừa phát hiện một đánh giá xấu từ khách hàng. Cần kiểm tra ngay để tránh rủi ro truyền thông!
                  </p>

                  <div className="w-full space-y-3 rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-700">Mã đơn: <span className="font-bold">#{alertData?.bookingId?.substring(0, 8) || alertData?.BookingId?.substring(0, 8) || "N/A"}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Đánh giá:</span>
                      <Rate disabled defaultValue={alertData?.stars || alertData?.Stars || 1} className="text-sm text-orange-500" />
                    </div>
                    
                    <div className="mt-3 border-t border-orange-200 pt-3">
                      <div className="flex items-start gap-2">
                        <MessageSquareWarning size={16} className="text-orange-600 mt-1 flex-shrink-0" />
                        <div className="text-sm italic text-gray-700 bg-white p-3 rounded-lg border border-orange-100 w-full shadow-sm">
                          "{alertData?.comment || alertData?.Comment || "Khách hàng không để lại bình luận chi tiết."}"
                        </div>
                      </div>
                    </div>
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
                      className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700 border-none shadow-[0_8px_16px_-4px_rgba(249,115,22,0.4)]"
                      onClick={handleProcess}
                    >
                      Xử lý ngay
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
