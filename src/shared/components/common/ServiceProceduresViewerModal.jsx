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
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="min-w-[100px] font-semibold">
          Close
        </Button>,
      ]}
      centered
      width={850}
      title={
        <div className="flex items-center gap-2 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Check size={18} />
          </div>
          <span className="text-lg font-bold text-gray-900">Service Procedures</span>
        </div>
      }
      classNames={{
        header: "border-b border-gray-100 mb-4",
      }}
    >
      {service ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Service Details</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{service.name || "--"}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-500">Quantity</span>
                <span className="mt-0.5 font-bold text-gray-900">{service.quantity || 1}</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-500">Duration</span>
                <span className="mt-0.5 font-bold text-gray-900">{service.durationLabel || "--"}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                Loading procedures...
              </span>
            </div>
          ) : error ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm text-red-600">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </span>
            </div>
          ) : procedures && procedures.length > 0 ? (
            <div className="max-h-[450px] overflow-y-auto overflow-x-hidden pl-4 pr-1">
              <div className="relative ml-4 border-l-2 border-[#f4dbe7] space-y-6 py-4">
                {procedures.map((procedure) => (
                <div
                  key={procedure.bookingProcedureId || procedure.id || `${procedure.procedureId}-${procedure.stepOrder}`}
                  className="relative pl-8"
                >
                  {/* Timeline dot */}
                  <div
                    className="
                              absolute
                              -left-[11px]
                              top-5
                              z-20
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                              rounded-full
                              border-[4px]
                              border-white
                              bg-[#ea4f93]
                              shadow-[0_0_0_4px_rgba(255,255,255,0.9)]
                            "/>
                  {/* Content Card */}
                  <div className="rounded-2xl border border-[#f6dbe8] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#fdf3f8] pb-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-[#fff0f6] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ea4f93]">
                            Step {procedure.stepOrder ?? "--"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getProcedureStatusTone(procedure.status)}`}
                          >
                            {procedure.status || "--"}
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-black text-[#3f2b3f]">
                          {procedure.procedureName || procedure.label || "--"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#3f2b3f]">
                          <Clock size={14} className="text-[#ea4f93]" />
                          <span>
                            {String(procedure.estimatedStartTime || "--").slice(0, 5)} -{" "}
                            {String(procedure.estimatedEndTime || "--").slice(0, 5)}
                          </span>
                        </div>
                        <span className="mt-1 inline-flex items-center rounded-full bg-[#f4efff] px-3 py-1 text-[11px] font-bold text-[#8c63ef]">
                          {procedure.duration ?? 0} min
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">
                          <User size={12} />
                          Assigned To
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-bold text-[#3f2b3f]">
                            {procedure.assignedArtistId ? procedure.assignedArtistName || "Assigned" : "Unassigned"}
                          </p>
                          <div className="mt-2">
                            {/* Actions */}
                            {onClaimProcedure && procedure.canClaim ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClaimProcedure(procedure);
                                }}
                                disabled={claimingProcedureId === procedure.bookingProcedureId}
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60 shadow-sm"
                              >
                                {claimingProcedureId === procedure.bookingProcedureId ? (
                                  <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : null}
                                Claim
                              </button>
                            ) : onCompleteProcedure && procedure.canComplete ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompleteProcedure(procedure);
                                }}
                                disabled={procedureStatusUpdates && procedureStatusUpdates[procedure.bookingProcedureId]}
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#16975f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#127d4f] disabled:opacity-60 shadow-sm"
                              >
                                Complete
                              </button>
                            ) : procedure.isBlocked ? (
                              <span className="inline-flex shrink-0 items-center rounded-full bg-[#fff4e3] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e09a27]">
                                Blocked
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Completed By</p>
                        <p className="mt-2 text-sm font-bold text-[#3f2b3f]">
                          {procedure.completedByName || <span className="text-[#bca0ae] font-medium">Not yet</span>}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Active / Passive</p>
                        <p className="mt-2 text-sm font-bold text-[#3f2b3f]">
                          {procedure.activeDuration ?? 0}m / {procedure.passiveDuration ?? 0}m
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca0ae]">Overlap</p>
                        <div className="mt-2">
                          {procedure.canOverlap ? (
                            <span className="inline-flex rounded-full bg-[#e7f8ee] px-3 py-1 text-[10px] font-bold text-[#309e63] border border-[#cfead9]">
                              Allowed
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#f2f2f2] px-3 py-1 text-[10px] font-bold text-[#656565] border border-[#e5e5e5]">
                              Not Allowed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              <Check size={32} className="mb-2 text-gray-300" />
              <p>No procedure steps found for this booking item.</p>
            </div>
          )}
        </div>
      ) : null}
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
