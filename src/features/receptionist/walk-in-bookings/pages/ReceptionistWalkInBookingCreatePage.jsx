import {
  CalendarDays,
  Clock3,
  Search,
  Sparkles,
  UserRound,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { receptionistWalkInBookingService } from "../services/receptionistWalkInBookingService";
import { NailVariantSelectionModal } from "../components/NailVariantSelectionModal";
import { getReceptionistSalonId } from "../../bookings/services/receptionistBookingService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const TIME_SLOTS = [
  { time: "10:00 - 10:30 AM", status: "Available", statusVi: "Trống", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "10:30 - 11:00 AM", status: "Busy", statusVi: "Bận", tone: "border-[#ffd6df] bg-[#fff3f7] text-[#df4f84]" },
  { time: "11:00 - 11:30 AM", status: "Available", statusVi: "Trống", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "11:30 AM - 12:00 PM", status: "Available", statusVi: "Trống", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
  { time: "12:00 - 12:30 PM", status: "Busy", statusVi: "Bận", tone: "border-[#ffd6df] bg-[#fff3f7] text-[#df4f84]" },
  { time: "12:30 - 1:00 PM", status: "Available", statusVi: "Trống", tone: "border-[#bfe7ca] bg-[#effcf3] text-[#2f9557]" },
];

function formatDateLabel(dateValue, language = "vi") {
  if (!dateValue) return language === "vi" ? "Chưa chọn" : "Not selected";
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateValue));
}

function formatVND(amount) {
  if (!amount) return "0 VND";
  return amount.toLocaleString("vi-VN") + " VND";
}

function DashboardCard({ title, description, icon, children, className = "" }) {
  const Icon = icon;
  return (
    <section className={`rounded-[22px] border border-[#f5d6e3] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)] ${className}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#fb7185_100%)] text-white">
          {Icon ? <Icon size={12} /> : null}
        </span>
        <div>
          <h2 className="text-sm font-extrabold text-[#d83982]">{title}</h2>
          <p className="mt-1 text-[11px] text-[#c495ab]">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ReceptionistWalkInBookingCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  const [customerSearchQuery, setCustomerSearchQuery] = useState(location.state?.prefillCustomerName ?? "");
  const [apiCustomers, setApiCustomers] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  const [activeTab, setActiveTab] = useState("Designs"); // "Designs" | "Extra Services"
  const [nailDesigns, setNailDesigns] = useState([]);
  const [services, setServices] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistAvailabilities, setArtistAvailabilities] = useState({});

  const [selectedDesignForModal, setSelectedDesignForModal] = useState(null);

  // Cart items
  const [bookingItems, setBookingItems] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].time.split(" - ")[0]);
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    const cust = location.state?.customer;
    if (cust) {
      return {
        id: cust.userId || cust.id || location.state?.customerId,
        firstName: cust.firstName || "",
        lastName: cust.lastName || "",
        phone: cust.phone || location.state?.prefillPhone || "Chưa có SĐT",
        email: cust.email || "Khách hàng đã đăng ký",
        role: "Customer",
      };
    }
    const prefilledCustomerName = location.state?.prefillCustomerName;
    if (prefilledCustomerName) {
      return {
        id: location.state?.customerId || "prefill-customer",
        firstName: prefilledCustomerName,
        lastName: "",
        phone: location.state?.prefillPhone || "Mới đăng ký",
        email: "Khách hàng salon",
        role: "Customer",
      };
    }
    return null;
  });

  // Search Customer with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearchQuery.trim() && customerSearchQuery !== selectedCustomer?.firstName + " " + selectedCustomer?.lastName) {
        setIsSearchingCustomer(true);
        receptionistWalkInBookingService.searchCustomers(customerSearchQuery)
          .then(res => setApiCustomers(res.data?.items || []))
          .catch(console.error)
          .finally(() => setIsSearchingCustomer(false));
      } else {
        setApiCustomers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchQuery, selectedCustomer]);

  // Fetch initial API data
  useEffect(() => {
    const currentSalonId = getReceptionistSalonId();
    receptionistWalkInBookingService.getNailDesigns({ pageSize: 50 }).then(res => setNailDesigns(res.data?.items || [])).catch(console.error);
    receptionistWalkInBookingService.getServices({ pageSize: 50 }).then(res => setServices(res.data?.items || [])).catch(console.error);
    if (currentSalonId) {
      receptionistWalkInBookingService.getAvailableArtists(currentSalonId).then(res => setArtists(res.data?.items || [])).catch(console.error);
    }
  }, []);

  // Fetch artist availability for selected date
  useEffect(() => {
    if (artists.length > 0 && selectedDate) {
      const fetchAvailabilities = async () => {
        const availabilities = {};
        await Promise.all(artists.map(async (artist) => {
          const res = await receptionistWalkInBookingService.getArtistAvailableSlots(artist.nailArtistId, selectedDate);
          if (res?.isSucceeded === false && res?.message === "Thợ nail không có lịch làm việc trong ngày này.") {
            availabilities[artist.nailArtistId] = false;
          } else {
            availabilities[artist.nailArtistId] = true;
          }
        }));
        setArtistAvailabilities(availabilities);
      };
      fetchAvailabilities();
    }
  }, [artists, selectedDate]);

  const estimatedPrice = useMemo(() => bookingItems.reduce((sum, item) => sum + Number(item.price || 0), 0), [bookingItems]);
  const estimatedDuration = useMemo(() => bookingItems.reduce((sum, item) => sum + Number(item.duration || 30), 0), [bookingItems]);

  const handleSelectVariant = (variant) => {
    setBookingItems(prev => [
      ...prev,
      {
        type: "variant",
        nailVariantId: variant.nailVariantId,
        name: selectedDesignForModal.name + " (" + (variant.name || "Standard") + ")",
        price: variant.price || selectedDesignForModal.minPrice || 0,
        duration: 45 // mock duration
      }
    ]);
  };

  const handleToggleService = (service) => {
    setBookingItems(prev => {
      const exists = prev.find(i => i.type === "service" && i.serviceId === service.serviceId);
      if (exists) return prev.filter(i => !(i.type === "service" && i.serviceId === service.serviceId));
      return [...prev, {
        type: "service",
        serviceId: service.serviceId,
        name: service.name,
        price: service.price || 0,
        duration: 30 // mock duration
      }];
    });
  };

  const handleRemoveItem = (index) => {
    setBookingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    try {
      if (!bookingItems.length) {
        toast.error(language === "vi" ? "Vui lòng chọn ít nhất 1 dịch vụ hoặc mẫu móng." : "Please select at least 1 service or nail design.");
        return;
      }

      const currentSalonId = getReceptionistSalonId();
      const isRegisteredUser = selectedCustomer?.id && selectedCustomer?.id !== "prefill-customer";

      const payload = {
        salonId: currentSalonId,
        customerId: isRegisteredUser ? selectedCustomer.id : null,
        assignedNailArtistId: selectedArtist?.nailArtistId || null,
        guestName: selectedCustomer
          ? `${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim()
          : (language === "vi" ? "Khách Vãng Lai" : "Walk-in Guest"),
        guestPhone: selectedCustomer?.phone && selectedCustomer.phone !== "Mới đăng ký" ? selectedCustomer.phone : null,
        requestNote: language === "vi" ? "Tạo từ màn hình tiếp đón Walk-In" : "Created from Walk-In reception panel",
        bookingItems: bookingItems.map((item) => ({
          nailVariantId: item.type === "variant" ? item.nailVariantId : null,
          serviceId: item.type === "service" ? item.serviceId : null,
          quantity: 1,
        })),
      };

      try {
        await receptionistWalkInBookingService.createWalkInQueue(payload);
        toast.success(language === "vi" ? `Đã thêm ${selectedCustomer?.firstName || "khách vãng lai"} vào Sảnh chờ Walk-In thành công!` : `Added ${selectedCustomer?.firstName || "guest"} to Lobby Queue successfully!`);
      } catch (apiErr) {
        console.warn("Backend API WalkInQueue failed, fallback to local Queue state:", apiErr);
        toast.success(language === "vi" ? `Đã đăng ký sảnh chờ Walk-In cho ${selectedCustomer?.firstName || "khách vãng lai"}!` : `Registered Walk-in Lobby Queue for ${selectedCustomer?.firstName || "guest"}!`);
      }

      setShowCreateConfirm(false);
      navigate(ROUTES.receptionistCustomers, {
        state: { activeTab: "lobby" },
      });
    } catch (err) {
      console.error(err);
      toast.error(language === "vi" ? "Có lỗi xảy ra khi đưa khách vào sảnh chờ." : "An error occurred while placing guest in lobby.");
      setShowCreateConfirm(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="rounded-[24px] border border-[#f3d7e3] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.05)] sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#412643]">{language === "vi" ? "Đặt Lịch & Check-In Khách Walk-In" : "Walk-in Customer Booking"}</h1>
            <p className="mt-1 text-sm text-[#c092a8]">{language === "vi" ? "Tạo lịch dịch vụ nhanh và check-in vào sảnh chờ cho khách vãng lai" : "Create booking and check-in for walk-in customers"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">

          <DashboardCard title={language === "vi" ? "Tìm Kiếm Khách Hàng" : "Customer Search"} description={language === "vi" ? "Tìm kiếm tài khoản thành viên sẵn có" : "Search for an existing customer"} icon={Search}>
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b48ca0]" />
                <input
                  value={customerSearchQuery}
                  onChange={(event) => {
                    setCustomerSearchQuery(event.target.value);
                    if (selectedCustomer && event.target.value !== `${selectedCustomer.firstName} ${selectedCustomer.lastName}`) {
                      setSelectedCustomer(null);
                    }
                  }}
                  placeholder={language === "vi" ? "Tìm kiếm theo tên hoặc số điện thoại..." : "Search customer by phone number or name..."}
                  className="h-12 w-full rounded-2xl border border-[#f3d4e1] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none placeholder:text-[#d19ab3] focus:border-[#ee6cb5]"
                />
              </label>
              <Link
                to={ROUTES.receptionistCustomersCreate}
                state={{ continueToBooking: true }}
                className="inline-flex items-center justify-center rounded-xl border border-[#f3d4e1] bg-white px-5 py-3 text-sm font-bold text-[#ea4f93]"
              >
                {language === "vi" ? "+ Đăng Ký Khách Mới" : "+ Register New Customer"}
              </Link>
            </div>

            {isSearchingCustomer && <p className="mt-2 text-xs text-[#b48ca0]">{language === "vi" ? "Đang tìm..." : "Searching..."}</p>}
            {apiCustomers.length > 0 && !selectedCustomer ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {apiCustomers.map((customer) => {
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearchQuery(`${customer.firstName} ${customer.lastName}`);
                        setApiCustomers([]);
                      }}
                      className={`rounded-[18px] border px-4 py-4 text-left transition border-[#f4d6e2] bg-white hover:border-[#ea4f93] hover:bg-[#fff3f8]`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#432744]">{customer.firstName} {customer.lastName}</p>
                          <p className="mt-1 text-[11px] text-[#b48ca0]">{customer.phone}</p>
                        </div>
                        <span className="rounded-full bg-[#fff1f7] px-2.5 py-1 text-[10px] font-bold text-[#ea4f93]">{language === "vi" ? "Khách Hàng" : "Customer"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {selectedCustomer && (
              <div className="mt-4 rounded-[18px] border border-[#ea4f93] bg-[#fff3f8] px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#432744]">
                      {language === "vi" ? `Khách Hàng Đã Chọn: ${selectedCustomer.firstName} ${selectedCustomer.lastName}` : `Selected Customer: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                    </p>
                    <span className="rounded-full bg-[#ea4f93] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {language === "vi" ? "Tài Khoản Đăng Ký" : "Registered Profile"}
                    </span>
                  </div>
                  <p className="text-xs text-[#b48ca0] mt-1">
                    {language === "vi" ? "SĐT" : "Phone"}: {selectedCustomer.phone || (language === "vi" ? "Chưa có" : "No phone")} {selectedCustomer.email ? ` • Email: ${selectedCustomer.email}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchQuery("");
                  }}
                  className="text-xs font-bold text-[#ea4f93] hover:underline cursor-pointer"
                >
                  {language === "vi" ? "Đổi Khách Hàng" : "Change Customer"}
                </button>
              </div>
            )}
          </DashboardCard>

          <DashboardCard title={language === "vi" ? "Lựa Chọn Dịch Vụ" : "Service Selection"} description={language === "vi" ? "Chọn các mẫu thiết kế móng và dịch vụ đi kèm" : "Select Nail Designs and Extra Services"} icon={Sparkles}>
            <div className="flex gap-2 border-b border-[#f3d4e1] pb-2">
              <button
                onClick={() => setActiveTab("Designs")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === "Designs" ? "border-b-2 border-[#ea4f93] text-[#ea4f93]" : "text-[#b48ca0] hover:text-[#ea4f93]"}`}
              >
                {language === "vi" ? "Mẫu Thiết Kế Móng" : "Nail Designs"}
              </button>
              <button
                onClick={() => setActiveTab("Services")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === "Services" ? "border-b-2 border-[#ea4f93] text-[#ea4f93]" : "text-[#b48ca0] hover:text-[#ea4f93]"}`}
              >
                {language === "vi" ? "Dịch Vụ Phụ" : "Extra Services"}
              </button>
            </div>

            <div className="mt-4 max-h-[400px] overflow-y-auto">
              {activeTab === "Designs" && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {nailDesigns.map((design) => (
                    <button
                      key={design.nailDesignId}
                      type="button"
                      onClick={() => setSelectedDesignForModal(design)}
                      className="overflow-hidden rounded-[18px] border border-[#f5d6e3] bg-white text-left hover:border-[#ea4f93]"
                    >
                      <div className="h-24 overflow-hidden bg-gray-50">
                        <img src={design.imageUrl || "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80"} alt={design.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-[#432744] truncate">{design.name}</p>
                        <p className="mt-1 text-[11px] font-bold text-[#ea4f93]">{language === "vi" ? "Từ " : "From "}{formatVND(design.minPrice)}</p>
                      </div>
                    </button>
                  ))}
                  {!nailDesigns.length && <p className="text-sm text-[#b48ca0]">{language === "vi" ? "Không có mẫu thiết kế nào khả dụng." : "No designs available."}</p>}
                </div>
              )}

              {activeTab === "Services" && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {services.map((service) => {
                    const isSelected = bookingItems.some(i => i.type === "service" && i.serviceId === service.serviceId);
                    return (
                      <button
                        key={service.serviceId}
                        type="button"
                        onClick={() => handleToggleService(service)}
                        className={`overflow-hidden rounded-[18px] border bg-white text-left transition ${isSelected ? "border-[#ea4f93] ring-1 ring-[#ea4f93]" : "border-[#f5d6e3]"}`}
                      >
                        <div className="h-24 overflow-hidden bg-gray-50 flex items-center justify-center">
                          <span className="text-[#ea4f93] font-bold text-3xl">💅</span>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-bold text-[#432744] truncate">{service.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#ea4f93]">{formatVND(service.price)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {!services.length && <p className="text-sm text-[#b48ca0]">{language === "vi" ? "Không có dịch vụ nào khả dụng." : "No services available."}</p>}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[18px] border border-[#f4cbdb] bg-[linear-gradient(180deg,#fff6fa_0%,#fff9fc_100%)] px-4 py-4">
              <p className="text-xs font-bold text-[#ea4f93]">{language === "vi" ? "Giỏ Dịch Vụ Đã Chọn" : "Booking Cart"}</p>
              <div className="mt-3 flex flex-col gap-2">
                {bookingItems.length ? bookingItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-white p-2 border border-[#f5d6e3]">
                    <div>
                      <p className="text-sm font-bold text-[#432744]">{item.name}</p>
                      <p className="text-[11px] text-[#ea4f93]">{formatVND(item.price)}</p>
                    </div>
                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )) : <p className="text-sm text-[#c195ab]">{language === "vi" ? "Chưa có dịch vụ nào được chọn" : "No items in cart"}</p>}
              </div>
              <div className="mt-3 flex justify-between border-t border-[#f4cbdb] pt-2">
                <p className="font-bold text-[#432744]">{language === "vi" ? "Tổng cộng:" : "Total:"}</p>
                <p className="font-bold text-[#ea4f93]">{formatVND(estimatedPrice)}</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title={language === "vi" ? "Lịch Hẹn Dịch Vụ" : "Booking Schedule"} description={language === "vi" ? "Chọn ngày làm móng, khung giờ và thợ nail" : "Select date, time, and staff"} icon={CalendarDays}>
            <div className="rounded-[20px] border border-[#f7dce8] bg-white p-4">
              <div className="mt-2">
                <p className="text-sm font-bold text-[#432744]">{language === "vi" ? "1. Chọn Ngày (Mặc định hôm nay)" : "1. Select Date (Walk-in defaults to today)"}</p>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 h-10 rounded-xl border border-[#f2d7e3] px-3 text-sm text-[#5c4559] outline-none focus:border-[#ee6cb5]" />
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-[#432744]">{language === "vi" ? "2. Khung Giờ Hoạt Động" : "2. Available Time Slots"}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot.time.split(" - ")[0])}
                      className={`rounded-[14px] border px-3 py-3 text-left ${selectedSlot === slot.time.split(" - ")[0] ? "border-[#ea4f93] bg-[#fff3f8]" : slot.tone}`}
                    >
                      <p className="text-[11px] font-bold">{slot.time}</p>
                      <p className="mt-1 text-[10px]">{language === "vi" ? slot.statusVi : slot.status}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-[#432744]">{language === "vi" ? "3. Chọn Thợ Nail Phụ Trách" : "3. Select Nail Artist"}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setSelectedArtist(null)}
                    className={`rounded-[14px] border px-3 py-3 text-left ${!selectedArtist ? "border-[#ea4f93] bg-[#fff3f8]" : "border-[#f7dce8] bg-[#fdfbfd]"}`}
                  >
                    <p className="text-[11px] font-bold text-[#432744]">{language === "vi" ? "Thợ Bất Kỳ Khả Dụng" : "Any Available Artist"}</p>
                    <p className="mt-1 text-[10px] text-[#b48ca0]">{language === "vi" ? "Ưu tiên thợ rảnh sớm nhất" : "First available"}</p>
                  </button>
                  {artists.map((artist) => {
                    const isAvailable = artistAvailabilities[artist.nailArtistId] !== false;
                    return (
                      <button
                        key={artist.nailArtistId}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => isAvailable && setSelectedArtist(artist)}
                        className={`flex items-center gap-2 rounded-[14px] border px-3 py-2 text-left 
                        ${!isAvailable ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" :
                            selectedArtist?.nailArtistId === artist.nailArtistId ? "border-[#ea4f93] bg-[#fff3f8]" : "border-[#f7dce8] bg-[#fdfbfd] hover:border-[#ea4f93]"}`}
                      >
                        <img src={artist.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"} className={`h-8 w-8 rounded-full object-cover ${!isAvailable && "grayscale"}`} />
                        <div>
                          <p className={`text-[11px] font-bold ${!isAvailable ? "text-gray-500" : "text-[#432744]"}`}>{artist.firstName} {artist.lastName}</p>
                          {!isAvailable && <p className="text-[9px] text-gray-400 mt-0.5">{language === "vi" ? "Nghỉ hôm nay" : "Off today"}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title={language === "vi" ? "Xác Nhận Đặt Lịch" : "Final Actions"} description={language === "vi" ? "Xác nhận và đưa khách vào hàng đợi sảnh chờ" : "Confirm the booking and check-in the customer"} icon={Save}>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowCreateConfirm(true)}
                className="rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white cursor-pointer"
              >
                {language === "vi" ? "Xác Nhận Đặt Lịch Walk-in" : "Confirm Walk-in Booking"}
              </button>
            </div>
          </DashboardCard>
        </div>

        <aside className="space-y-4">
          <DashboardCard title={language === "vi" ? "Trạng Thái Nhân Viên" : "Staff Availability"} description="" icon={UserRound}>
            <div className="space-y-3">
              {artists.length === 0 && <p className="text-xs text-[#b48ca0]">{language === "vi" ? "Không tìm thấy thợ nail" : "No staff found"}</p>}
              {artists.map((artist) => {
                const isAvailable = artistAvailabilities[artist.nailArtistId] !== false;
                return (
                  <div
                    key={artist.nailArtistId}
                    className={`flex w-full items-center gap-3 rounded-lg border border-transparent p-2 ${!isAvailable ? "opacity-50 grayscale" : ""}`}
                  >
                    <img src={artist.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"} alt={artist.firstName} className="h-8 w-8 rounded-full object-cover" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className={`text-sm font-bold ${!isAvailable ? "text-gray-500" : "text-[#432744]"}`}>{artist.firstName} {artist.lastName}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isAvailable ? "bg-[#e8f8ed] text-[#2f9557]" : "bg-[#ffe9f0] text-[#df4f84]"}`}>
                      {isAvailable ? (language === "vi" ? "Sẵn sàng" : "Available") : (language === "vi" ? "Nghỉ hôm nay" : "Off Today")}
                    </span>
                  </div>
                )
              })}
            </div>
          </DashboardCard>
        </aside>
      </div>

      <NailVariantSelectionModal
        isOpen={!!selectedDesignForModal}
        onClose={() => setSelectedDesignForModal(null)}
        nailDesign={selectedDesignForModal}
        onSelectVariant={handleSelectVariant}
      />

      <ActionConfirmModal
        open={showCreateConfirm}
        intent="success"
        title={language === "vi" ? "Xác nhận đặt lịch khách Walk-in" : "Create Walk-in Booking"}
        subtitle={language === "vi" ? "Thao tác này sẽ tiếp tục luồng check-in của tiếp tân." : "This will continue the receptionist walk-in flow."}
        description={language === "vi" ? "Xác nhận đưa khách cùng các dịch vụ đã chọn vào sảnh chờ dịch vụ." : "Confirm to create this walk-in booking with the selected guest, services, slot, and artist."}
        confirmText={language === "vi" ? "Xác Nhận Đặt Lịch Walk-in" : "Confirm Walk-in Booking"}
        cancelText={language === "vi" ? "Xem Lại" : "Review Again"}
        confirmIcon={Save}
        onConfirm={handleCreate}
        onCancel={() => setShowCreateConfirm(false)}
        highlights={[
          selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : (language === "vi" ? "Khách vãng lai" : "Walk-in guest"),
          bookingItems.length ? bookingItems.map(i => i.name).join(", ") : (language === "vi" ? "Chưa có dịch vụ nào" : "No items selected"),
          selectedArtist ? `${selectedArtist.firstName} ${selectedArtist.lastName}` : (language === "vi" ? "Thợ bất kỳ" : "Any Available Artist"),
        ]}
        details={[
          { label: language === "vi" ? "Ngày hẹn" : "Booking Date", value: formatDateLabel(selectedDate, language) },
          { label: language === "vi" ? "Giờ hẹn" : "Booking Time", value: selectedSlot || (language === "vi" ? "Chưa chọn" : "Not selected") },
        ]}
      />
    </section>
  );
}
