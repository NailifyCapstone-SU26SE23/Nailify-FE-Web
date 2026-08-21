import React from "react";
import { Modal } from "antd";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export function RefundConfirmModal({ open, onCancel, onConfirm, transaction }) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle size={18} />
          <span className="font-bold text-sm">{isVi ? "Xác nhận hoàn tiền" : "Confirm Refund Payment"}</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <button
          key="cancel"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg mr-2 transition"
        >
          {isVi ? "Hủy" : "Cancel"}
        </button>,
        <button
          key="confirm"
          onClick={onConfirm}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-lg transition"
        >
          {isVi ? "Xác nhận hoàn tiền" : "Confirm Refund"}
        </button>
      ]}
      width={380}
      centered
      destroyOnClose
    >
      <div className="py-2 space-y-2.5 text-xs text-slate-600 leading-relaxed">
        <p>
          {isVi ? "Bạn có chắc chắn muốn hoàn tiền giao dịch này?" : "Are you sure you want to refund this payment of"}{" "}
          <span className="font-mono font-bold text-rose-600">
            {transaction && formatCurrency(transaction.amount)}
          </span>?
        </p>
        <p className="bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-100 text-[11px]">
          <strong>{isVi ? "Cảnh báo" : "Warning"}:</strong> {isVi ? "Hệ thống sẽ yêu cầu hoàn tiền từ cổng thanh toán PayOS. Khách hàng sẽ nhận được tiền hoàn lại theo quy định của ngân hàng." : "This will request a refund from the PayOS payment gateway. The customer will receive their funds back according to banking timelines."}
        </p>
      </div>
    </Modal>
  );
}

RefundConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  transaction: PropTypes.object,
};
