import { Modal } from "antd";
import { Check, AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";

const SUCCESS_AUTO_CLOSE_MS = 2000;

export function SalonSaveResultModal({
  result,
  successTitle,
  failureTitle,
  successDescription,
  failureDescription,
  onFailureClose,
  onSuccessComplete,
  redirectMessage = "Redirecting to salon list...",
}) {
  useEffect(() => {
    if (!result?.success) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onSuccessComplete();
    }, SUCCESS_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [result, onSuccessComplete]);

  if (!result) return null;

  const isSuccess = result.success;

  return (
    <Modal
      open={Boolean(result)}
      centered
      onCancel={onFailureClose}
      footer={null}
      closable={false}
      width={460}
      styles={{
        body: { padding: 0 },
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 28,
        },
        mask: {
          backgroundColor: "rgba(47, 13, 33, 0.26)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <style>{`
        .nailify-display { font-family: "Cormorant Garamond", "Times New Roman", serif; }
      `}</style>

      <div>
        {/* Header Strip */}
        <div
          className={`px-6 py-5 text-white ${isSuccess
              ? "bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)]"
              : "bg-[linear-gradient(135deg,#f43f5e_0%,#e11d48_100%)]"
            }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white">
                {isSuccess ? <Check size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] bg-white/20 text-white">
                  {isSuccess ? "Success" : "Error"}
                </span>
                <h3 className="nailify-display mt-3 text-2xl font-semibold">
                  {isSuccess ? successTitle : failureTitle}
                </h3>
              </div>
            </div>
            {!isSuccess && (
              <button
                type="button"
                onClick={onFailureClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-6 text-center">
          <div
            className={`rounded-[22px] border p-5 ${isSuccess
                ? "border-emerald-100 bg-[#f4fffb] text-emerald-900"
                : "border-rose-100 bg-[#fff7fa] text-rose-900"
              }`}
          >
            <p className="text-sm font-bold">
              {isSuccess ? successDescription : failureDescription}
            </p>
            <p className="mt-1 text-xs opacity-80">{result.message}</p>
            {isSuccess && (
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 animate-pulse">
                {redirectMessage}
              </p>
            )}
          </div>

          {!isSuccess && (
            <button
              type="button"
              onClick={onFailureClose}
              className="w-full rounded-full bg-[#d14c84] py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_12px_24px_rgba(209,76,132,0.25)] transition hover:bg-[#c23e75] active:scale-[0.98]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

SalonSaveResultModal.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
  }),
  successTitle: PropTypes.string.isRequired,
  failureTitle: PropTypes.string.isRequired,
  successDescription: PropTypes.string.isRequired,
  failureDescription: PropTypes.string.isRequired,
  onFailureClose: PropTypes.func.isRequired,
  onSuccessComplete: PropTypes.func.isRequired,
  redirectMessage: PropTypes.string,
};
