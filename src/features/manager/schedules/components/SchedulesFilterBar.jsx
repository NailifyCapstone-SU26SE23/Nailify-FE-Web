import React from 'react';
import { Space, Button, DatePicker, Input, Tooltip } from 'antd';
import { ChevronLeft, ChevronRight, Search, Eye, EyeOff, Calendar, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import dayjs from 'dayjs';

export function SchedulesFilterBar({
  selectedWeekStart,
  setSelectedWeekStart,
  showShiftTimes,
  setShowShiftTimes,
  searchQuery,
  setSearchQuery,
  onEmergencyOff
}) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#F3E2EC]">
      <Space>
        <Button
          icon={<ChevronLeft size={16} />}
          onClick={() => setSelectedWeekStart((prev) => prev.subtract(1, "week"))}
          shape="circle"
        />
        <Button
          icon={<Calendar size={14} />}
          onClick={() => setSelectedWeekStart(dayjs().startOf("week").add(1, "day"))}
        >
          {isVi ? "Tuần này" : "Current Week"}
        </Button>
        <Button
          icon={<ChevronRight size={16} />}
          onClick={() => setSelectedWeekStart((prev) => prev.add(1, "week"))}
          shape="circle"
        />
        <DatePicker
          value={selectedWeekStart}
          onChange={(d) => {
            if (d) {
              const monday = d.day() === 0 ? d.subtract(6, "day") : d.startOf("week").add(1, "day");
              setSelectedWeekStart(monday);
            }
          }}
          format="[Week of] MMM D, YYYY"
          allowClear={false}
          style={{ width: 200, borderRadius: 8 }}
        />
      </Space>

      <Space wrap>
        <Tooltip title={t("manager.schedules.emergencyOff") || "Emergency Off"}>
          <Button
            danger
            icon={<ShieldAlert size={14} />}
            onClick={onEmergencyOff}
            style={{ borderRadius: 8 }}
          >
            {isVi ? "Nghỉ khẩn cấp" : "Emergency Off"}
          </Button>
        </Tooltip>

        <Button
          icon={showShiftTimes ? <Eye size={14} /> : <EyeOff size={14} />}
          onClick={() => setShowShiftTimes(!showShiftTimes)}
          type={showShiftTimes ? "primary" : "default"}
          ghost={showShiftTimes}
          style={{ borderRadius: 8, borderColor: showShiftTimes ? '#E84F93' : undefined, color: showShiftTimes ? '#E84F93' : undefined }}
        >
          {showShiftTimes
            ? (isVi ? 'Giờ làm việc: Hiện' : 'Shift Times: Show')
            : (isVi ? 'Giờ làm việc: Ẩn' : 'Shift Times: Hide')}
        </Button>

        <Input
          placeholder={isVi ? 'Tìm kiếm thợ nail...' : 'Search staff...'}
          prefix={<Search size={14} style={{ color: '#bfbfbf' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 220, borderRadius: 8 }}
          allowClear
        />
      </Space>
    </div>
  );
}
