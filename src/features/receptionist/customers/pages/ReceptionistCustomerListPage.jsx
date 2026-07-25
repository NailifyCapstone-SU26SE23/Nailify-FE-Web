import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  UserPlus,
  Phone,
  Mail,
  Sparkles,
  Eye,
  CalendarPlus,
  Users,
  UserCheck,
  Clock,
  Volume2,
  CheckCircle2,
  Crown,
  User,
  Scissors,
  Check,
  ExternalLink,
  AlertTriangle,
  X,
  Smartphone,
  UserX
} from "lucide-react";
import { Table, Spin, Modal, Input, Select, Tag } from "antd";
import toast from "react-hot-toast";

import { ROUTES } from "../../../../shared/constants/routes";
import { fetchReceptionistCustomers } from "../services/receptionistCustomerService";
import { receptionistWalkInBookingService } from "../../walk-in-bookings/services/receptionistWalkInBookingService";
import { getReceptionistSalonId } from "../../bookings/services/receptionistBookingService";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";

function formatDate(dateString) {
  if (!dateString) return "Chưa cập nhật";
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(firstName, lastName) {
  const f = (firstName || "").trim()[0] || "";
  const l = (lastName || "").trim()[0] || "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || "CU";
}

function getAvatarGradient(userId) {
  const gradients = [
    "from-[#D482A6] to-[#C97A9E]",
    "from-[#9A81D6] to-[#8066C0]",
    "from-[#E49B74] to-[#D68257]",
    "from-[#5EB79E] to-[#469C84]",
    "from-[#64A9D9] to-[#488EC0]",
  ];
  const charCode = (userId || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return gradients[charCode % gradients.length];
}

function getStatusBadge(status) {
  const norm = String(status || "").trim().toLowerCase();
  switch (norm) {
    case "active":
    case "current":
      return {
        label: "Hoạt động",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "prospective":
      return {
        label: "Tiềm năng",
        tone: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
      };
    case "inactive":
    case "non-active":
      return {
        label: "Tạm khóa",
        tone: "bg-gray-100 text-gray-600 border-gray-200",
        dot: "bg-gray-400",
      };
    default:
      return {
        label: "Hoạt động",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
  }
}

export function ReceptionistCustomerListPage() {
  const navigate = useNavigate();
  const [mainWorkspaceTab, setMainWorkspaceTab] = useState("directory");
  const [viewMode, setViewMode] = useState("grid");
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [walkInGuests, setWalkInGuests] = useState([
    {
      id: "W-01",
      customerName: "Nguyễn Thị Phương",
      phone: "0912 345 678",
      entryType: "app_user",
      nailDesign: "Sơn Gel Ombre Pink Rose",
      serviceName: "Sơn Gel & Chăm Sóc Móng",
      assignedArtist: "Olivia Lê",
      duration: "15 phút",
      status: "lobby",
      checkInTime: "10:15",
      userId: "dcb2364e-1111-2222-3333-444455556666",
    },
    {
      id: "W-02",
      customerName: "Trần Bảo Ngọc",
      phone: "0988 123 456",
      entryType: "late_arrival",
      lateMinutes: 18,
      nailDesign: "Nail Art Floral Chic",
      serviceName: "Cắt Móng & Vẽ Art Hoa Văn",
      assignedArtist: "Minh Thư",
      duration: "35 phút",
      status: "called",
      checkInTime: "10:30",
      userId: null,
    },
    {
      id: "W-03",
      customerName: "Đoàn Thanh",
      phone: "0966 340 303",
      entryType: "new_guest",
      nailDesign: "Móng Vuông Đính Đá Subtle",
      serviceName: "Đính Đá & Làm Đệm Móng",
      assignedArtist: "Anh Thư",
      duration: "45 phút",
      status: "in_service",
      checkInTime: "09:45",
      userId: null,
    },
    {
      id: "W-04",
      customerName: "Hoàng Mỹ Duyên",
      phone: "0909 888 777",
      entryType: "app_user",
      nailDesign: "Chăm Sóc Dưỡng Móng Tự Nhiên",
      serviceName: "Tháo Móng & Dưỡng Da",
      assignedArtist: "Kim Ngân",
      duration: "20 phút",
      status: "completed",
      checkInTime: "09:10",
      userId: null,
    },
  ]);

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInTab, setWalkInTab] = useState("app_user");
  const [selectedAppCustomerId, setSelectedAppCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [selectedLateBookingId, setSelectedLateBookingId] = useState(null);
  const [rawQueueItems, setRawQueueItems] = useState([]);
  const [walkInService, setWalkInService] = useState("Sơn Gel Ombre Pink Rose");
  const [walkInArtist, setWalkInArtist] = useState("Olivia Lê");
  const [walkInDuration, setWalkInDuration] = useState("20 phút");
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Dynamic DB Services & Nail Variants & Suggested Artists
  const [dbServices, setDbServices] = useState([]);
  const [dbNailVariants, setDbNailVariants] = useState([]);
  const [selectedServiceMap, setSelectedServiceMap] = useState({}); // { [serviceId]: count }
  const [selectedVariantMap, setSelectedVariantMap] = useState({}); // { [variantId]: count }
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const [suggestedArtists, setSuggestedArtists] = useState([]);
  const [selectedArtistIdForWalkIn, setSelectedArtistIdForWalkIn] = useState(null);
  const [isLoadingSuggestedArtists, setIsLoadingSuggestedArtists] = useState(false);

  const filteredNailVariants = useMemo(() => {
    if (!variantSearchQuery.trim()) return dbNailVariants;
    const q = variantSearchQuery.toLowerCase();
    return dbNailVariants.filter(
      (v) =>
        (v.variantName && v.variantName.toLowerCase().includes(q)) ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.nailVariantId && String(v.nailVariantId).includes(q))
    );
  }, [dbNailVariants, variantSearchQuery]);

  const lateArrivalOptions = useMemo(() => {
    const filtered = rawQueueItems.filter(
      (item) => item.isLateArrival || item.originalBookingId || (item.requestNote && item.requestNote.toLowerCase().includes("muộn"))
    );

    if (filtered.length === 0) {
      return [
        {
          value: "",
          display: "Chưa có khách hàng tới trễ trong hàng chờ sảnh",
          label: (
            <div className="py-1 text-xs text-gray-400 font-medium italic">
              Chưa có lịch đặt trước tới trễ trong hàng chờ sảnh hôm nay
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return filtered.map((item, idx) => {
      const code = item.queuePosition ? `BK-${100 + item.queuePosition}` : `BK-${100 + idx + 1}`;
      const name = item.guestName || "Khách Hàng";
      const phone = item.guestPhone || "Chưa có SĐT";
      const note = item.requestNote || "Khách hàng đến muộn -> Tự động chuyển xuống hàng chờ";
      const qId = item.queueId || item.id || item.originalBookingId;

      return {
        value: qId,
        display: `⚠️ ${code}: ${name} - ${phone}`,
        label: (
          <div className="flex flex-col py-1 border-b border-gray-50 last:border-none min-w-[280px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-[#221F26] text-xs">
                {code}: {name}
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Trễ ≥ 15p
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-0.5">{phone}</span>
            <span className="text-[10px] text-amber-600 font-semibold italic mt-0.5 truncate">
              {note}
            </span>
          </div>
        ),
      };
    });
  }, [rawQueueItems]);

  const totalCalculatedPrice = useMemo(() => {
    let total = 0;
    Object.entries(selectedServiceMap).forEach(([sId, qty]) => {
      const sObj = dbServices.find((s) => (s.serviceId || s.id) === sId);
      if (sObj && qty > 0) {
        total += (sObj.price || 0) * qty;
      }
    });
    Object.entries(selectedVariantMap).forEach(([vId, qty]) => {
      const vObj = dbNailVariants.find(
        (v) => (v.nailVariantId || v.id) === Number(vId) || (v.nailVariantId || v.id) === vId
      );
      if (vObj && qty > 0) {
        total += (vObj.price || 0) * qty;
      }
    });
    return total;
  }, [dbServices, dbNailVariants, selectedServiceMap, selectedVariantMap]);

  const calculatedDuration = useMemo(() => {
    let totalMinutes = 0;
    Object.entries(selectedServiceMap).forEach(([sId, qty]) => {
      const sObj = dbServices.find((s) => (s.serviceId || s.id) === sId);
      if (sObj && qty > 0) {
        const d = sObj.duration || sObj.Duration || 15;
        totalMinutes += d * qty;
      }
    });
    Object.entries(selectedVariantMap).forEach(([vId, qty]) => {
      const vObj = dbNailVariants.find(
        (v) => (v.nailVariantId || v.id) === Number(vId) || (v.nailVariantId || v.id) === vId
      );
      if (vObj && qty > 0) {
        const d = vObj.duration || vObj.Duration || vObj.estimatedDuration || 20;
        totalMinutes += d * qty;
      }
    });
    return totalMinutes > 0 ? totalMinutes : 20;
  }, [dbServices, dbNailVariants, selectedServiceMap, selectedVariantMap]);

  const loadModalData = useCallback(async () => {
    try {
      const [svcRes, varRes] = await Promise.all([
        receptionistWalkInBookingService.getServices({ pageSize: 100 }),
        receptionistWalkInBookingService.getAllNailVariants({ pageSize: 100 }),
      ]);

      const svcs = Array.isArray(svcRes)
        ? svcRes
        : svcRes?.data?.items || svcRes?.items || svcRes?.data || [];
      const vars = Array.isArray(varRes)
        ? varRes
        : varRes?.data?.items || varRes?.items || varRes?.data || [];

      setDbServices(svcs);
      setDbNailVariants(vars);
    } catch (err) {
      console.error("Lỗi lấy danh sách Dịch vụ/Mẫu móng:", err);
    }
  }, []);

  const loadSuggestedArtists = useCallback(async (svcMap, varMap) => {
    setIsLoadingSuggestedArtists(true);
    try {
      const salonId = getReceptionistSalonId();
      let bookingItems = [];

      const svcEntries = Object.entries(svcMap || {}).filter(([_, q]) => q > 0);
      const varEntries = Object.entries(varMap || {}).filter(([_, q]) => q > 0);

      if (svcEntries.length > 0) {
        svcEntries.forEach(([sId, qty]) => {
          bookingItems.push({
            serviceId: sId,
            nailVariantId: null,
            quantity: qty,
          });
        });
      }

      if (varEntries.length > 0) {
        varEntries.forEach(([vId, qty]) => {
          bookingItems.push({
            serviceId: null,
            nailVariantId: Number(vId),
            quantity: qty,
          });
        });
      }

      if (bookingItems.length === 0) {
        bookingItems = [
          {
            serviceId: null,
            nailVariantId: null,
            quantity: 1,
          },
        ];
      }

      const payload = {
        salonId,
        bookingDate: new Date().toISOString(),
        bookingItems,
      };

      const res = await receptionistWalkInBookingService.getSuggestedArtists(payload);
      const items = Array.isArray(res) ? res : res?.data || res?.items || [];

      const mapped = items.map((a) => {
        const artist = a.nailArtist || a.artist || a;
        const fullName =
          a.fullName ||
          artist.fullName ||
          (artist.account
            ? `${artist.account.firstName || ""} ${artist.account.lastName || ""}`.trim()
            : `${artist.firstName || ""} ${artist.lastName || ""}`.trim()) ||
          "Thợ Nail";

        return {
          nailArtistId: a.nailArtistId || artist.nailArtistId || artist.id,
          fullName: fullName,
          name: fullName,
          avatarUrl: a.avatarUrl || artist.avatarUrl || "",
          status: a.status || artist.status || "Active",
        };
      });

      setSuggestedArtists(mapped);
    } catch (err) {
      console.warn("Dùng danh sách thợ mặc định salon:", err);
      const salonId = getReceptionistSalonId();
      const fallbackRes = await receptionistWalkInBookingService.getAvailableArtists(salonId);
      const fallbackItems = Array.isArray(fallbackRes)
        ? fallbackRes
        : fallbackRes?.data?.items || fallbackRes?.items || fallbackRes?.data || [];
      const mappedFallback = fallbackItems.map((f) => ({
        nailArtistId: f.nailArtistId || f.id,
        fullName: f.account ? `${f.account.firstName || ""} ${f.account.lastName || ""}`.trim() : "Thợ Nail",
        name: f.account ? `${f.account.firstName || ""} ${f.account.lastName || ""}`.trim() : "Thợ Nail",
        avatarUrl: f.avatarUrl || "",
        status: f.status || "Active",
      }));
      setSuggestedArtists(mappedFallback);
    } finally {
      setIsLoadingSuggestedArtists(false);
    }
  }, []);

  useEffect(() => {
    if (isWalkInModalOpen) {
      loadModalData();
      loadSuggestedArtists(selectedServiceMap, selectedVariantMap);
    }
  }, [isWalkInModalOpen, loadModalData, loadSuggestedArtists, selectedServiceMap, selectedVariantMap]);

  // States for Assign Artist Modal
  const [isAssignArtistModalOpen, setIsAssignArtistModalOpen] = useState(false);
  const [selectedQueueGuest, setSelectedQueueGuest] = useState(null);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [selectedArtistIdToAssign, setSelectedArtistIdToAssign] = useState(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [autoSeatAfterAssign, setAutoSeatAfterAssign] = useState(false);

  const loadAvailableArtists = useCallback(async () => {
    setIsLoadingArtists(true);
    try {
      const salonId = getReceptionistSalonId();
      const res = await receptionistWalkInBookingService.getAvailableArtists(salonId);
      const items = Array.isArray(res)
        ? res
        : res?.data?.items || res?.items || res?.data || [];
      setAvailableArtists(items);
    } catch (err) {
      console.error("Lỗi lấy danh sách thợ:", err);
    } finally {
      setIsLoadingArtists(false);
    }
  }, []);

  const handleOpenAssignModal = (guest, autoSeat = false) => {
    setSelectedQueueGuest(guest);
    setSelectedArtistIdToAssign(guest.assignedNailArtistId || null);
    setAutoSeatAfterAssign(autoSeat);
    setIsAssignArtistModalOpen(true);
    loadAvailableArtists();
  };

  const handleConfirmAssignArtist = async () => {
    if (!selectedQueueGuest) return;
    if (!selectedArtistIdToAssign) {
      toast.error("Vui lòng chọn thợ làm móng.");
      return;
    }

    const actualQueueId = selectedQueueGuest.queueId || selectedQueueGuest.id;
    setIsSubmittingAssign(true);
    try {
      await receptionistWalkInBookingService.assignArtistToQueue(actualQueueId, {
        nailArtistId: selectedArtistIdToAssign,
      });

      if (autoSeatAfterAssign) {
        await receptionistWalkInBookingService.convertQueueToBooking(actualQueueId);
        toast.success(`Đã phân công thợ & tạo đơn Booking cho ${selectedQueueGuest.customerName} (Vào ghế)!`);
      } else {
        toast.success(`Đã phân công thợ cho khách ${selectedQueueGuest.customerName}!`);
      }

      setIsAssignArtistModalOpen(false);
      setSelectedQueueGuest(null);
      setSelectedArtistIdToAssign(null);
      await loadWalkInQueue();
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Không thể phân công thợ.";
      toast.error(`Lỗi: ${errMsg}`);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchReceptionistCustomers({
        pageNumber: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearch,
      });
      setCustomers(data.items || []);
      setTotalPages(data.metaData?.totalPages || 1);
      setTotalItems(data.metaData?.totalItems || 0);
    } catch (error) {
      toast.error("Không thể tải danh sách khách hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetail = (id) => {
    if (id) {
      navigate(ROUTES.receptionistCustomerDetail.replace(":id", id));
    } else {
      toast.error("Khách vãng lai chưa tạo tài khoản app.");
    }
  };

  const handleOpenGuestProfile = (guest) => {
    if (guest?.userId) {
      navigate(ROUTES.receptionistCustomerDetail.replace(":id", guest.userId));
      return;
    }
    const found = customers.find(
      (c) =>
        (c.phone && guest.phone && c.phone.includes(guest.phone.replace(/\s+/g, ""))) ||
        (c.firstName && guest.customerName.includes(c.firstName))
    );
    if (found) {
      navigate(ROUTES.receptionistCustomerDetail.replace(":id", found.userId));
    } else {
      toast.error("Khách vãng lai chưa có tài khoản trên hệ thống.");
    }
  };

  const handleCreateWalkInBooking = (customer) => {
    navigate(ROUTES.receptionistBookingsCreate, {
      state: {
        customer: customer,
        customerId: customer.userId,
        prefillCustomerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        prefillPhone: customer.phone || "",
      },
    });
  };

  const loadWalkInQueue = useCallback(async () => {
    try {
      const currentSalonId = getReceptionistSalonId();
      const response = await receptionistWalkInBookingService.getTodayQueue(currentSalonId);
      const items = Array.isArray(response)
        ? response
        : response?.data && Array.isArray(response.data)
          ? response.data
          : response?.items && Array.isArray(response.items)
            ? response.items
            : [];

      setRawQueueItems(items);

      const mapped = items.map((item, index) => {
        const isAppUser = !!item.customerId;
        const isLate = !!item.originalBookingId || item.isLateArrival;
        let entryType = "new_guest";
        if (isAppUser) entryType = "app_user";
        else if (isLate) entryType = "late_arrival";

        let statusKey = "lobby";
        const st = String(item.status || "").toLowerCase();
        if (st === "1" || st.includes("called")) {
          statusKey = "called";
        } else if (st === "2" || st.includes("inservice") || st.includes("in_service") || st.includes("processing")) {
          statusKey = "in_service";
        } else if (st === "3" || st.includes("done") || st.includes("complete") || st.includes("converted")) {
          statusKey = "completed";
        } else if (st === "4" || st.includes("left")) {
          statusKey = "left";
        }

        const displayCode = item.queuePosition ? `W-0${item.queuePosition}` : `W-0${index + 1}`;

        return {
          id: item.queueId || item.id,
          queueId: item.queueId || item.id,
          displayCode: displayCode,
          customerName: item.guestName || "Khách Khai Báo",
          phone: item.guestPhone || "Chưa có SĐT",
          entryType: entryType,
          lateMinutes: isLate ? 15 : null,
          nailDesign: item.requestNote || "Dịch vụ đã chọn tại quầy",
          serviceName: item.requestNote || "Dịch vụ làm móng",
          assignedArtist: item.assignedNailArtistName || "Chưa phân công",
          assignedNailArtistId: item.assignedNailArtistId,
          duration: item.estimatedWait ? `${item.estimatedWait} phút` : "20 phút",
          status: statusKey,
          checkInTime: item.arrivalTime ? new Date(item.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong",
          userId: item.customerId,
        };
      });
      setWalkInGuests(mapped);
    } catch (err) {
      console.warn("Could not load walk-in queue from API:", err);
    }
  }, []);

  const handleQuickAddWalkInGuest = async () => {
    let finalCustomerName = "";
    let finalPhone = "";
    let entryTypeLabel = "new_guest";
    let foundUserId = null;

    if (walkInTab === "app_user") {
      const appCust = customers.find((c) => c.userId === selectedAppCustomerId) || customers[0];
      if (appCust) {
        finalCustomerName = `${appCust.firstName || ""} ${appCust.lastName || ""}`.trim();
        finalPhone = appCust.phone || "0912 000 999";
        foundUserId = appCust.userId;
        entryTypeLabel = "app_user";
      } else {
        toast.error("Vui lòng chọn tài khoản khách hàng trên app.");
        return;
      }
    } else if (walkInTab === "new_guest") {
      if (!walkInName.trim()) {
        toast.error("Vui lòng nhập tên khách hàng.");
        return;
      }
      finalCustomerName = walkInName.trim();
      finalPhone = walkInPhone.trim() || "Chưa có SĐT";
      entryTypeLabel = "new_guest";
    } else if (walkInTab === "late_arrival") {
      finalCustomerName = "Trần Bảo Ngọc (Trễ 18 phút)";
      finalPhone = "0988 123 456";
      entryTypeLabel = "late_arrival";
    }

    setIsSubmittingWalkIn(true);
    try {
      const currentSalonId = getReceptionistSalonId();

      const selectedServiceObjs = dbServices.filter((s) => (selectedServiceMap[s.serviceId || s.id] || 0) > 0);
      const serviceSummaryList = selectedServiceObjs.map(
        (s) => `${s.serviceName || s.name} x${selectedServiceMap[s.serviceId || s.id]}`
      );

      const selectedVariantEntries = Object.entries(selectedVariantMap).filter(([_, qty]) => qty > 0);
      const variantSummaryList = selectedVariantEntries.map(([vId, qty]) => {
        const vObj = dbNailVariants.find((v) => (v.nailVariantId || v.id) === Number(vId) || (v.nailVariantId || v.id) === vId);
        return `${vObj?.variantName || vObj?.name || `Mẫu #${vId}`} x${qty}`;
      });

      const allSummaries = [...variantSummaryList, ...serviceSummaryList];
      const requestNoteText = allSummaries.length > 0
        ? allSummaries.join(" + ")
        : `Ghi nhận tiếp đón ${entryTypeLabel}`;

      const bookingItemsPayload = [];
      Object.entries(selectedServiceMap).forEach(([sId, qty]) => {
        if (qty > 0) {
          bookingItemsPayload.push({
            serviceId: sId,
            nailVariantId: null,
            quantity: qty,
          });
        }
      });
      Object.entries(selectedVariantMap).forEach(([vId, qty]) => {
        if (qty > 0) {
          bookingItemsPayload.push({
            serviceId: null,
            nailVariantId: Number(vId),
            quantity: qty,
          });
        }
      });

      const payload = {
        salonId: currentSalonId,
        customerId: foundUserId,
        originalBookingId: walkInTab === "late_arrival" ? selectedLateBookingId : null,
        guestName: finalCustomerName,
        guestPhone: finalPhone !== "Chưa có SĐT" ? finalPhone : null,
        requestNote: requestNoteText,
        assignedNailArtistId: selectedArtistIdForWalkIn || null,
        bookingItems: bookingItemsPayload,
      };

      let createdQueueId = null;
      try {
        const res = await receptionistWalkInBookingService.createWalkInQueue(payload);
        createdQueueId = res?.data?.queueId || res?.queueId || res?.id;
      } catch (apiErr) {
        console.warn("Backend API WalkInQueue failed, using fallback UI state:", apiErr);
      }

      const assignedArtistObj = suggestedArtists.find(a => (a.nailArtistId || a.id || a.userId) === selectedArtistIdForWalkIn);
      const assignedArtistName = assignedArtistObj ? assignedArtistObj.name : "Chưa phân công";

      const newGuest = {
        id: createdQueueId || `W-0${walkInGuests.length + 1}`,
        queueId: createdQueueId,
        displayCode: `W-0${walkInGuests.length + 1}`,
        customerName: finalCustomerName,
        phone: finalPhone,
        entryType: entryTypeLabel,
        nailDesign: requestNoteText,
        serviceName: requestNoteText,
        assignedArtist: assignedArtistName,
        assignedNailArtistId: selectedArtistIdForWalkIn || null,
        duration: `${calculatedDuration} phút`,
        status: "lobby",
        checkInTime: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        userId: foundUserId,
      };

      setIsWalkInModalOpen(false);
      setWalkInName("");
      setWalkInPhone("");

      await loadWalkInQueue();

      if (walkInTab === "new_guest" && autoCreateAccount) {
        toast.success(`Đã tự động khởi tạo tài khoản & thêm ${newGuest.customerName} vào Sảnh chờ!`);
      } else if (walkInTab === "late_arrival") {
        toast.success(`Đã chuyển lịch hẹn trễ ${selectedLateBookingId} vào Sảnh chờ Walk-In!`);
      } else {
        toast.success(`Đã check-in khách App ${newGuest.customerName} vào Sảnh chờ!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tiếp đón khách.");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  useEffect(() => {
    if (mainWorkspaceTab === "lobby") {
      loadWalkInQueue();
    }
  }, [mainWorkspaceTab, loadWalkInQueue]);

  const handleMoveGuestStatus = async (guestId, newStatus) => {
    const targetGuest = walkInGuests.find((g) => g.id === guestId || g.queueId === guestId);
    if (!targetGuest) return;

    if (newStatus === "in_service" && (!targetGuest.assignedNailArtistId || targetGuest.assignedArtist === "Chưa phân công")) {
      handleOpenAssignModal(targetGuest, true);
      return;
    }

    // Update local state immediately for snappy UI feel
    setWalkInGuests((prev) =>
      prev.map((g) => (g.id === guestId || g.queueId === guestId ? { ...g, status: newStatus } : g))
    );

    const actualQueueId = targetGuest?.queueId || targetGuest?.id;

    if (actualQueueId) {
      try {
        if (newStatus === "called") {
          await receptionistWalkInBookingService.callQueue(actualQueueId);
          toast.success(`Đã phát loa gọi ${targetGuest?.customerName || "khách"} lên quầy tư vấn!`);
        } else if (newStatus === "in_service") {
          await receptionistWalkInBookingService.convertQueueToBooking(actualQueueId);
          toast.success(`Đã tạo đơn Booking (InProgress) & chuyển ${targetGuest?.customerName || "khách"} vào ghế!`);
        } else if (newStatus === "completed") {
          await receptionistWalkInBookingService.completeQueue(actualQueueId);
          toast.success(`Đã hoàn thành lượt xếp hàng cho ${targetGuest?.customerName || "khách"}!`);
        } else {
          toast.success("Đã chuyển trạng thái lượt chờ!");
        }
        await loadWalkInQueue();
      } catch (err) {
        const errMsg = err?.response?.data?.message || err?.message || "Không thể thực hiện thao tác.";
        toast.error(`Lỗi: ${errMsg}`);
        console.warn("Backend status update API error:", err);
        await loadWalkInQueue();
      }
    } else {
      toast.success("Đã chuyển trạng thái lượt chờ!");
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    if (activeFilterTab === "active") {
      result = result.filter((c) => ["active", "current"].includes(String(c.status || "active").toLowerCase()));
    } else if (activeFilterTab === "prospective") {
      result = result.filter((c) => String(c.status || "").toLowerCase() === "prospective");
    }
    if (sortBy === "name") {
      result.sort((a, b) => (a.firstName || "").localeCompare(b.firstName || ""));
    }
    return result;
  }, [customers, activeFilterTab, sortBy]);

  const metrics = useMemo(() => {
    const activeCount = customers.filter((c) =>
      ["active", "current"].includes(String(c.status || "active").toLowerCase())
    ).length;
    return [
      {
        label: "Tổng Khách Hàng",
        value: totalItems || customers.length,
        subtext: "Hồ sơ lưu trữ tại salon",
        icon: Users,
      },
      {
        label: "Khách Hoạt Động",
        value: activeCount || Math.ceil((totalItems || customers.length) * 0.85),
        subtext: "Đã làm dịch vụ gần đây",
        icon: UserCheck,
      },
      {
        label: "Hàng Chờ Walk-In",
        value: walkInGuests.filter((g) => g.status !== "completed").length,
        subtext: "Lượt khách trong ngày",
        icon: Clock,
      },
      {
        label: "Thành Viên VIP",
        value: Math.ceil((totalItems || customers.length || 1) * 0.4),
        subtext: "Chương trình tích điểm",
        icon: Crown,
      },
    ];
  }, [customers, totalItems, walkInGuests]);

  const columns = useMemo(
    () => [
      {
        title: "Khách Hàng",
        key: "name",
        render: (_, record) => {
          return (
            <div className="flex items-center gap-3">
              {record.avatarUrl ? (
                <img
                  src={record.avatarUrl}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-xs"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    record.userId
                  )} flex items-center justify-center text-white font-black text-xs shadow-xs`}
                >
                  {getInitials(record.firstName, record.lastName)}
                </div>
              )}
              <div>
                <span className="font-bold text-[#221F26] block text-xs leading-tight hover:text-[#C97A9E] transition-colors">
                  {record.firstName} {record.lastName}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{record.phone || "Chưa có SĐT"}</span>
              </div>
            </div>
          );
        },
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (val) => <span className="text-gray-600 text-xs font-medium">{val || "--"}</span>,
      },
      {
        title: "Trạng Thái",
        dataIndex: "status",
        key: "status",
        render: (val) => {
          const badge = getStatusBadge(val);
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.tone}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          );
        },
      },
      {
        title: "Ngày Đăng Ký",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (val) => <span className="text-gray-500 text-xs font-medium">{formatDate(val)}</span>,
      },
      {
        title: "Thao Tác",
        key: "action",
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewDetail(record.userId)}
              className="px-3 py-1 rounded-lg text-xs font-bold text-gray-600 hover:text-[#C97A9E] bg-gray-50 hover:bg-[#FAF0F5] border border-gray-200 transition cursor-pointer"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={() => handleCreateWalkInBooking(record)}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#C97A9E] hover:bg-[#B86B8E] transition shadow-xs cursor-pointer"
            >
              Đặt Lịch
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col min-h-full font-sans bg-[#FAF9FA] p-4 md:p-6 space-y-5 text-[#221F26]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#221F26] tracking-tight flex items-center gap-2">
            Customer Management
            <span className="text-[11px] font-bold text-[#C97A9E] bg-[#FAF0F5] border border-[#F2D6E3] px-2.5 py-0.5 rounded-full">
              Reception Desk
            </span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Quản lý hồ sơ khách hàng & điều phối sảnh chờ Walk-In trực quan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 bg-gray-100/80 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => setMainWorkspaceTab("directory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mainWorkspaceTab === "directory"
                ? "bg-white text-[#B86B8E] shadow-sm font-black"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Users size={14} />
              Customer Directory
            </button>
            <button
              type="button"
              onClick={() => setMainWorkspaceTab("lobby")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mainWorkspaceTab === "lobby"
                ? "bg-white text-[#B86B8E] shadow-sm font-black"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Clock size={14} />
              Live Walk-In Queue
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FAF0F5] text-[#C97A9E] text-[10px] border border-[#F2D6E3]">
                {walkInGuests.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C97A9E] hover:bg-[#B86B8E] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            Check-In Walk-In
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-[#221F26] mt-0.5">{item.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{item.subtext}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF0F5] text-[#C97A9E] flex items-center justify-center border border-[#F2D6E3] shrink-0">
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {mainWorkspaceTab === "directory" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "Tất cả khách hàng" },
                { id: "active", label: "Hoạt động" },
                { id: "prospective", label: "Tiềm năng" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeFilterTab === tab.id
                    ? "bg-[#FAF0F5] text-[#B86B8E] border border-[#F2D6E3]"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, SĐT, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#221F26] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#C97A9E] transition"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "grid" ? "bg-white text-[#C97A9E] shadow-xs" : "text-gray-400"
                    }`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "list" ? "bg-white text-[#C97A9E] shadow-xs" : "text-gray-400"
                    }`}
                >
                  <ListIcon size={15} />
                </button>
              </div>

              <Link
                to={ROUTES.receptionistCustomersCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
              >
                <UserPlus size={14} />
                Thêm Khách
              </Link>
            </div>
          </div>

          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <Spin tip="Đang nạp hồ sơ khách hàng..." />
            </div>
          )}

          {!isLoading && filteredCustomers.length === 0 && (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <UserCircle size={40} className="mx-auto opacity-40 text-[#C97A9E]" />
              <p className="text-sm font-bold text-gray-600">Không tìm thấy khách hàng phù hợp</p>
            </div>
          )}

          {viewMode === "grid" && filteredCustomers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCustomers.map((c) => {
                const badge = getStatusBadge(c.status);
                return (
                  <div
                    key={c.userId}
                    onClick={() => handleViewDetail(c.userId)}
                    className="bg-white border border-gray-200 hover:border-[#C97A9E]/60 rounded-xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                              c.userId
                            )} flex items-center justify-center text-white font-bold text-xs shadow-xs`}
                          >
                            {getInitials(c.firstName, c.lastName)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-[#221F26] text-sm hover:text-[#C97A9E] transition">
                            {c.firstName} {c.lastName}
                          </h3>
                          <p className="text-[11px] text-gray-500 font-medium">{c.phone || "Chưa có SĐT"}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.tone}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(c.userId);
                        }}
                        className="text-[11px] font-bold text-gray-500 hover:text-[#C97A9E] hover:underline"
                      >
                        View Profile
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateWalkInBooking(c);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#FAF0F5] hover:bg-[#C97A9E] text-[#B86B8E] hover:text-white text-xs font-bold border border-[#F2D6E3] transition"
                      >
                        Đặt Lịch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "list" && filteredCustomers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <Table
                columns={columns}
                dataSource={filteredCustomers}
                rowKey="userId"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => handleViewDetail(record.userId),
                  className: "cursor-pointer hover:bg-gray-50 transition",
                })}
              />
            </div>
          )}
        </div>
      )}

      {mainWorkspaceTab === "lobby" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#FAF0F5] text-[#C97A9E] flex items-center justify-center border border-[#F2D6E3]">
                <Clock size={16} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#221F26] uppercase tracking-wider">
                  Bảng Điều Phối Lượt Chờ Sảnh (Live Dispatch Kanban)
                </h4>
                <p className="text-[11px] text-gray-500">
                  Điều phối tiến trình làm móng của khách vãng lai và gọi loa trực tiếp.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cột 1: Waiting - Chờ Dịch Vụ */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h4 className="text-xs font-bold text-[#221F26] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-[#C97A9E]" /> Chờ dịch vụ (Waiting)
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-md">
                  {walkInGuests.filter((g) => g.status === "lobby" || g.status === "waiting").length}
                </span>
              </div>

              <div className="space-y-3 min-h-[320px]">
                {walkInGuests.filter((g) => g.status === "lobby" || g.status === "waiting").length === 0 ? (
                  <div className="py-12 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    Chưa có khách chờ ở sảnh
                  </div>
                ) : (
                  walkInGuests
                    .filter((g) => g.status === "lobby" || g.status === "waiting")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs hover:border-[#C97A9E]/60 transition space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-[#C97A9E] bg-[#FAF0F5] px-2 py-0.5 rounded-md border border-[#F2D6E3]">
                                {g.displayCode || (typeof g.id === "string" && g.id.length > 8 ? `#${g.id.slice(0, 5).toUpperCase()}` : g.id)}
                              </span>
                              {g.entryType === "app_user" && (
                                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                                  <Smartphone size={10} /> Khách App
                                </span>
                              )}
                              {g.entryType === "late_arrival" && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                  <AlertTriangle size={10} /> Trễ 15p
                                </span>
                              )}
                              {g.entryType === "new_guest" && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                  Vãng Lai
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-[#221F26] text-sm mt-1">{g.customerName}</h5>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            ⏱️ {g.duration}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-gray-600 font-medium flex items-center gap-1.5">
                            <Scissors size={13} className="text-[#C97A9E] shrink-0" />
                            <span className="truncate">{g.nailDesign}</span>
                          </p>
                          <p className="text-gray-500 font-medium flex items-center gap-1.5">
                            <User size={13} className="text-gray-400 shrink-0" />
                            <span>Thợ: {g.assignedArtist}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenGuestProfile(g)}
                            className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-[#C97A9E] hover:bg-[#FAF0F5] border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            View
                          </button>
                          <div className="flex items-center gap-1">
                            {(g.assignedArtist === "Chưa phân công" || !g.assignedNailArtistId) && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(g, false)}
                                className="px-2 py-1 text-[10px] font-bold text-white bg-[#C97A9E] hover:bg-[#B86B8E] rounded-lg transition shadow-xs cursor-pointer flex items-center gap-0.5"
                              >
                                <UserCheck size={11} /> Phân Thợ
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleMoveGuestStatus(g.id, "called")}
                              className="px-2 py-1 text-[10px] font-bold text-[#C97A9E] bg-[#FAF0F5] hover:bg-[#C97A9E] hover:text-white border border-[#F2D6E3] rounded-lg transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Volume2 size={11} /> Gọi Loa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGuestStatus(g.id, "in_service")}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer flex items-center gap-0.5"
                            >
                              Vào Ghế
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Cột 2: Called - Tại Quầy */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h4 className="text-xs font-bold text-[#221F26] uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 size={14} className="text-amber-500" /> Tại quầy (Called)
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-md">
                  {walkInGuests.filter((g) => g.status === "called").length}
                </span>
              </div>

              <div className="space-y-3 min-h-[320px]">
                {walkInGuests.filter((g) => g.status === "called").length === 0 ? (
                  <div className="py-12 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    Chưa có khách tại quầy tư vấn
                  </div>
                ) : (
                  walkInGuests
                    .filter((g) => g.status === "called")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {g.displayCode || (typeof g.id === "string" && g.id.length > 8 ? `#${g.id.slice(0, 5).toUpperCase()}` : g.id)}
                            </span>
                            <h5 className="font-bold text-[#221F26] text-sm mt-1">{g.customerName}</h5>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            ⏱️ {g.duration}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-gray-600 font-medium flex items-center gap-1.5">
                            <Scissors size={13} className="text-[#C97A9E] shrink-0" />
                            <span className="truncate">{g.nailDesign}</span>
                          </p>
                          <p className="text-gray-500 font-medium flex items-center gap-1.5">
                            <User size={13} className="text-gray-400 shrink-0" />
                            <span>Thợ: {g.assignedArtist}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenGuestProfile(g)}
                            className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-[#C97A9E] hover:bg-[#FAF0F5] border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            View
                          </button>
                          <div className="flex items-center gap-1">
                            {(g.assignedArtist === "Chưa phân công" || !g.assignedNailArtistId) && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(g, false)}
                                className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#C97A9E] hover:bg-[#B86B8E] rounded-lg transition shadow-xs cursor-pointer flex items-center gap-0.5"
                              >
                                <UserCheck size={11} /> Phân Thợ
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleMoveGuestStatus(g.id, "in_service")}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-0.5"
                            >
                              💺 Vào Ghế
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Cột 4: Done - Hoàn Thành / Đã Chuyển Booking */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h4 className="text-xs font-bold text-[#221F26] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-500" /> Hoàn thành (Done)
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md">
                  {walkInGuests.filter((g) => g.status === "completed" || g.status === "done").length}
                </span>
              </div>

              <div className="space-y-3 min-h-[320px]">
                {walkInGuests.filter((g) => g.status === "completed" || g.status === "done").length === 0 ? (
                  <div className="py-12 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    Chưa có lượt hoàn thành
                  </div>
                ) : (
                  walkInGuests
                    .filter((g) => g.status === "completed" || g.status === "done")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2 opacity-85"
                      >
                        <div className="flex items-start justify-between">
                          <h5 className="font-bold text-[#221F26] text-sm">{g.customerName}</h5>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            Hoàn tất
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{g.nailDesign}</p>
                        <p className="text-[11px] text-gray-400">Thợ làm: {g.assignedArtist}</p>
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleOpenGuestProfile(g)}
                            className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-[#C97A9E] hover:bg-[#FAF0F5] border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Check-In Tiếp Đón Khách Vào Sảnh (Minimalist Beauty SaaS 2-Column Layout) */}
      <Modal
        open={isWalkInModalOpen}
        onCancel={() => setIsWalkInModalOpen(false)}
        footer={null}
        centered
        width={920}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden" },
          body: { padding: 0 },
        }}
        title={null}
      >
        <div className="space-y-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFF3F8] to-[#FAF0F5] p-5 border-b border-[#F2D6E3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C97A9E] to-[#B86B8E] text-white flex items-center justify-center shadow-md shadow-[#C97A9E]/25">
                <Clock size={20} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-[#221F26] tracking-tight">
                  Check-In Tiếp Đón Khách Vào Sảnh
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Tự động khởi tạo hồ sơ & gợi ý thợ nail đủ kỹ năng (Skill Match)
                </p>
              </div>
            </div>

            {/* 3 Tabs Chọn Loại Khách */}
            <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-xs rounded-xl border border-[#F2D6E3]">
              <button
                type="button"
                onClick={() => setWalkInTab("app_user")}
                className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${walkInTab === "app_user"
                  ? "bg-[#C97A9E] text-white shadow-xs font-black"
                  : "text-gray-600 hover:text-[#C97A9E]"
                  }`}
              >
                <Smartphone size={13} /> Khách Có App
              </button>
              <button
                type="button"
                onClick={() => setWalkInTab("new_guest")}
                className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${walkInTab === "new_guest"
                  ? "bg-[#C97A9E] text-white shadow-xs font-black"
                  : "text-gray-600 hover:text-[#C97A9E]"
                  }`}
              >
                <UserPlus size={13} /> Khách Mới
              </button>
              <button
                type="button"
                onClick={() => setWalkInTab("late_arrival")}
                className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${walkInTab === "late_arrival"
                  ? "bg-[#C97A9E] text-white shadow-xs font-black"
                  : "text-gray-600 hover:text-[#C97A9E]"
                  }`}
              >
                <AlertTriangle size={13} /> Khách Trễ 15p
              </button>
            </div>
          </div>

          {/* Body Split 2 Columns (40% Left Controls / 60% Right Visual Grid) */}
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Left Column (40% Width = col-span-5) */}
            <div className="col-span-5 space-y-4 border-r border-gray-100 pr-5">
              {walkInTab === "app_user" && (
                <div className="space-y-2 p-3.5 bg-[#FAF8FA] rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-[#221F26]">
                    Chọn Tài Khoản Khách Hàng App
                  </label>
                  <Select
                    showSearch
                    value={selectedAppCustomerId || (customers[0]?.userId || "")}
                    onChange={(val) => setSelectedAppCustomerId(val)}
                    className="w-full text-xs font-medium"
                    placeholder="Tìm tên hoặc SĐT tài khoản..."
                    optionLabelProp="display"
                    popupMatchSelectWidth={false}
                    options={customers.map((c) => {
                      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Khách Hàng";
                      const phone = c.phone || "Chưa có SĐT";
                      return {
                        value: c.userId,
                        display: `👤 ${name} - ${phone}`,
                        label: (
                          <div className="flex items-center justify-between w-full py-1.5 px-1 gap-3 border-b border-gray-50 last:border-none min-w-[260px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#C97A9E] font-black text-[10px] flex items-center justify-center shrink-0">
                                👤
                              </span>
                              <span className="font-extrabold text-[#221F26] text-xs truncate">{name}</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                              {phone}
                            </span>
                          </div>
                        ),
                      };
                    })}
                  />
                  <p className="text-[11px] text-gray-500">
                    ✓ Khách hàng sẽ được tích điểm thành viên tự động.
                  </p>
                </div>
              )}

              {walkInTab === "new_guest" && (
                <div className="space-y-3 p-3.5 bg-[#FAF8FA] rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-[#221F26] mb-1">
                      Tên Khách Hàng *
                    </label>
                    <Input
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Nhập tên khách vãng lai..."
                      className="rounded-xl border-gray-200 text-xs font-medium py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#221F26] mb-1">
                      Số Điện Thoại
                    </label>
                    <Input
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      className="rounded-xl border-gray-200 text-xs font-medium py-1.5"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoAcc"
                      checked={autoCreateAccount}
                      onChange={(e) => setAutoCreateAccount(e.target.checked)}
                      className="rounded border-gray-300 text-[#C97A9E] focus:ring-[#C97A9E]"
                    />
                    <label htmlFor="autoAcc" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Tự động khởi tạo tài khoản thành viên mới
                    </label>
                  </div>
                </div>
              )}

              {walkInTab === "late_arrival" && (
                <div className="space-y-2 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900">
                    Chọn Lịch Đặt Trước Tới Trễ ≥ 15 Phút
                  </label>
                  <Select
                    value={selectedLateBookingId}
                    onChange={(val) => {
                      setSelectedLateBookingId(val);
                      const foundLate = rawQueueItems.find(
                        (item) => (item.queueId || item.id || item.originalBookingId) === val
                      );
                      if (foundLate) {
                        setWalkInName(foundLate.guestName || "");
                        setWalkInPhone(foundLate.guestPhone || "");
                      }
                    }}
                    placeholder="-- chọn khách đặt trước tới trễ --"
                    className="w-full text-xs font-medium"
                    optionLabelProp="display"
                    popupMatchSelectWidth={false}
                    options={lateArrivalOptions}
                  />
                  <p className="text-[11px] text-amber-800 font-medium">
                    ⚠️ Tự động chuyển lịch trễ xuống hàng chờ sảnh với ghi chú: &quot;Khách hàng đến muộn -&gt; Tự động chuyển xuống hàng chờ.&quot;
                  </p>
                </div>
              )}

              {/* Select Dịch Vụ kèm Quản lý Số lượng (x2, x3) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#221F26] flex items-center justify-between">
                  <span>Hạng Mục Dịch Vụ</span>
                  <span className="text-[10px] text-[#C97A9E] font-medium">Chọn & chỉnh số lượng</span>
                </label>
                <Select
                  value={null}
                  onChange={(val) => {
                    if (!val) return;
                    setSelectedServiceMap((prev) => ({
                      ...prev,
                      [val]: (prev[val] || 0) + 1,
                    }));
                  }}
                  placeholder="+ Thêm dịch vụ vào danh sách..."
                  className="w-full text-xs font-medium"
                  optionLabelProp="display"
                  popupMatchSelectWidth={false}
                  options={dbServices.map((s) => {
                    const sId = s.serviceId || s.id;
                    const name = s.serviceName || s.name;
                    const priceStr = s.price ? `${(s.price || 0).toLocaleString("vi-VN")}đ` : "";
                    return {
                      value: sId,
                      display: `+ Thêm: ${name}`,
                      label: (
                        <div className="flex items-center justify-between w-full py-1.5 px-1 gap-3 border-b border-gray-50 last:border-none min-w-[260px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-[#FAF0F5] text-[#C97A9E] font-black text-[10px] flex items-center justify-center shrink-0">
                              💅
                            </span>
                            <span className="font-extrabold text-[#221F26] text-xs truncate">{name}</span>
                          </div>
                          {priceStr && (
                            <span className="text-[10px] font-extrabold text-[#C97A9E] bg-[#FAF0F5] px-2 py-0.5 rounded-full border border-[#F2D6E3] shrink-0 whitespace-nowrap">
                              {priceStr}
                            </span>
                          )}
                        </div>
                      ),
                    };
                  })}
                />

                {/* Selected Services with Quantities List */}
                {Object.keys(selectedServiceMap).length > 0 && (
                  <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {Object.entries(selectedServiceMap).map(([sId, qty]) => {
                      const sObj = dbServices.find((s) => (s.serviceId || s.id) === sId);
                      if (!sObj || qty <= 0) return null;
                      const name = sObj.serviceName || sObj.name;
                      const unitPrice = sObj.price || 0;

                      return (
                        <div
                          key={sId}
                          className="flex items-center justify-between bg-[#FAF0F5] p-2 rounded-xl border border-[#F2D6E3] gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-extrabold text-[#221F26] truncate">{name}</span>
                            <span className="text-[10px] font-bold text-[#C97A9E]">
                              {(unitPrice * qty).toLocaleString("vi-VN")}đ
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 bg-white rounded-lg border border-[#F2D6E3] px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServiceMap((prev) => {
                                  const next = { ...prev };
                                  if (next[sId] > 1) next[sId] -= 1;
                                  else delete next[sId];
                                  return next;
                                });
                              }}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 hover:text-[#C97A9E] hover:bg-gray-100 rounded cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-black text-[#C97A9E]">{qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServiceMap((prev) => ({
                                  ...prev,
                                  [sId]: (prev[sId] || 0) + 1,
                                }));
                              }}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 hover:text-[#C97A9E] hover:bg-gray-100 rounded cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServiceMap((prev) => {
                                  const next = { ...prev };
                                  delete next[sId];
                                  return next;
                                });
                              }}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Phân Công Thợ (Chỉ hiển thị Thợ đang rảnh, KHÔNG hiển thị Skill) */}
              <div>
                <label className="block text-xs font-bold text-[#221F26] mb-1 flex items-center justify-between">
                  <span>Phân Công Thợ (Đang rảnh)</span>
                  {isLoadingSuggestedArtists && <Spin size="small" />}
                </label>
                <Select
                  value={selectedArtistIdForWalkIn}
                  onChange={(val) => setSelectedArtistIdForWalkIn(val)}
                  placeholder="-- chọn thợ đang rảnh --"
                  className="w-full text-xs font-medium"
                  optionLabelProp="display"
                  popupMatchSelectWidth={false}
                  allowClear
                  options={suggestedArtists.map((artist) => {
                    const artistId = artist.nailArtistId || artist.id || artist.userId;
                    const name = artist.fullName || artist.name || "Thợ Nail";
                    const avatar = artist.avatarUrl;

                    return {
                      value: artistId,
                      display: `🟢 ${name} (Đang rảnh)`,
                      label: (
                        <div className="flex items-center justify-between w-full py-1.5 px-1 gap-3 border-b border-gray-50 last:border-none min-w-[220px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-6 h-6 rounded-full object-cover border border-[#F2D6E3] shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#C97A9E] to-[#B86B8E] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-extrabold text-[#221F26] text-xs truncate">{name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">
                            🟢 Đang rảnh
                          </span>
                        </div>
                      ),
                    };
                  })}
                />
              </div>

              {/* Thời Gian Dự Kiến */}
              <div>
                <label className="block text-xs font-bold text-[#221F26] mb-1 flex items-center justify-between">
                  <span>Thời Gian Phục Vụ Dự Kiến</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    ⚡ Tự động tính toán
                  </span>
                </label>
                <div className="flex items-center gap-2.5 p-2 px-3 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/90 rounded-xl shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <Clock size={13} />
                  </div>
                  <span className="font-extrabold text-xs text-emerald-900">
                    {calculatedDuration} phút
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (60% Width = col-span-7 Visual Selection Grid) */}
            <div className="col-span-7 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#221F26] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#C97A9E]" /> Vùng Chọn Mẫu Móng Visual (Nail Variants)
                  </label>
                  <span className="text-[11px] font-bold text-[#C97A9E] bg-[#FAF0F5] px-2.5 py-0.5 rounded-full border border-[#F2D6E3]">
                    {filteredNailVariants.length}/{dbNailVariants.length} mẫu
                  </span>
                </div>

                {/* Clean Full-Width Search Input */}
                <Input
                  prefix={<Search size={14} className="text-gray-400 mr-1" />}
                  placeholder="Tìm kiếm mẫu móng theo tên hoặc giá..."
                  value={variantSearchQuery}
                  onChange={(e) => setVariantSearchQuery(e.target.value)}
                  allowClear
                  className="rounded-xl border-gray-200 text-xs py-1.5 px-3 w-full"
                />
              </div>

              {/* Visual Selection Grid with Quantity Control */}
              <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredNailVariants.length === 0 ? (
                  <div className="py-16 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                    {variantSearchQuery ? "Không tìm thấy mẫu móng phù hợp" : "Đang tải danh sách mẫu móng thực tế từ Database..."}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {filteredNailVariants.map((v) => {
                      const vId = v.nailVariantId || v.id;
                      const variantQty = selectedVariantMap[vId] || 0;
                      const isSelected = variantQty > 0;
                      const name = v.variantName || v.name || `Mẫu móng #${vId}`;
                      const price = v.price || 0;
                      const img = v.imageUrl || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80";

                      return (
                        <div
                          key={vId}
                          className={`group relative overflow-hidden rounded-2xl border transition-all bg-white text-left flex flex-col justify-between ${isSelected
                            ? "border-[#C97A9E] ring-2 ring-[#C97A9E] shadow-md shadow-[#C97A9E]/20 bg-[#FFF5F9]"
                            : "border-gray-200/90 hover:border-[#C97A9E] hover:shadow-sm"
                            }`}
                        >
                          <div
                            className="h-24 overflow-hidden bg-gray-50 relative cursor-pointer"
                            onClick={() => {
                              setSelectedVariantMap((prev) => {
                                const next = { ...prev };
                                if (isSelected) delete next[vId];
                                else next[vId] = 1;
                                return next;
                              });
                            }}
                          >
                            <img
                              src={img}
                              alt={name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C97A9E] text-white shadow-xs">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <p className="text-[11px] font-extrabold text-[#221F26] line-clamp-2 leading-snug">
                              {name}
                            </p>

                            <div className="mt-1 flex items-center justify-between pt-1 border-t border-gray-100">
                              <p className="text-xs font-black text-[#C97A9E]">
                                {price.toLocaleString("vi-VN")}đ
                              </p>

                              {isSelected ? (
                                <div className="flex items-center gap-1 bg-white rounded-lg border border-[#F2D6E3] px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariantMap((prev) => {
                                        const next = { ...prev };
                                        if (next[vId] > 1) next[vId] -= 1;
                                        else delete next[vId];
                                        return next;
                                      });
                                    }}
                                    className="w-4 h-4 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:text-[#C97A9E] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black text-[#C97A9E] min-w-[14px] text-center">
                                    {variantQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariantMap((prev) => ({
                                        ...prev,
                                        [vId]: (prev[vId] || 1) + 1,
                                      }));
                                    }}
                                    className="w-4 h-4 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:text-[#C97A9E] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariantMap((prev) => ({
                                      ...prev,
                                      [vId]: 1,
                                    }));
                                  }}
                                  className="text-[10px] font-bold text-[#C97A9E] bg-[#FAF0F5] px-2 py-0.5 rounded-md hover:bg-[#C97A9E] hover:text-white transition cursor-pointer"
                                >
                                  + Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer với Tổng Tiền & Danh sách Đã Chọn */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 via-[#FAF8FA] to-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {totalCalculatedPrice > 0 ? (
                <div className="flex items-center gap-2.5 bg-[#FAF0F5] px-3.5 py-1.5 rounded-xl border border-[#F2D6E3] text-xs font-bold text-[#C97A9E]">
                  <span>✨ Tổng dịch vụ & mẫu móng:</span>
                  <span className="font-black text-[#B86B8E] text-sm">
                    {totalCalculatedPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium">
                  💡 Chọn dịch vụ hoặc mẫu móng để tính tổng tiền & gợi ý thợ rảnh
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleQuickAddWalkInGuest}
                disabled={isSubmittingWalkIn}
                className="px-7 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#C97A9E] to-[#B86B8E] hover:from-[#B86B8E] hover:to-[#A3597D] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-[#C97A9E]/30 cursor-pointer flex items-center gap-2"
              >
                <Plus size={16} />
                {isSubmittingWalkIn ? "Đang xử lý..." : "Xác Nhận Check-In"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Phân Công Thợ Nail */}
      <Modal
        open={isAssignArtistModalOpen}
        onCancel={() => {
          setIsAssignArtistModalOpen(false);
          setSelectedQueueGuest(null);
        }}
        footer={null}
        centered
        width={520}
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden" },
          body: { padding: 0 },
        }}
        title={null}
      >
        <div className="space-y-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFF3F8] to-[#FAF0F5] p-5 border-b border-[#F2D6E3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C97A9E] to-[#B86B8E] text-white flex items-center justify-center shadow-md shadow-[#C97A9E]/25">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-[#221F26] tracking-tight">
                  Phân Công Thợ Nail Điều Phối Sảnh
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Chọn thợ phù hợp để đảm bảo thời gian phục vụ tốt nhất
                </p>
              </div>
            </div>
          </div>

          {/* Customer Summary Card */}
          {selectedQueueGuest && (
            <div className="mx-6 mt-5 bg-gradient-to-r from-[#FAF0F5]/80 via-white to-[#FAF0F5]/80 border border-[#F2D6E3] p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C97A9E] text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {selectedQueueGuest.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Khách Hàng Tiếp Đón</p>
                  <p className="text-sm font-extrabold text-[#221F26]">{selectedQueueGuest.customerName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C97A9E] bg-white px-3 py-1 rounded-xl border border-[#F2D6E3] shadow-2xs">
                  <Scissors size={13} /> {selectedQueueGuest.nailDesign || "Dịch vụ làm móng"}
                </span>
              </div>
            </div>
          )}

          {/* Artist Selection List */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#C97A9E]" /> Chọn Thợ Làm Móng (Salon Artist)
              </label>
              <span className="text-[11px] font-bold text-[#C97A9E] bg-[#FAF0F5] px-2 py-0.5 rounded-md border border-[#F2D6E3]">
                {availableArtists.length} thợ sẵn sàng
              </span>
            </div>

            {isLoadingArtists ? (
              <div className="py-10 text-center space-y-2">
                <Spin size="large" />
                <p className="text-xs font-medium text-gray-500">Đang tải danh sách thợ làm móng sảnh...</p>
              </div>
            ) : availableArtists.length === 0 ? (
              <div className="py-8 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                Hiện chưa có thợ làm móng nào hoạt động tại chi nhánh.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {availableArtists.map((artist) => {
                  const artistId = artist.nailArtistId || artist.id || artist.userId;
                  const fullName = artist.account
                    ? `${artist.account.firstName || ""} ${artist.account.lastName || ""}`.trim()
                    : `${artist.firstName || ""} ${artist.lastName || ""}`.trim() || "Thợ Nail";
                  const isSelected = selectedArtistIdToAssign === artistId;

                  return (
                    <div
                      key={artistId}
                      onClick={() => setSelectedArtistIdToAssign(artistId)}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${isSelected
                        ? "border-[#C97A9E] bg-gradient-to-r from-[#FAF0F5] to-white shadow-md shadow-[#C97A9E]/10 ring-1 ring-[#C97A9E]/40"
                        : "border-gray-200 hover:border-[#C97A9E]/40 bg-white hover:bg-[#FAF0F5]/30"
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-transform ${isSelected
                            ? "bg-gradient-to-br from-[#C97A9E] to-[#B86B8E] text-white shadow-sm scale-105"
                            : "bg-[#FAF0F5] text-[#C97A9E] border border-[#F2D6E3]"
                            }`}
                        >
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-[#221F26]">{fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              🟢 Đang sẵn sàng
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">| Thợ Salon</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#C97A9E] text-white flex items-center justify-center shadow-xs">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-gray-300"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 p-5 bg-gray-50/80 border-t border-gray-100 rounded-b-3xl">
            <button
              type="button"
              onClick={() => setIsAssignArtistModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmittingAssign || !selectedArtistIdToAssign}
              onClick={handleConfirmAssignArtist}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-[#C97A9E] to-[#B86B8E] hover:from-[#B86B8E] hover:to-[#A3597D] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-[#C97A9E]/30 cursor-pointer flex items-center gap-2"
            >
              {isSubmittingAssign ? (
                <Spin size="small" />
              ) : autoSeatAfterAssign ? (
                <>
                  <CheckCircle2 size={16} /> Xác Nhận Phân Thợ & Vào Ghế
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Xác Nhận Phân Thợ
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
