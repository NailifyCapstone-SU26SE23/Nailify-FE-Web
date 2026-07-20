import React from "react";
import { Modal, Button } from "antd";
import { Check, Clock, User, AlertCircle } from "lucide-react";
import { PropTypes } from "../../utils/propTypes";

function getProcedureStatusTone(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["completed", "done"].includes(normalizedStatus)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (["inprogress", "in progress", "active"].includes(normalizedStatus)) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (["pending", "waiting", "upcoming"].includes(normalizedStatus)) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-gray-50 text-gray-600 border-gray-100";
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
            <div className="space-y-4">
              {procedures.map((procedure) => (
                <div
                  key={procedure.bookingProcedureId || procedure.id || `${procedure.procedureId}-${procedure.stepOrder}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                            Step {procedure.stepOrder ?? "--"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold uppercase tracking-wider ${getProcedureStatusTone(procedure.status)}`}
                          >
                            {procedure.status || "--"}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-bold text-gray-900">
                          {procedure.procedureName || procedure.label || "--"}
                        </p>

                      </div>

                      <div className="flex flex-col items-end text-right">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          <Clock size={14} className="text-gray-400" />
                          <span>
                            {String(procedure.estimatedStartTime || "--").slice(0, 5)} -{" "}
                            {String(procedure.estimatedEndTime || "--").slice(0, 5)}
                          </span>
                        </div>
                        <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          {procedure.duration ?? 0} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
                    <div className="bg-white p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <User size={14} />
                        Assigned To
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900">
                          {procedure.assignedArtistId ? procedure.assignedArtistName || "Assigned" : "Unassigned"}
                        </p>

                        {/* Actions */}
                        {onClaimProcedure && procedure.canClaim ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaimProcedure(procedure);
                            }}
                            disabled={claimingProcedureId === procedure.bookingProcedureId}
                            className="inline-flex shrink-0 items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
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
                            className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Complete
                          </button>
                        ) : procedure.isBlocked ? (
                          <span className="inline-flex shrink-0 items-center rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                            Blocked
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Completed By</p>
                      <p className="mt-2 text-sm font-bold text-gray-900">
                        {procedure.completedByName || <span className="text-gray-400 font-medium">Not yet</span>}
                      </p>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active / Passive</p>
                      <p className="mt-2 text-sm font-bold text-gray-900">
                        {procedure.activeDuration ?? 0}m / {procedure.passiveDuration ?? 0}m
                      </p>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overlap</p>
                      <div className="mt-2">
                        {procedure.canOverlap ? (
                          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                            Allowed
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 border border-gray-200">
                            Not Allowed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
