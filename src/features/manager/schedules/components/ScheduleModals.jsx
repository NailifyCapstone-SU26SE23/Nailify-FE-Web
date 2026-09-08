import React, { useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Button, Typography, Row, Col, Divider } from 'antd';
import { Plus, Edit3, Check, Zap } from 'lucide-react';
import { TIME_OPTIONS } from '../constants/scheduleConstants';
import { useLanguage } from '../../../../shared/hooks/useLanguage';

const { Text } = Typography;

export function ScheduleModals({
  staffList,
  isAddModalOpen,
  setIsAddModalOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  selectedScheduleForEdit,
  formArtistId,
  setFormArtistId,
  formWorkDate,
  setFormWorkDate,
  formStartTimeStr,
  setFormStartTimeStr,
  formEndTimeStr,
  setFormEndTimeStr,
  formStatus,
  setFormStatus,
  activePreset,
  setActivePreset,
  isSubmitting,
  onCreateSubmit,
  onEditSubmit,
}) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [form] = Form.useForm();
  
  // Update form fields when state changes
  useEffect(() => {
    form.setFieldsValue({
      artistId: formArtistId,
      workDate: formWorkDate,
      startTime: formStartTimeStr,
      endTime: formEndTimeStr,
      status: formStatus
    });
  }, [formArtistId, formWorkDate, formStartTimeStr, formEndTimeStr, formStatus, isAddModalOpen, isEditModalOpen, form]);

  const handleApplyPreset = (type, startStr, endStr) => {
    setActivePreset(type);
    setFormStartTimeStr(startStr);
    setFormEndTimeStr(endStr);
    form.setFieldsValue({ startTime: startStr, endTime: endStr });
  };

  const handleValuesChange = (changedValues) => {
    if (changedValues.artistId) setFormArtistId(changedValues.artistId);
    if (changedValues.workDate) setFormWorkDate(changedValues.workDate);
    if (changedValues.startTime) setFormStartTimeStr(changedValues.startTime);
    if (changedValues.endTime) setFormEndTimeStr(changedValues.endTime);
    if (changedValues.status) setFormStatus(changedValues.status);
  };

  const presetButtons = [
    { type: 'MORNING', start: '08:00', end: '16:00', icon: '☀️', label: isVi ? 'Sáng' : 'Morning', sub: '08:00 - 16:00', color: '#3B82F6', bg: '#EFF6FF', border: '#93C5FD' },
    { type: 'EVENING', start: '12:00', end: '20:00', icon: '🌙', label: isVi ? 'Tối' : 'Evening', sub: '12:00 - 20:00', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    { type: 'FULLDAY', start: '08:00', end: '23:30', icon: '⭐', label: isVi ? 'Cả ngày' : 'Full Day', sub: '08:00 - 23:30', color: '#10B981', bg: '#ECFDF5', border: '#86EFAC' },
    { type: 'SHORT', start: '08:00', end: '09:00', icon: <Zap size={12}/>, label: isVi ? 'Ngắn' : 'Short', sub: '08:00 - 09:00', color: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD' },
  ];

  const renderPresets = () => (
    <div className="mb-6">
      <Text type="secondary" className="block mb-2 text-[11px] uppercase tracking-wider font-bold">
        {isVi ? "Mẫu ca làm" : "Shift Presets"}
      </Text>
      <Row gutter={[8, 8]}>
        {presetButtons.map(p => {
          const isActive = activePreset === p.type;
          return (
            <Col span={6} key={p.type}>
              <div 
                onClick={() => handleApplyPreset(p.type, p.start, p.end)}
                className="cursor-pointer rounded-xl p-2 border transition-all h-full"
                style={{
                  backgroundColor: isActive ? p.bg : '#fff',
                  borderColor: isActive ? p.color : '#E2E8F0',
                  boxShadow: isActive ? `0 0 0 2px ${p.color}30` : 'none'
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: isActive ? p.color : '#64748B' }}>
                    {p.icon} {p.label}
                  </span>
                  {isActive && <Check size={12} color={p.color} />}
                </div>
                <div className="text-[9px] text-gray-500 font-bold">{p.sub}</div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );

  const staffOptions = staffList.map((s) => ({
    label: (
      <div className="flex items-center gap-2 py-1">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${s.gradient} text-[10px] font-bold text-white shrink-0`}>
          {s.initials}
        </div>
        <span className="font-bold text-[#2B182B] text-xs">{s.name}</span>
        {s.phone && <span className="text-[10px] text-[#9E8497]">({s.phone})</span>}
      </div>
    ),
    value: s.id,
  }));

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      onFinish={isAddModalOpen ? onCreateSubmit : onEditSubmit}
      requiredMark={false}
    >
      {renderPresets()}
      
      <Form.Item 
        label={<span className="text-[11px] uppercase tracking-wider font-bold text-[#9E8497]">{isVi ? 'Nhân viên' : 'Staff Artist'}</span>}
        name="artistId" 
        rules={[{ required: true, message: isVi ? 'Vui lòng chọn nhân viên' : 'Please select staff' }]}
      >
        <Select options={staffOptions} size="large" />
      </Form.Item>

      <Form.Item 
        label={<span className="text-[11px] uppercase tracking-wider font-bold text-[#9E8497]">{isVi ? 'Ngày làm việc' : 'Work Date'}</span>}
        name="workDate" 
        rules={[{ required: true, message: isVi ? 'Vui lòng chọn ngày' : 'Please select date' }]}
      >
        <DatePicker format="DD/MM/YYYY" size="large" className="w-full" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            label={<span className="text-[11px] uppercase tracking-wider font-bold text-[#9E8497]">{isVi ? 'Giờ bắt đầu' : 'Start Time'}</span>}
            name="startTime"
            rules={[{ required: true }]}
          >
            <Select options={TIME_OPTIONS} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            label={<span className="text-[11px] uppercase tracking-wider font-bold text-[#9E8497]">{isVi ? 'Giờ kết thúc' : 'End Time'}</span>}
            name="endTime"
            rules={[{ required: true }]}
          >
            <Select options={TIME_OPTIONS} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item 
        label={<span className="text-[11px] uppercase tracking-wider font-bold text-[#9E8497]">{isVi ? 'Trạng thái' : 'Status'}</span>}
        name="status"
      >
        <Select size="large" options={[{ label: 'Active', value: 'Active' }, { label: 'Available', value: 'Available' }]} />
      </Form.Item>

      <Divider />
      
      <div className="flex justify-end gap-3">
        <Button onClick={() => isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false)} shape="round" size="large">
          {isVi ? 'Hủy' : 'Cancel'}
        </Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting} shape="round" size="large" style={{ background: "linear-gradient(to right, #E84F93, #F43F5E)", border: "none" }}>
          {isAddModalOpen ? (isVi ? 'Tạo lịch làm việc' : 'Create Schedule') : (isVi ? 'Cập nhật' : 'Update Schedule')}
        </Button>
      </div>
    </Form>
  );

  return (
    <>
      <Modal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E84F93] to-[#F43F5E] text-white">
              <Plus size={20} />
            </div>
            <div>
              <div className="text-lg font-bold">{isVi ? "Thêm ca làm việc" : "Add Staff Shift"}</div>
              <div className="text-[11px] text-gray-400 font-normal">{isVi ? "Lịch làm việc" : "Assign shift schedule"}</div>
            </div>
          </div>
        }
      >
        <div className="mt-6">{formContent}</div>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E84F93] to-[#F43F5E] text-white">
              <Edit3 size={20} />
            </div>
            <div>
              <div className="text-lg font-bold">{isVi ? "Sửa ca làm việc" : "Edit Staff Shift"}</div>
              <div className="text-[11px] text-gray-400 font-normal">{isVi ? "Chỉnh sửa lịch" : "Modify shift details"}</div>
            </div>
          </div>
        }
      >
        <div className="mt-6">{formContent}</div>
      </Modal>
    </>
  );
}
