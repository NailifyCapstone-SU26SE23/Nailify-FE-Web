import { Modal } from "antd";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { STAFF_FORM_MODAL_STYLES } from "../services/mockStaffArtists";

const SUCCESS_AUTO_CLOSE_MS = 2000;

export function StaffSaveResultModal({
  result,
  successTitle,
  failureTitle,
  successDescription,
  failureDescription,
  onFailureClose,
  onSuccessComplete,
  redirectMessage = "Redirecting to staff list...",
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

  return (
    <Modal
      title={result?.success ? successTitle : failureTitle}
      open={Boolean(result)}
      onOk={onFailureClose}
      onCancel={onFailureClose}
      footer={result?.success ? null : undefined}
      closable={!result?.success}
      maskClosable={!result?.success}
      okText="Try Again"
      cancelButtonProps={{ style: { display: "none" } }}
      okButtonProps={{
        className: "bg-pink-500 hover:bg-pink-600 text-white border-pink-500",
      }}
      styles={STAFF_FORM_MODAL_STYLES}
    >
      <div className="flex flex-col items-center py-4 text-center">
        {result?.success ? (
          <CheckCircle2 size={48} className="mb-4 text-emerald-500" />
        ) : (
          <XCircle size={48} className="mb-4 text-pink-500" />
        )}
        <p className="mb-2 text-slate-700">
          {result?.success ? successDescription : failureDescription}
        </p>
        <p className="text-sm text-slate-500">{result?.message}</p>
        {result?.success ? (
          <p className="mt-3 text-xs text-slate-400">{redirectMessage}</p>
        ) : null}
      </div>
    </Modal>
  );
}

StaffSaveResultModal.propTypes = {
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
