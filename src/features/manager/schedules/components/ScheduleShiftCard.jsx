import { Tooltip, Button } from 'antd';
import { Edit3, Trash2 } from 'lucide-react';
import { getShiftTheme, formatTimeSpan } from '../utils/scheduleUtils';

export function ScheduleShiftCard({ shift, showShiftTimes, onEdit, onDelete, language = "en" }) {
  const isVi = language === "vi";
  const theme = getShiftTheme(shift.shiftStart, shift.shiftEnd, language);
  const IconComponent = theme.icon;

  return (
    <div className={`group relative rounded-lg border ${theme.border} ${theme.bg} p-2 mb-2 text-xs ${theme.text} shadow-sm transition hover:shadow-md`}>
      {showShiftTimes && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
          <span className="text-[11px] font-bold">
            {formatTimeSpan(shift.shiftStart, language)} – {formatTimeSpan(shift.shiftEnd, language)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/5">
        <span className={`inline-flex items-center gap-1 rounded-md ${theme.badgeBg} px-2 py-0.5 text-[10px] font-bold`}>
          <IconComponent size={10} />
          {theme.label}
        </span>

        <div className="flex items-center gap-1">
          <Tooltip title={isVi ? "Chỉnh sửa" : "Edit"}>
            <Button
              type="text"
              size="small"
              icon={<Edit3 size={12} />}
              onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
              style={{ color: '#2B182B', minWidth: 24, padding: 0 }}
            />
          </Tooltip>
          <Tooltip title={isVi ? "Xóa" : "Delete"}>
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={12} />}
              onClick={(e) => { e.stopPropagation(); onDelete(shift); }}
              style={{ minWidth: 24, padding: 0 }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
