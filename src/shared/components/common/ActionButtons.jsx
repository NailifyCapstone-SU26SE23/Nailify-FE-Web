import { Eye, Pencil, Trash2, Check, X } from "lucide-react";
import { Tooltip } from "antd";
import { useLanguage } from "../../hooks/useLanguage";

export const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  viewTooltip,
  editTooltip,
  deleteTooltip,
  approveTooltip,
  rejectTooltip,
  showView = true,
  showEdit = true,
  showDelete = true,
  showApprove = true,
  showReject = true,
}) => {
  const { language } = useLanguage();

  const defaultViewTooltip = language === "vi" ? "Xem chi tiết" : "View detail";
  const defaultEditTooltip = language === "vi" ? "Chỉnh sửa" : "Edit";
  const defaultDeleteTooltip = language === "vi" ? "Xóa" : "Delete";
  const defaultApproveTooltip = language === "vi" ? "Phê duyệt" : "Approve";
  const defaultRejectTooltip = language === "vi" ? "Từ chối" : "Reject";

  return (
    <div className="flex items-center justify-center gap-1.5">
      {showView && onView && (
        <Tooltip title={viewTooltip || defaultViewTooltip}>
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
          >
            <Eye size={12} />
          </button>
        </Tooltip>
      )}
      {showApprove && onApprove && (
        <Tooltip title={approveTooltip || defaultApproveTooltip}>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-all duration-300 hover:bg-emerald-100 hover:border-emerald-300"
          >
            <Check size={12} strokeWidth={2.5} />
          </button>
        </Tooltip>
      )}
      {showReject && onReject && (
        <Tooltip title={rejectTooltip || defaultRejectTooltip}>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition-all duration-300 hover:bg-rose-100 hover:border-rose-300"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </Tooltip>
      )}
      {showEdit && onEdit && (
        <Tooltip title={editTooltip || defaultEditTooltip}>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f0b7cf] bg-white text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
          >
            <Pencil size={12} />
          </button>
        </Tooltip>
      )}
      {showDelete && onDelete && (
        <Tooltip title={deleteTooltip || defaultDeleteTooltip}>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-[#fff0f0] text-[#ea4f93] transition-all duration-300 hover:bg-[#fff5fb]"
          >
            <Trash2 size={12} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
