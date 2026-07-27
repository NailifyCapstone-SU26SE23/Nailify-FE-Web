import React from "react";
import { Modal, Button } from "antd";
import { Check, Clock, User, AlertCircle } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

function getProcedureStatusTone(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["completed", "done"].includes(normalizedStatus)) {
    return "bg-[#e7f8ee] text-[#16975f] border-[#cfead9]";
  }

  if (["inprogress", "in progress", "active"].includes(normalizedStatus)) {
    return "bg-[#efeafd] text-[#7c63d8] border-[#e3dbff]";
  }

  if (["pending", "waiting", "upcoming"].includes(normalizedStatus)) {
    return "bg-[#fff4e3] text-[#e09a27] border-[#ffe2b5]";
  }

  return "bg-gray-50 text-gray-600 border-gray-200";
}

export function ServiceProceduresViewerModal({
  isOpen,
  onClose,
  service,
  procedures,
  isLoading,
  error,
  onClaimProcedure,
  onCompleteProcedure,
  claimingProcedureId,
  procedureStatusUpdates,
}) {
  const formatTimeOnly = (val) => {
    if (!val) return "--:--";
    const str = String(val).trim();

    const timeSpanMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?$/);
    if (timeSpanMatch) {
      const hh = timeSpanMatch[1].padStart(2, "0");
      const mm = timeSpanMatch[2];
      return `${hh}:${mm}`;
    }

    if (str.includes("T")) return str.split("T").pop().slice(0, 5);
    return str.slice(0, 5);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={980}
      styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden" } }}
    >
      <div className="bg-white p-6 md:p-7 relative font-sans">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#E84F93]/10 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] text-white shadow-xs">
              <Check size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2B182B] tracking-tight">Quy Trình Các Bước Làm Móng</h3>
              <p className="text-xs text-[#9E8497] font-medium">Chi tiết thời gian thao tác, hơ máy/chờ và phân công thợ theo từng bước</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F6] hover:text-[#E84F93] transition cursor-pointer"
          >
            <AlertCircle size={18} className="rotate-45" />
          </button>
        </div>

        {service ? (
          <div className="space-y-4">
            {/* Service Summary Banner Card */}
            <div className="rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F6] via-[#FDF2F8] to-[#F5F3FF] p-4 shadow-2xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#E84F93]">Dịch Vụ Chọn</span>
                <h4 className="text-base font-black text-[#2B182B]">{service.name || "--"}</h4>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-xl border border-[#F3E2EC] bg-white px-3 py-1.5 font-bold text-[#2B182B]">
                  Số lượng: x{service.quantity || 1}
                </span>
                <span className="rounded-xl border border-[#F3E2EC] bg-white px-3 py-1.5 font-black text-[#E84F93]">
                  ⏱️ Tổng thời gian: {service.durationLabel || "--"}
                </span>
              </div>
            </div>

            {/* Procedures Scrollable Steps Container */}
            {isLoading ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#E84F93] border-t-transparent" />
                <p className="text-xs font-bold text-[#2B182B]">Đang tải chi tiết các bước quy trình...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-xs font-bold text-[#991B1B] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : procedures && procedures.length > 0 ? (
              <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-3.5">
                {procedures.map((procedure, index) => {
                  const statusLower = String(procedure.status || "").toLowerCase();
                  const isCompleted = ["completed", "done"].includes(statusLower);
                  const isInProgress = ["inprogress", "in progress", "active"].includes(statusLower);
                  const isPending = ["pending", "waiting", "upcoming"].includes(statusLower);

                  let statusTone = "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]";
                  let statusLabel = procedure.status || "Chưa làm";

                  if (isCompleted) {
                    statusTone = "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]";
                    statusLabel = "Đã hoàn thành";
                  } else if (isInProgress) {
                    statusTone = "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]";
                    statusLabel = "Đang thực hiện";
                  } else if (isPending) {
                    statusTone = "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]";
                    statusLabel = "Chờ thực hiện";
                  }

                  const hasArtist = Boolean(procedure.assignedArtistId || procedure.assignedArtistName);
                  const hasPassive = Boolean(procedure.passiveDuration && procedure.passiveDuration > 0);

                  return (
                    <div
                      key={procedure.bookingProcedureId || procedure.id || `${procedure.procedureId}-${procedure.stepOrder}`}
                      className="group relative rounded-2xl border border-[#F3E2EC] bg-white p-4 shadow-2xs hover:border-[#F3D6E5] hover:shadow-xs transition-all duration-200"
                    >
                      {/* Step Header Bar */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#F8F1F5] pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#E84F93] to-[#D93B7D] px-2.5 py-0.5 text-xs font-black text-white shadow-2xs">
                            Bước {procedure.stepOrder ?? index + 1}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusTone}`}>
                            {statusLabel}
                          </span>
                          {procedure.isRequired && (
                            <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-black text-[#B45309]">
                              Bắt buộc
                            </span>
                          )}
                          <h4 className="text-sm font-black text-[#2B182B] ml-1">
                            {procedure.procedureName || procedure.label || "Chưa đặt tên bước"}
                          </h4>
                        </div>

                        {/* Estimated Time Badge */}
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          <span className="font-extrabold text-[#E84F93]">
                            🕒 Dự kiến: {formatTimeOnly(procedure.estimatedStartTime)} - {formatTimeOnly(procedure.estimatedEndTime)}
                          </span>
                          <span className="rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[11px] font-black text-[#E84F93] border border-[#F3D6E5]">
                            {procedure.duration ?? 0} min
                          </span>
                        </div>
                      </div>

                      {/* Main Content Grid Row */}
                      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] items-center">
                        {/* Left: Thợ Đảm Nhận & Actions */}
                        <div className="flex items-center justify-between rounded-xl border border-[#F3E2EC] bg-[#FFF9FB] p-2.5 sm:px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-xs font-black text-white shadow-2xs">
                              {(procedure.assignedArtistName || "A")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p) => p[0])
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-[#9E8497]">Thợ Đảm Nhận</p>
                              <p className="text-xs font-black text-[#2B182B]">
                                {hasArtist ? procedure.assignedArtistName : "Chưa phân công thợ"}
                              </p>
                            </div>
                          </div>

                          {/* Interactive Claim / Complete Action Buttons */}
                          {onClaimProcedure && procedure.canClaim ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimProcedure(procedure);
                              }}
                              disabled={claimingProcedureId === procedure.bookingProcedureId}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E84F93] to-[#8B5CF6] px-4 py-1.5 text-xs font-black text-white shadow-2xs hover:scale-105 transition cursor-pointer disabled:opacity-50"
                            >
                              {claimingProcedureId === procedure.bookingProcedureId && (
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              )}
                              <span>Nhận Bước Này</span>
                            </button>
                          ) : onCompleteProcedure && procedure.canComplete ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteProcedure(procedure);
                              }}
                              disabled={procedureStatusUpdates && procedureStatusUpdates[procedure.bookingProcedureId]}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-1.5 text-xs font-black text-white shadow-2xs hover:scale-105 transition cursor-pointer disabled:opacity-50"
                            >
                              <span>Hoàn Thành Bước</span>
                            </button>
                          ) : procedure.isBlocked ? (
                            <span className="inline-flex rounded-full bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1 text-[10px] font-black text-[#B45309]">
                              Chờ bước trước
                            </span>
                          ) : null}
                        </div>

                        {/* Right: Time Breakdown & Overlap Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-1 text-[11px] font-black text-[#6D28D9]">
                            ⚡ Thao tác trực tiếp: {procedure.activeDuration ?? 0}m
                          </span>

                          {hasPassive && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#BAE6FD] bg-[#F0F9FF] px-2.5 py-1 text-[11px] font-black text-[#0284C7]">
                              ⏳ Hơ máy / Chờ khô: {procedure.passiveDuration}m
                            </span>
                          )}

                          {(hasPassive || procedure.canOverlap) ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-black text-[#047857]">
                              ✨ Overlap (Rảnh {procedure.passiveDuration ?? 0}m)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                              🔒 Làm liên tục
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Extra Guidance Note for Passive Time */}
                      {hasPassive && (
                        <div className="mt-2 text-[11px] font-semibold text-[#6D28D9] bg-[#F5F3FF] p-2 rounded-lg border border-[#E9D5FF] flex items-center gap-1.5">
                          <span>💡</span>
                          <span>
                            Trong <strong>{procedure.passiveDuration} phút</strong> hơ máy / chờ khô này, thợ rảnh tay và có thể tranh thủ làm cho khách khác (Overlap).
                          </span>
                        </div>
                      )}

                      {/* Footer Row: Actual Time & Completion */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F8F1F5] pt-2 text-[11px]">
                        <div>
                          <span className="font-bold text-[#9E8497]">Thực tế làm: </span>
                          <span className="font-black text-[#2B182B]">
                            {formatTimeOnly(procedure.actualStartTime || procedure.startTime)} ~ {formatTimeOnly(procedure.actualEndTime || procedure.completedAt)}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-[#9E8497]">Người hoàn thành: </span>
                          <span className="font-black text-[#2B182B]">
                            {procedure.completedByName || <span className="text-[#9E8497] italic font-normal">Chưa xong</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8 text-center text-xs font-bold text-[#9E8497]">
                Không tìm thấy bước quy trình nào cho dịch vụ này.
              </div>
            )}

            {/* Modal Footer Close Button */}
            <div className="flex justify-end border-t border-[#F3E2EC] pt-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#F3E2EC] bg-[#FFF5F8] hover:bg-[#FCE2EE] px-6 py-2.5 text-xs font-black text-[#2B182B] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

ServiceProceduresViewerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  service: PropTypes.object,
  procedures: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onClaimProcedure: PropTypes.func,
  onCompleteProcedure: PropTypes.func,
  claimingProcedureId: PropTypes.string,
  procedureStatusUpdates: PropTypes.object,
};
