import React, { useState, useEffect } from "react";
import { Modal, Table, Button, DatePicker, Select } from "antd";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { chairsService } from "../services/chairsService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    case 'Approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-600';
    case 'Rejected':
    case 'Cancelled':
      return 'border-red-200 bg-red-50 text-red-600';
    case 'CheckedIn':
      return 'border-purple-200 bg-purple-50 text-purple-600';
    case 'InProgress':
      return 'border-blue-200 bg-blue-50 text-blue-600';
    case 'ServiceCompleted':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'Completed':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'Repaired':
      return 'border-orange-200 bg-orange-50 text-orange-600';
    case 'ReschedulePending':
    case 'RescheduleSuggested':
      return 'border-indigo-200 bg-indigo-50 text-indigo-600';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

export function AssignBookingModal({ isOpen, onClose, salonId, chair, onSuccess }) {

  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (isOpen && salonId) {
      fetchBookings(1, pageSize, dateRange, status);
    }
  }, [isOpen, salonId, dateRange, status]);

  const fetchBookings = async (page, size, currentDates, currentStatus) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: size,
      };

      if (currentDates && currentDates[0] && currentDates[1]) {
        params.startDate = currentDates[0].format("YYYY-MM-DD");
        params.endDate = currentDates[1].format("YYYY-MM-DD");
      }

      if (currentStatus) {
        params.status = currentStatus;
      }

      const result = await chairsService.getSalonBookings(salonId, params);
      setBookings(result.items || []);
      setTotalItems(result.metaData?.totalItems || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      toast.error(language === "vi" ? "Lỗi tải danh sách đặt lịch" : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    fetchBookings(pagination.current, pagination.pageSize, dateRange, status);
  };

  const handleAssign = async (bookingId) => {
    if (!chair?.chairId) return;

    setAssigningId(bookingId);
    try {
      await chairsService.assignBookingToChair(bookingId, chair.chairId);
      toast.success(language === "vi" ? "Đặt lịch thành công" : "Booking assigned successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(language === "vi" ? "Lỗi đặt lịch" : "Failed to assign booking");
    } finally {
      setAssigningId(null);
    }
  };

  const columns = [
    {
      title: language === "vi" ? "Khách hàng" : "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => <span className="font-semibold text-slate-700">{text || "Unknown"}</span>,
    },
    {
      title: language === "vi" ? "Ngày" : "Date",
      dataIndex: "bookingDate",
      key: "bookingDate",
      render: (date) => <span className="text-slate-600">{dayjs(date).format("MMM DD, YYYY")}</span>,
    },
    {
      title: language === "vi" ? "Thời gian" : "Time",
      key: "time",
      render: (_, record) => {
        if (!record.startTime) return <span className="font-bold text-pink-600">--</span>;
        const start = record.startTime.substring(0, 5);
        let end = "";
        if (record.totalDuration) {
          const [hours, minutes] = start.split(':').map(Number);
          const endTime = dayjs().hour(hours).minute(minutes).add(record.totalDuration, 'minute');
          end = endTime.format('HH:mm');
        }
        return (
          <span className="font-bold text-pink-600">
            {start}{end ? ` - ${end}` : ''}
          </span>
        );
      }
    },
    {
      title: language === "vi" ? "Thợ nail" : "Artist",
      dataIndex: "artistName",
      key: "artistName",
      render: (text) => <span className="text-slate-600">{text || (language === "vi" ? "Chưa chỉ định" : "Not assigned")}</span>,
    },
    {
      title: language === "vi" ? "Thời lượng" : "Duration",
      dataIndex: "totalDuration",
      key: "totalDuration",
      render: (mins) => <span className="text-slate-600">{mins} {language === "vi" ? "phút" : "minutes"}</span>,
    },
    {
      title: language === "vi" ? "Trạng thái" : "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(status)} tracking-wider`}>
          {status}
        </span>
      ),
    },
    {
      title: language === "vi" ? "Thao tác" : "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        const hasChair = record.chairId && 
          record.chairId !== "00000000-0000-0000-0000-000000000000";

        const now = dayjs();
        const bookingDate = dayjs(record.bookingDate);
        const isToday = now.isSame(bookingDate, 'day');
        
        let isCurrentTime = false;
        if (isToday && record.startTime) {
          const [hours, minutes] = record.startTime.split(':').map(Number);
          const start = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
          const duration = record.totalDuration || 30;
          const end = start.add(duration, 'minute');
          
          // Allow assignment from 30 minutes before booking starts up to its end
          const graceStart = start.subtract(30, 'minute');
          isCurrentTime = now.isAfter(graceStart) && now.isBefore(end);
        }

        if (!isCurrentTime) {
          return (
            <span className="text-xs text-slate-400 font-medium tracking-wide">
              {language === "vi" ? "Ngoài giờ hẹn" : "Out of schedule"}
            </span>
          );
        }

        return (
          <Button
            size="small"
            loading={assigningId === record.bookingId}
            disabled={assigningId !== null && assigningId !== record.bookingId}
            onClick={() => handleAssign(record.bookingId)}
            className="!bg-[#ea4f93] hover:!bg-[#d63d7e] border-none !font-semibold !text-[11px] !text-white !px-5 !rounded-md !shadow-sm !shadow-pink-200/50"
          >
            {hasChair 
              ? (language === "vi" ? "Đổi ghế" : "Reassign") 
              : (language === "vi" ? "Chỉ định" : "Assign")}
          </Button>
        );
      },
    }
  ];

  return (
    <Modal
      title={
        <div className="font-bold text-lg text-slate-800">
          {language === "vi" ? "Chỉ định đặt lịch vào ghế: " : "Assign Booking to "} <span className="text-pink-600">{chair?.chairName}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      destroyOnClose
      className="rounded-2xl"
    >
      <div className="mt-4 flex gap-4">
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          format="YYYY-MM-DD"
        />
        <Select
          allowClear
          placeholder={language === "vi" ? "Lọc theo trạng thái" : "Filter by status"}
          value={status}
          onChange={(val) => setStatus(val)}
          style={{ width: 180 }}
          options={[
            { label: language === "vi" ? "Đang chờ" : "Pending", value: 'Pending' },
            { label: language === "vi" ? "Đã duyệt" : "Approved", value: 'Approved' },
            { label: language === "vi" ? "Đã từ chối" : "Rejected", value: 'Rejected' },
            { label: language === "vi" ? "Đã hủy" : "Cancelled", value: 'Cancelled' },
            { label: language === "vi" ? "Đã check-in" : "CheckedIn", value: 'CheckedIn' },
            { label: language === "vi" ? "Đang thực hiện" : "InProgress", value: 'InProgress' },
            { label: language === "vi" ? "Đã hoàn thành dịch vụ" : "ServiceCompleted", value: 'ServiceCompleted' },
            { label: language === "vi" ? "Đã hoàn thành" : "Completed", value: 'Completed' },
            { label: language === "vi" ? "Đã sửa chữa" : "Repaired", value: 'Repaired' },
            { label: language === "vi" ? "Đang chờ sắp xếp lại" : "ReschedulePending", value: 'ReschedulePending' },
            { label: language === "vi" ? "Đang đề xuất sắp xếp lại" : "RescheduleSuggested", value: 'RescheduleSuggested' },
          ]}
        />
      </div>
      <div className="mt-4">
        <Table
          dataSource={bookings}
          columns={columns}
          rowKey="bookingId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: false,
            className: "mt-4 flex justify-end"
          }}
          onChange={handleTableChange}
          className="rounded-xl overflow-hidden"
          rowClassName="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
        />
      </div>
    </Modal>
  );
}
