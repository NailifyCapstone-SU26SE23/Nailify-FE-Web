import {
  AlarmClockOff,
  BellRing,
  CalendarClock,
  CheckCheck,
  Clock3,
  Eraser,
  Filter,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const INITIAL_NOTIFICATIONS = [
  {
    id: "wl-001",
    messageType: "WaitlistPromoted",
    customerName: "Nguyen Minh Chau",
    waitlistId: "WL-20260701-001",
    bookingId: null,
    triggeredBy: "SlotFreedEvent",
    createdAt: "2026-07-01 09:05",
    deadlineAt: "2026-07-01 09:20",
    channel: "In-app + SMS",
    status: "Notified",
    message: "Da co slot trong! Ban co 15 phut de xac nhan chuyen thanh lich hen chinh thuc.",
    note: "Auto-promoted after a cancellation in the 09:30 slot.",
  },
  {
    id: "wl-002",
    messageType: "WaitlistExpired",
    customerName: "Tran Bao Han",
    waitlistId: "WL-20260701-002",
    bookingId: null,
    triggeredBy: "Hangfire Job",
    createdAt: "2026-07-01 09:40",
    deadlineAt: "2026-07-01 09:55",
    channel: "In-app",
    status: "Expired",
    message: "Thoi gian xac nhan lich hen tu hang cho (15 phut) da het han.",
    note: "Customer did not confirm within the reserved time window.",
  },
  {
    id: "bk-001",
    messageType: "BookingAutoCancelled",
    customerName: "Le Quoc Anh",
    waitlistId: null,
    bookingId: "BK-20260701-145",
    triggeredBy: "BookingJobExecutor.cs",
    createdAt: "2026-07-01 10:15",
    deadlineAt: null,
    channel: "In-app + Email",
    status: "AutoCancelled",
    message: "Lich hen cua ban da tu dong huy do tre qua 15 phut.",
    note: "No check-in recorded 15 minutes after appointment time.",
  },
  {
    id: "wl-003",
    messageType: "WaitlistPromoted",
    customerName: "Pham Gia Linh",
    waitlistId: "WL-20260701-003",
    bookingId: null,
    triggeredBy: "SlotFreedEvent",
    createdAt: "2026-07-01 10:32",
    deadlineAt: "2026-07-01 10:47",
    channel: "In-app + SMS",
    status: "Notified",
    message: "Da co slot trong! Ban co 15 phut de xac nhan chuyen thanh lich hen chinh thuc.",
    note: "Picked as next eligible guest from same-service waitlist.",
  },
];

const FILTERS = [
  { key: "All", label: "All" },
  { key: "WaitlistPromoted", label: "Promoted" },
  { key: "WaitlistExpired", label: "Expired" },
  { key: "BookingAutoCancelled", label: "Auto Cancelled" },
  { key: "Cleared", label: "Cleared" },
];

function Card({ className = "", children }) {
  return (
    <article className={`rounded-[22px] border border-[#f7d8e5] bg-white shadow-[0_14px_34px_rgba(236,72,153,0.08)] ${className}`}>
      {children}
    </article>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-sm font-extrabold text-[#402542]">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-[#b07a94]">{subtitle}</p> : null}
    </div>
  );
}

function getTypeMeta(type) {
  switch (type) {
    case "WaitlistPromoted":
      return {
        label: "WaitlistPromoted",
        icon: BellRing,
        badgeClassName: "bg-[#ffe7f1] text-[#d94f92]",
        panelClassName: "border-[#f6cade] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]",
        accentClassName: "from-[#ff8ebb] to-[#ea4f93]",
      };
    case "WaitlistExpired":
      return {
        label: "WaitlistExpired",
        icon: AlarmClockOff,
        badgeClassName: "bg-[#fff0dd] text-[#d6851d]",
        panelClassName: "border-[#f7dfb0] bg-[linear-gradient(180deg,#fffdf7_0%,#fff8eb_100%)]",
        accentClassName: "from-[#f5b455] to-[#db8520]",
      };
    case "BookingAutoCancelled":
      return {
        label: "BookingAutoCancelled",
        icon: CalendarClock,
        badgeClassName: "bg-[#ffe8e8] text-[#d54d5e]",
        panelClassName: "border-[#f5c9d0] bg-[linear-gradient(180deg,#fff9f9_0%,#fff0f3_100%)]",
        accentClassName: "from-[#ff8a9b] to-[#e45870]",
      };
    default:
      return {
        label: "Cleared",
        icon: CheckCheck,
        badgeClassName: "bg-[#eaf9ee] text-[#2fa25f]",
        panelClassName: "border-[#cfe9d7] bg-[linear-gradient(180deg,#fafffb_0%,#f2fbf5_100%)]",
        accentClassName: "from-[#5dd18d] to-[#2fa25f]",
      };
  }
}

function formatRelativeStatus(item, language) {
  if (item.messageType === "WaitlistPromoted" && item.deadlineAt) {
    return language === "vi" ? `Xác nhận trước ${item.deadlineAt}` : `Confirm before ${item.deadlineAt}`;
  }

  if (item.messageType === "WaitlistExpired") {
    return language === "vi" ? "Thời gian giữ chỗ đã hết hạn" : "Reservation window expired";
  }

  if (item.messageType === "BookingAutoCancelled") {
    return language === "vi" ? "Lịch hẹn đã bị tự động hủy" : "Appointment auto-cancelled";
  }

  return item.clearedAt ? (language === "vi" ? `Đã xóa lúc ${item.clearedAt}` : `Cleared at ${item.clearedAt}`) : (language === "vi" ? "Đã xóa" : "Cleared");
}

function StatCard({ title, value, note, icon: Icon, toneClassName }) {
  return (
    <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c08aa4]">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#402542]">{value}</p>
          <p className="mt-1 text-xs text-[#a07c90]">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_12px_24px_rgba(236,72,153,0.16)] ${toneClassName}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition ${
        active
          ? "border-[#ea4f93] bg-[#fff1f7] text-[#d94f92] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
          : "border-[#f3d5e2] bg-white text-[#8f7184] hover:bg-[#fff7fb]"
      }`}
    >
      {label}
    </button>
  );
}

function NotificationCard({ item, onClear, language }) {
  const meta = getTypeMeta(item.messageType);
  const Icon = meta.icon;

  return (
    <div className={`rounded-[24px] border p-5 ${meta.panelClassName}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${meta.accentClassName} text-white shadow-[0_12px_26px_rgba(236,72,153,0.18)]`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-[#402542]">{item.customerName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${meta.badgeClassName}`}>
                  {meta.label}
                </span>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b7b8f]">
                  {item.status}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-[#5b4457]">{item.message}</p>
          <p className="mt-2 text-xs text-[#a07c90]">{item.note}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoPill label="Trigger" value={item.triggeredBy} />
            <InfoPill label="Sent At" value={item.createdAt} />
            <InfoPill label="Payload" value={item.waitlistId || item.bookingId || "--"} />
            <InfoPill label="Channel" value={item.channel} />
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[280px]">
          <div className="rounded-[20px] border border-white/90 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c08aa4]">{language === "vi" ? "Trạng thái vận hành" : "Operational Status"}</p>
              <p className="mt-2 text-sm font-extrabold text-[#402542]">{formatRelativeStatus(item, language)}</p>
              {item.deadlineAt ? (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#d6851d]">
                  <Clock3 size={14} />
                  {language === "vi" ? "Giữ chỗ trong 15 phút" : "Reserved for 15 minutes"}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onClear(item.id)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f2bfd4] bg-white px-4 py-3 text-sm font-bold text-[#d94f92] transition hover:bg-[#fff5f8]"
              >
                <Trash2 size={15} />
                {language === "vi" ? "Xóa mục này" : "Clear Item"}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/80 bg-white/75 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c08aa4]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#402542]">{value}</p>
    </div>
  );
}

export function StaffWaittingPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("All");
  const { language } = useLanguage();

  const FILTERS = [
    { key: "All", label: language === "vi" ? "Tất cả" : "All" },
    { key: "WaitlistPromoted", label: language === "vi" ? "Đã nâng hạng" : "Promoted" },
    { key: "WaitlistExpired", label: language === "vi" ? "Hết hạn" : "Expired" },
    { key: "BookingAutoCancelled", label: language === "vi" ? "Tự động hủy" : "Auto Cancelled" },
    { key: "Cleared", label: language === "vi" ? "Đã xóa" : "Cleared" },
  ];

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "All") {
      return notifications;
    }

    if (activeFilter === "Cleared") {
      return notifications.filter((item) => item.messageType === "Cleared");
    }

    return notifications.filter((item) => item.messageType === activeFilter);
  }, [activeFilter, notifications]);

  const stats = useMemo(() => {
    const promoted = notifications.filter((item) => item.messageType === "WaitlistPromoted").length;
    const expired = notifications.filter((item) => item.messageType === "WaitlistExpired").length;
    const autoCancelled = notifications.filter((item) => item.messageType === "BookingAutoCancelled").length;
    const cleared = notifications.filter((item) => item.messageType === "Cleared").length;

    return [
      {
        title: language === "vi" ? "Thông báo nâng hạng" : "Promoted Alerts",
        value: promoted,
        note: language === "vi" ? "Khách hàng trong hàng chờ đã được thông báo" : "Waitlist guests notified",
        icon: BellRing,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        title: language === "vi" ? "Cửa sổ đã hết hạn" : "Expired Windows",
        value: expired,
        note: language === "vi" ? "Xác nhận 15 phút bị bỏ lỡ" : "15-minute confirmations missed",
        icon: AlarmClockOff,
        toneClassName: "bg-gradient-to-br from-[#f5b455] to-[#db8520]",
      },
      {
        title: language === "vi" ? "Tự động hủy" : "Auto Cancelled",
        value: autoCancelled,
        note: language === "vi" ? "Lịch hẹn trễ bị đóng bởi Job" : "Late bookings closed by job",
        icon: CalendarClock,
        toneClassName: "bg-gradient-to-br from-[#ff8a9b] to-[#e45870]",
      },
      {
        title: language === "vi" ? "Bản ghi đã xóa" : "Cleared Records",
        value: cleared,
        note: language === "vi" ? "Mục ẩn khỏi hàng đợi hiện tại" : "Items hidden from active queue",
        icon: CheckCheck,
        toneClassName: "bg-gradient-to-br from-[#5dd18d] to-[#2fa25f]",
      },
    ];
  }, [notifications, language]);

  const handleClearItem = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              messageType: "Cleared",
              status: "Cleared",
              clearedAt: new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              note: "Manually cleared from the staff waitlist board.",
            }
          : item,
      ),
    );
  };

  const handleClearAll = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        messageType: "Cleared",
        status: "Cleared",
        clearedAt: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        note: "Bulk-cleared from the mock notification board.",
      })),
    );
    setActiveFilter("Cleared");
  };

  const handleRestoreMockData = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveFilter("All");
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#fff0f8_0%,#fffafc_48%,#fff4fb_100%)]">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_12px_28px_rgba(236,72,153,0.24)]">
                <Send size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-[#402542]">{language === "vi" ? "Bảng thông báo hàng chờ" : "Staff Waitlist Notification Board"}</h1>
                <p className="text-sm text-[#b07a94]">
                  {language === "vi" ? "Giao diện mô phỏng cho việc nâng hạng, hết hạn, tự động hủy lịch và xoá bản ghi." : "Mock UI for waitlist promotion, expiration, booking auto-cancellation, and cleared records."}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#8f7184]">
              This screen models the events you described: `SlotFreedEvent` sends `WaitlistPromoted`,
              Hangfire expires unconfirmed waitlist holds after 15 minutes, and `BookingJobExecutor.cs`
              auto-cancels late bookings with no check-in.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestoreMockData}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#f2bfd4] bg-white px-4 py-3 text-sm font-bold text-[#d94f92] transition hover:bg-[#fff4f8]"
            >
              <RefreshCw size={16} />
              {language === "vi" ? "Khôi phục dữ liệu" : "Restore Mock Data"}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ff8ebb_0%,#ea4f93_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(236,72,153,0.22)]"
            >
              <Eraser size={16} />
              {language === "vi" ? "Xóa tất cả" : "Clear All Data"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-white/70 bg-white/45 p-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            title={language === "vi" ? "Hàng đợi thông báo" : "Notification Queue"}
            subtitle={language === "vi" ? `${filteredNotifications.length} mục trong tầm nhìn hiện tại.` : `${filteredNotifications.length} item(s) in the current view.`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4f8] px-3 py-2 text-xs font-bold text-[#d94f92]">
              <Filter size={14} />
              {language === "vi" ? "Lọc" : "Filter"}
            </span>
            {FILTERS.map((filter) => (
              <FilterButton
                key={filter.key}
                active={filter.key === activeFilter}
                label={filter.label}
                onClick={() => setActiveFilter(filter.key)}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              title={language === "vi" ? "Không có thông báo trong khu vực này" : "No notifications in this view"}
              description={language === "vi" ? "Dùng 'Khôi phục dữ liệu' để nạp lại, hoặc chuyển bộ lọc." : "Use Restore Mock Data to repopulate the board, or switch the active filter."}
            />
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((item) => (
                <NotificationCard key={item.id} item={item} onClear={handleClearItem} language={language} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeading
          title={language === "vi" ? "Bản đồ sự kiện" : "Event Mapping"}
          subtitle={language === "vi" ? "Tham chiếu nhanh giữa các sự kiện backend và loại tin nhắn UI." : "Quick reference between backend events and UI message types."}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <TimelineBlock
            icon={Sparkles}
            title={language === "vi" ? "A. Nâng hạng hàng chờ" : "A. WaitlistPromoted"}
            text={language === "vi" ? "Kích hoạt khi SlotFreedEvent tìm khách hàng tiếp theo trong hàng chờ và chuyển sang trạng thái Đã thông báo với cửa sổ xác nhận 15 phút." : "Triggered when SlotFreedEvent finds the next waitlist guest and moves them to Notified with a 15-minute confirmation window."}
          />
          <TimelineBlock
            icon={Clock3}
            title={language === "vi" ? "B. Hết hạn hàng chờ" : "B. WaitlistExpired"}
            text={language === "vi" ? "Kích hoạt bởi Hangfire khi khách được nâng hạng không xác nhận trong 15 phút, giữ chỗ sẽ bị đánh dấu Hết hạn." : "Triggered by Hangfire when a promoted guest does not confirm within 15 minutes, then the hold is marked Expired."}
          />
          <TimelineBlock
            icon={CalendarClock}
            title={language === "vi" ? "C. Lịch hẹn tự động hủy" : "C. BookingAutoCancelled"}
            text={language === "vi" ? "Kích hoạt bởi BookingJobExecutor.cs khi lịch hẹn trễ hơn 15 phút mà không có check-in." : "Triggered by BookingJobExecutor.cs when a booking is more than 15 minutes late and still has no check-in."}
          />
        </div>
      </Card>
    </div>
  );
}

function TimelineBlock({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[22px] border border-[#f5d8e5] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_12px_22px_rgba(236,72,153,0.18)]">
        <Icon size={18} />
      </div>
      <p className="mt-4 text-sm font-extrabold text-[#402542]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#8f7184]">{text}</p>
    </div>
  );
}
