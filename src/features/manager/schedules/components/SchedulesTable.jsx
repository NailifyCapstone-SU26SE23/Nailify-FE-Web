import React from 'react';
import { Table, Button, Empty } from 'antd';
import { Plus, ShieldAlert, Users } from 'lucide-react';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { ScheduleShiftCard } from './ScheduleShiftCard';
import dayjs from 'dayjs';

export function SchedulesTable({
  staffList,
  scheduleMatrix,
  weekDays,
  selectedDayKey,
  showShiftTimes,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onEmergencyOff
}) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const displayedWeekDays = selectedDayKey === "ALL" 
    ? weekDays 
    : weekDays.filter((d) => d.format("ddd").toUpperCase() === selectedDayKey);

  const columns = [
    {
      title: (
        <div className="flex items-center gap-2 px-2">
          <Users size={16} className="text-[#E84F93]" />
          <span>{isVi ? 'Thợ nail' : 'Staff Artist'} ({staffList.length})</span>
        </div>
      ),
      dataIndex: 'staff',
      key: 'staff',
      fixed: 'left',
      width: 250,
      render: (_, staff) => (
        <div className="flex items-center gap-3 group/staff px-2">
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${staff.gradient} text-xs font-bold text-white shadow-sm ring-2 ${staff.ring}`}>
            {staff.initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#10B981]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#2B182B] truncate m-0">{staff.name}</p>
            <p className="text-[11px] text-[#9E8497] truncate m-0">{staff.phone || staff.specialty}</p>
          </div>
          <Button
            type="text"
            danger
            icon={<ShieldAlert size={14} />}
            className="opacity-0 group-hover/staff:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onEmergencyOff(staff);
            }}
            title="Emergency Off"
          />
        </div>
      ),
    },
    ...displayedWeekDays.map((day) => {
      const dateKey = day.format("YYYY-MM-DD");
      const isToday = day.isSame(dayjs(), "day");
      
      return {
        title: (
          <div className="text-center">
            <div className={`text-[11px] uppercase font-bold tracking-widest ${isToday ? "text-[#E84F93]" : "text-[#9E8497]"}`}>
              {day.format("ddd")}
            </div>
            <div className={`text-[14px] font-bold ${isToday ? "text-[#E84F93]" : "text-[#2B182B]"}`}>
              {day.format("MMM D")}
            </div>
            {isToday && (
              <span className="inline-block mt-1 rounded-full bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                {isVi ? 'Hôm nay' : 'Today'}
              </span>
            )}
          </div>
        ),
        dataIndex: dateKey,
        key: dateKey,
        width: 180,
        render: (_, staff) => {
          const cellKey = `${staff.id}_${dateKey}`;
          const shifts = scheduleMatrix.get(cellKey) || [];

          return (
            <div className="min-h-[70px] flex flex-col justify-center">
              {shifts.length === 0 ? (
                <Button
                  type="dashed"
                  block
                  icon={<Plus size={14} />}
                  onClick={() => onAddSchedule(staff.id, day)}
                  className="h-14 hover:border-[#E84F93] hover:text-[#E84F93] text-gray-400"
                >
                  {isVi ? 'Thêm ca' : 'Assign'}
                </Button>
              ) : (
                shifts.map((s) => (
                  <ScheduleShiftCard
                    key={s.scheduleId || s.id}
                    shift={s}
                    showShiftTimes={showShiftTimes}
                    onEdit={onEditSchedule}
                    onDelete={onDeleteSchedule}
                  />
                ))
              )}
            </div>
          );
        },
      };
    })
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F3E2EC] overflow-hidden">
      <Table
        columns={columns}
        dataSource={staffList}
        rowKey="id"
        pagination={false}
        bordered
        size="middle"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description={isVi ? "Không có nhân viên nào" : "No staff artists found"} /> }}
      />
    </div>
  );
}
