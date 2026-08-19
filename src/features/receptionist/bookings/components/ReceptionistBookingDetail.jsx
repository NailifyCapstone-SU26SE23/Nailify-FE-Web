import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Phone,
  Printer,
  ReceiptText,
  Send,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import { Table } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const SERVICE_ROWS = [
  {
    id: "svc-1",
    time: "10:00 - 11:00 AM",
    service: "Chrome Nail Art",
    serviceType: "Nail Design",
    artist: "Luna Park",
    initials: "LP",
    duration: "60 min",
    status: "Completed",
    statusTone: "bg-[#e7f8ee] text-[#309e63]",
    avatarTone: "bg-[#ef5b94]",
    secondaryAction: "Edit",
    secondaryTone: "bg-[#f2f2f2] text-[#656565]",
  },
  {
    id: "svc-2",
    time: "11:00 - 12:00 PM",
    service: "Gel Removal",
    serviceType: "Nail Care",
    artist: "Mia Chen",
    initials: "MC",
    duration: "30 min",
    status: "In Progress",
    statusTone: "bg-[#efeafd] text-[#7c63d8]",
    avatarTone: "bg-[#8e57de]",
    secondaryAction: "Manage",
    secondaryTone: "bg-[#efeafd] text-[#7c63d8]",
  },
  {
    id: "svc-3",
    time: "12:00 - 13:00 PM",
    service: "Hand Spa",
    serviceType: "Spa Treatment",
    artist: "Rose Kim",
    initials: "RK",
    duration: "45 min",
    status: "Waiting",
    statusTone: "bg-[#fff4e3] text-[#e09a27]",
    avatarTone: "bg-[#35b78f]",
    secondaryAction: "Manage",
    secondaryTone: "bg-[#efeafd] text-[#7c63d8]",
  },
  {
    id: "svc-4",
    time: "13:00 - 14:00 PM",
    service: "French Tip Ombre",
    serviceType: "Nail Design",
    artist: "Luna Park",
    initials: "LP",
    duration: "50 min",
    status: "Waiting",
    statusTone: "bg-[#fff4e3] text-[#e09a27]",
    avatarTone: "bg-[#ef5b94]",
    secondaryAction: "Edit",
    secondaryTone: "bg-[#f2f2f2] text-[#656565]",
  },
];

// QUICK_STATUS is now defined dynamically inside the component function

const ACTION_CENTER = [
  {
    label: "Check In",
    subtitle: "Mark arrival",
    icon: CheckCircle2,
    cardTone: "bg-[linear-gradient(180deg,#fff1f6_0%,#ffe6f0_100%)]",
    iconTone: "bg-[#ffdcea] text-[#eb5b92]",
  },
  {
    label: "Start Service",
    subtitle: "Begin session",
    icon: Sparkles,
    cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#e9e1ff_100%)]",
    iconTone: "bg-[#dfd1ff] text-[#8160df]",
  },
  {
    label: "Reassign Artist",
    subtitle: "Change staff",
    icon: UserRound,
    cardTone: "bg-[linear-gradient(180deg,#fff8df_0%,#fff0bf_100%)]",
    iconTone: "bg-[#ffe6a1] text-[#d8a01c]",
  },
  {
    label: "Move Schedule",
    subtitle: "Reschedule time",
    icon: CalendarClock,
    cardTone: "bg-[linear-gradient(180deg,#ebf7ff_0%,#dff1ff_100%)]",
    iconTone: "bg-[#cfe8fb] text-[#4391c9]",
  },
  {
    label: "Add Service",
    subtitle: "Extra treatment",
    icon: Sparkles,
    cardTone: "bg-[linear-gradient(180deg,#e6f8ef_0%,#d8f2e5_100%)]",
    iconTone: "bg-[#cdeedb] text-[#2da466]",
  },
  {
    label: "Complete Booking",
    subtitle: "Finalize session",
    icon: CheckCircle2,
    cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#ebe3ff_100%)]",
    iconTone: "bg-[#ddd2ff] text-[#8260df]",
  },
  {
    label: "Cancel Booking",
    subtitle: "Void appointment",
    icon: XCircle,
    cardTone: "bg-[linear-gradient(180deg,#fff1f1_0%,#ffe9e9_100%)]",
    iconTone: "bg-[#ffd8d8] text-[#ef6b6b]",
  },
  {
    label: "Send Invoice",
    subtitle: "Email to client",
    icon: ReceiptText,
    cardTone: "bg-[linear-gradient(180deg,#fff9eb_0%,#fff2cd_100%)]",
    iconTone: "bg-[#ffe7ae] text-[#d19a15]",
  },
];

function SectionCard({ title, subtitle, badge, children, className = "" }) {
  return (
    <section
      className={`rounded-[24px] border border-[#f4d6e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#4a3741]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#a48796]">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full border border-[#f4d6e2] bg-[#fff1f6] px-3 py-1 text-[10px] font-extrabold text-[#eb5b92]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

SectionCard.propTypes = {
  badge: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export function ReceptionistBookingDetail({ booking }) {
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState(
    "Customer prefers soft pink tones. Allergic to acetone-based removers - use gentle formula only. Requested extra hand massage during spa.",
  );

  const paymentProgress = 60;

  const handleMockAction = (label) => {
    toast.success(`${label} is ready as a mock receptionist action.`);
  };

  const QUICK_STATUS = [
    [t("receptionist.common.status") || "Current Status", "In Progress"],
    [t("receptionist.bookings.artist") || "Assigned Artist", "Luna Park"],
    [t("receptionist.bookings.assignChairTitle") || "Chair Number", "Chair #03"],
    [t("receptionist.bookings.estFinish") || "Est. Finish", "1:05 PM"],
    [t("receptionist.bookings.time") || "Check-in Time", "8:55 AM"],
  ];

  const serviceColumns = [
    {
      title: t("receptionist.bookings.time") || "Time",
      dataIndex: "time",
      key: "time",
      render: (value) => <span className="text-xs font-bold text-[#eb5b92]">{value}</span>,
    },
    {
      title: t("receptionist.payments.services") || "Service",
      key: "service",
      render: (_, row) => (
        <div>
          <p className="text-xs font-bold text-[#4a3741]">{row.service}</p>
          <p className="mt-1 text-[10px] text-[#a48796]">{row.serviceType}</p>
        </div>
      ),
    },
    {
      title: t("receptionist.bookings.artist") || "Staff Artist",
      key: "artist",
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${row.avatarTone}`}>
            {row.initials}
          </div>
          <span className="text-xs font-medium text-[#4a3741]">{row.artist}</span>
        </div>
      ),
    },
    {
      title: language === "vi" ? "Thời gian" : "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (value) => <span className="text-xs text-[#4a3741]">{formatDurationLabel(value)}</span>,
    },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   render: (value, row) => (
    //     <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${row.statusTone}`}>
    //       {value}
    //     </span>
    //   ),
    // },
    {
      title: t("receptionist.bookings.actions") || "Action",
      key: "action",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMockAction(`View ${row.service}`)}
            className="rounded-xl bg-[#fff1f6] px-3 py-1.5 text-[10px] font-bold text-[#eb5b92]"
          >
            {t("receptionist.common.view") || "View"}
          </button>
          <button
            type="button"
            onClick={() => handleMockAction(`${row.secondaryAction} ${row.service}`)}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-bold ${row.secondaryTone}`}
          >
            {row.secondaryAction === "Edit" ? (t("receptionist.common.edit") || "Edit") : row.secondaryAction === "Manage" ? (t("receptionist.common.manage") || "Manage") : row.secondaryAction}
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_280px]">
        <div className="space-y-4">
          <SectionCard
            title={t("receptionist.payments.customerInfo") || "Customer Overview"}
            subtitle={`${t("receptionist.bookings.bookingId") || "Booking ID"} ${booking.id}`}
            badge={language === "vi" ? "Đơn Đặt Lịch Hoạt Động" : "Active Booking"}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="relative">
                  <img crossOrigin="anonymous"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
                    alt={booking.customerName}
                    className="h-20 w-20 rounded-[20px] border-2 border-[#f4d6e2] object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-xl font-bold text-[#4a3741]">{booking.customerName}</p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("profile.phone") || "Phone"}</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">{booking.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("receptionist.customers.lastVisit") || "Last Visit"}</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">July 5, 2025</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("receptionist.customers.tier") || "Membership"}</p>
                        <p className="mt-1 text-sm font-extrabold text-[#eb5b92]">Gold Tier</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("profile.email") || "Email"}</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">sophia.h@email.com</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("receptionist.bookings.artist") || "Preferred Artist"}</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">Luna Park</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">{t("receptionist.customers.totalVisits") || "Total Visits"}</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">47 visits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:w-[160px]">
                <button
                  type="button"
                  onClick={() => handleMockAction("Call Customer")}
                  title={t("receptionist.common.call") || "Call Customer"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1f6] px-4 py-2.5 text-xs font-bold text-[#eb5b92]"
                >
                  <Phone size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Send Message")}
                  title={t("receptionist.common.message") || "Send Message"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f2edff] px-4 py-2.5 text-xs font-bold text-[#7b68c8]"
                >
                  <Send size={14} />

                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("View History")}
                  title={language === "vi" ? "Xem lịch sử" : "View History"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff4cf] px-4 py-2.5 text-xs font-bold text-[#c89516]"
                >
                  <Sparkles size={14} />

                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t("receptionist.bookings.title") || "Appointment Details"}
            subtitle={t("receptionist.bookings.desc") || "Today's scheduled services"}
            badge={language === "vi" ? "4 Dịch vụ" : "4 Services"}
          >
            <Table
              rowKey="id"
              columns={serviceColumns}
              dataSource={SERVICE_ROWS}
              pagination={false}
              scroll={{ x: 860 }}
            />
          </SectionCard>

          <SectionCard
            title={t("receptionist.payments.summaryTitle") || "Payment Summary"}
            subtitle={t("receptionist.payments.checkoutDesc") || "Booking financial overview"}
            badge={language === "vi" ? "Đã thanh toán 60%" : "60% Paid"}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
              <div>
                <div className="space-y-3 text-sm">
                  {[
                    [t("receptionist.payments.subtotal") || "Subtotal", "$285.00"],
                    [language === "vi" ? "Giảm giá Thành viên Vàng (10%)" : "Gold Member Discount (10%)", "-$28.50"],
                    [t("receptionist.payments.deposit") || "Deposit Paid", "-$80.00"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[#8f7b88]">{label}</span>
                      <span className="font-bold text-[#4a3741]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[#f3d7e2] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#8f7b88]">{t("receptionist.payments.totalAmount") || "Remaining Balance"}</span>
                    <span className="text-sm font-extrabold text-[#eb5b92]">$176.50</span>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#4a3741]">{t("receptionist.payments.totalAmount") || "Total Amount"}</p>
                    <p className="mt-2 text-[1.8rem] font-bold leading-none text-[#eb5b92]">$256.50</p>
                  </div>
                  <div className="text-right text-[11px] text-[#a48796]">
                    <p>{language === "vi" ? "Đã cọc $80.00" : "Deposit paid $80.00"}</p>
                    <p className="mt-1">{language === "vi" ? "Còn lại $176.50" : "Remaining $176.50"}</p>
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-[#f6d6e3]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#eb5b92_0%,#f4869f_100%)]"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleMockAction("Add Payment")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-xs font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
                >
                  <CreditCard size={14} />
                  {t("receptionist.payments.checkoutTitle") || "Add Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Print Receipt")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-[#fff3f8] px-4 py-3 text-xs font-extrabold text-[#eb5b92]"
                >
                  <Printer size={14} />
                  {language === "vi" ? "In Hóa đơn" : "Print Receipt"}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Receptionist Action Center"
            subtitle="Quick operation controls for this booking"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ACTION_CENTER.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleMockAction(item.label)}
                    className={`rounded-[18px] border border-[#f0d8e2] px-4 py-4 text-center shadow-[0_10px_22px_rgba(236,72,153,0.04)] transition hover:-translate-y-0.5 ${item.cardTone}`}
                  >
                    <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconTone}`}>
                      <Icon size={18} />
                    </span>
                    <p className="mt-3 text-xs font-extrabold text-[#4a3741]">
                      {item.label === "Check In"
                        ? t("receptionist.dashboard.checkinBtn") || item.label
                        : item.label === "Start Service"
                          ? t("receptionist.bookings.startService") || item.label
                          : item.label === "Reassign Artist"
                            ? t("receptionist.bookings.reassignArtist") || item.label
                            : item.label === "Move Schedule"
                              ? t("receptionist.bookings.moveSchedule") || item.label
                              : item.label === "Add Service"
                                ? t("receptionist.bookings.addService") || item.label
                                : item.label === "Complete Booking"
                                  ? t("receptionist.bookings.completeBooking") || item.label
                                  : item.label === "Cancel Booking"
                                    ? t("receptionist.bookings.cancelBooking") || item.label
                                    : item.label === "Send Invoice"
                                      ? t("receptionist.bookings.sendInvoice") || item.label
                                      : item.label}
                    </p>
                    <p className="mt-1 text-[10px] text-[#9f8896]">
                      {item.label === "Check In"
                        ? t("receptionist.bookings.manualCheckInBtn") || item.subtitle
                        : item.label === "Start Service"
                          ? t("receptionist.bookings.beginSession") || item.subtitle
                          : item.label === "Reassign Artist"
                            ? t("receptionist.bookings.changeStaff") || item.subtitle
                            : item.label === "Move Schedule"
                              ? t("receptionist.bookings.rescheduleTime") || item.subtitle
                              : item.label === "Add Service"
                                ? t("receptionist.bookings.extraTreatment") || item.subtitle
                                : item.label === "Complete Booking"
                                  ? t("receptionist.bookings.finalizeSession") || item.subtitle
                                  : item.label === "Cancel Booking"
                                    ? t("receptionist.bookings.voidAppointment") || item.subtitle
                                    : item.label === "Send Invoice"
                                      ? t("receptionist.bookings.emailToClient") || item.subtitle
                                      : item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title={t("receptionist.common.status") || "Quick Status"}>
            <div className="space-y-3 text-sm">
              {QUICK_STATUS.map(([label, value], index) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[#8f7b88]">{label}</span>
                  <span
                    className={
                      index === 0
                        ? "rounded-full bg-[#efeafd] px-2.5 py-1 text-[10px] font-extrabold text-[#7c63d8]"
                        : "font-bold text-[#4a3741]"
                    }
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] text-[#a48796]">
                <span>{language === "vi" ? "Tiến độ" : "Progress"}</span>
                <span>{language === "vi" ? "Đã xong 2 trong 4" : "2 of 4 done"}</span>
              </div>
              <div className="h-2 rounded-full bg-[#f6d6e3]">
                <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#eb5b92_0%,#f4869f_100%)]" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={language === "vi" ? "Đánh giá mới nhất" : "Latest Review"}>
            <div className="flex items-start gap-3">
              <img crossOrigin="anonymous"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                alt="Sophia Hartwell"
                className="h-10 w-10 rounded-full border border-[#f3d7e2] object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-extrabold text-[#4a3741]">Sophia Hartwell</p>
                <p className="mt-1 text-[10px] text-[#a48796]">July 5, 2025</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1 text-[#f1aa2a]">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index}>*</span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[#7e6d77]">
              "Luna is absolutely amazing - my nails have never looked this beautiful. The whole experience felt so luxurious and relaxing!"
            </p>
          </SectionCard>

          <SectionCard title={language === "vi" ? "Ghi chú nội bộ" : "Internal Notes"}>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-[#f3d7e2] bg-[#fffafb] px-4 py-3 text-xs leading-6 text-[#4a3741] outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success(language === "vi" ? "Đã lưu ghi chú trong giao diện mô phỏng." : "Receptionist notes saved in mock UI.")}
              className="mt-4 w-full rounded-xl border border-[#f3d7e2] bg-[#fff1f6] px-4 py-3 text-xs font-extrabold text-[#eb5b92]"
            >
              {language === "vi" ? "Lưu ghi chú" : "Save Notes"}
            </button>
          </SectionCard>

          {/* <SectionCard title="Next Appointment">
            <div className="rounded-[20px] border border-[#f3d7e2] bg-[#fff7fb] px-4 py-4">
              <p className="text-xs font-extrabold text-[#eb5b92]">Tomorrow - 2:30 PM</p>
              <p className="mt-2 text-sm font-bold text-[#4a3741]">Gel Manicure + Nail Art</p>
              <p className="mt-2 text-[11px] text-[#8f7b88]">with Luna Park - Chair #02</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMockAction("View next appointment")}
                className="rounded-xl border border-[#f3d7e2] bg-[#fff1f6] px-4 py-2.5 text-xs font-extrabold text-[#eb5b92]"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => handleMockAction("Edit next appointment")}
                className="rounded-xl border border-[#e3dbff] bg-[#f2edff] px-4 py-2.5 text-xs font-extrabold text-[#7c63d8]"
              >
                Edit
              </button>
            </div>
          </SectionCard> */}
        </aside>
      </div>
    </section>
  );
}

ReceptionistBookingDetail.propTypes = {
  booking: PropTypes.shape({
    customerName: PropTypes.string,
    customerPhone: PropTypes.string,
    id: PropTypes.string,
  }).isRequired,
};

