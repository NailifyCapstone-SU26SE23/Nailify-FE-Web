import React from 'react';
import { Card, Row, Col, Statistic, Space, Typography, Button } from 'antd';
import { Calendar, Plus, Users, UserCheck, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useLanguage } from '../../../../shared/hooks/useLanguage';
import { TopMetricsRow } from "../../../../shared/components/ui/TopMetricsRow";

const { Title, Text } = Typography;

export function SchedulesHeader({
  staffCount,
  activeTodayCount,
  totalWeeklyHours,
  selectedWeekStart,
  onAddSchedule
}) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const metrics = [
    {
      label: isVi ? "Tổng số nhân viên" : "Total Staff",
      value: staffCount,
      note: "Total Staff",
      icon: Users,
      color: "#E84F93"
    },
    {
      label: isVi ? "Nhân viên làm hôm nay" : "Shifts Today",
      value: activeTodayCount,
      note: "Shifts Today",
      icon: UserCheck,
      color: "#10B981"
    },
    {
      label: isVi ? "Tổng giờ làm việc" : "Total Hours",
      value: `${totalWeeklyHours}h`,
      note: "Total Hours",
      icon: Clock,
      color: "#6366F1"
    },
    {
      label: isVi ? "Tuần làm việc" : "Week Span",
      value: `${selectedWeekStart.format("MMM D")} - ${selectedWeekStart.add(6, "day").format("MMM D")}`,
      note: "Week Span",
      icon: CalendarIcon,
      color: "#F59E0B"
    }
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="start" size="middle">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E84F93] to-[#F43F5E] text-white shadow-md">
              <Calendar size={24} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: "#2B182B" }}>
                {isVi ? "Lịch làm việc" : "Staff Schedules"}
              </Title>
              <Text type="secondary">
                {t("manager.schedules.desc") || "Manage weekly shifts, workload capacity, and staff rosters"}
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={onAddSchedule}
            size="large"
            style={{ background: "linear-gradient(to right, #E84F93, #F43F5E)", border: "none", borderRadius: 24, fontWeight: "bold" }}
          >
            {isVi ? "Thêm lịch làm việc" : "Add Shift Schedule"}
          </Button>
        </Col>
      </Row>

      <TopMetricsRow metrics={metrics} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
    </div>
  );
}
