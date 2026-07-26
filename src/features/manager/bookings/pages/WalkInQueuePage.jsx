import {
  Users,
  Clock,
  Phone,
  User,
  Plus,
  Play,
  RotateCw,
  Award,
  Search,
  Check,
  AlertCircle,
  XCircle,
  HelpCircle,
  ArrowUp,
  Sparkles,
  Volume2,
  ChevronRight,
  ShieldAlert,
  Activity,
  Calendar,
  LayoutGrid,
  TrendingUp,
  Sparkle,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Drawer, Spin, Input, Select, Button, Alert, Popover, message, Modal, Tag } from "antd";
import dayjs from "dayjs";
import { loadAuthSession } from "../../../core/auth/model/authStorage";
import { fetchSalonStaff } from "../services/bookingsService";
import { fetchServiceCatalog } from "../../../staff/bookings/services/staffBookingService";
import {
  fetchTodayQueue,
  addToQueue,
  callQueueEntry,
  assignArtistToQueue,
  completeQueueEntry,
  markQueueEntryLeft,
  prioritizeQueueEntry,
} from "../services/walkInQueueService";

// Helper to load current user's salonId
const getSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

// Queue status definitions and metadata
const STATUS_META = {
  Waiting: { label: "Waiting", color: "#d89b1d", bg: "bg-[#fffdf9] text-[#d89b1d] border-[#fbe9c7]" },
  Called: { label: "At Counter", color: "#3b82f6", bg: "bg-[#fffdf9] text-[#3b82f6] border-[#d2e4f7]" },
  InService: { label: "In Service", color: "#22a06b", bg: "bg-[#fffdf9] text-[#22a06b] border-[#c8ebd3]" },
  Done: { label: "Completed", color: "#5b6472", bg: "bg-[#fffdf9] text-[#5b6472] border-[#e0e0e0]" },
  Left: { label: "Absent / Left", color: "#e56b6f", bg: "bg-[#fffdf9] text-[#e56b6f] border-[#fbc9c9]" },
};

// Standard timeline time slots for calendar view (08:00 - 21:00)
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export function WalkInQueuePage() {
  const [queueData, setQueueData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [error, setError] = useState("");

  // View switch: "kanban" (default) or "timeline"
  const [viewMode, setViewMode] = useState("kanban");

  // Drawer / Modal states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);

  // Form states
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isLateArrival, setIsLateArrival] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [searchServiceQuery, setSearchServiceQuery] = useState("");

  // Search in Dashboard
  const [searchQuery, setSearchQuery] = useState("");
  const [callingState, setCallingState] = useState(null);

  // Active Dragging Item ID (for CSS highlight styling)
  const [draggingItemId, setDraggingItemId] = useState(null);

  const salonId = getSalonId();

  // Load active queue data
  const loadQueue = useCallback(async () => {
    if (!salonId) {
      setError("Salon ID is not configured. Please log in again.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchTodayQueue(salonId);
      setQueueData(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load walk-in queue data.");
    } finally {
      setIsLoading(false);
    }
  }, [salonId]);

  // Load salon staff
  const loadStaff = useCallback(async () => {
    if (!salonId) return;
    setIsStaffLoading(true);
    try {
      const staff = await fetchSalonStaff(salonId, { role: "Staff_Artist" });
      setStaffList(staff || []);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setIsStaffLoading(false);
    }
  }, [salonId]);

  // Load services catalog
  const loadServices = useCallback(async () => {
    setIsServicesLoading(true);
    try {
      const result = await fetchServiceCatalog({ pageNumber: 1, pageSize: 100 });
      setServicesList(result?.items || []);
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setIsServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadStaff();
    loadServices();
  }, [loadQueue, loadStaff, loadServices]);

  // Speech Synthesizer for Audio Calling
  const speakCalling = (ticketNumber, customerName) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const messageText = `Calling customer number ${ticketNumber}, ${customerName}, VNDến quầy lễ tân VNDể nhận phục vụ.`;
      const utterance = new SpeechSynthesisUtterance(messageText);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Drag & Drop event handlers
  const handleDragStart = (e, item) => {
    setDraggingItemId(item.queueId);
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle column drops in Kanban Board
  const handleKanbanDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggingItemId(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);

      if (item.status === targetStatus) return;

      if (targetStatus === "Called") {
        await handleCall(item);
      } else if (targetStatus === "InService") {
        if (!item.assignedNailArtistId) {
          // Open staff assignment popup if no artist is assigned yet
          setSelectedQueueItem(item);
          setIsAssignModalOpen(true);
        } else {
          await handleCompleteCheckin(item.queueId);
        }
      } else if (targetStatus === "Done") {
        await completeQueueEntry(item.queueId);
        message.success(`Đã VNDánh dấu hoàn thành lượt của ${item.guestName || "Guest"}`);
        loadQueue();
      } else if (targetStatus === "Left") {
        await handleMarkLeft(item.queueId);
      } else if (targetStatus === "Waiting") {
        message.info("Moved back to lobby successfully.");
      }
    } catch (err) {
      message.error(err.message || "Không thể thực hiện thao tác kéo thả.");
    }
  };

  // Handle artist row drops in Calendar View
  const handleArtistTimelineDrop = async (e, artistId) => {
    e.preventDefault();
    setDraggingItemId(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);

      if (artistId === "unassigned") {
        message.warning("Không thể bỏ gán thợ trực tiếp. Vui lòng VNDổi thợ.");
        return;
      }

      if (item.assignedNailArtistId === artistId) return;

      await assignArtistToQueue(item.queueId, artistId);
      message.success(`Assigned artist successfully.`);
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to assign artist.");
    }
  };

  // Call Customer API
  const handleCall = async (item) => {
    try {
      setCallingState(item);
      speakCalling(item.queuePosition, item.guestName || "Walk-in guest");
      await callQueueEntry(item.queueId);
      message.success(`Called queue number ${item.queuePosition}`);
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to call queue number.");
    }
  };

  // Prioritize Entry API
  const handlePrioritize = async (id) => {
    try {
      await prioritizeQueueEntry(id);
      message.success("Đã VNDẩy guests hàng lên VNDầu hàng chờ.");
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to prioritize customer.");
    }
  };

  // Mark Left API
  const handleMarkLeft = async (id) => {
    try {
      await markQueueEntryLeft(id);
      message.warning("Đã VNDánh dấu guests hàng rời hàng chờ.");
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to update status.");
    }
  };

  // Open Assign Artist Modal
  const openAssignArtist = (item) => {
    setSelectedQueueItem(item);
    setIsAssignModalOpen(true);
  };

  // Assign Artist API
  const handleAssignArtist = async (artistId) => {
    if (!selectedQueueItem) return;
    try {
      await assignArtistToQueue(selectedQueueItem.queueId, artistId);
      message.success("Assigned artist to customer.");
      setIsAssignModalOpen(false);
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to assign artist.");
    }
  };

  // Complete Check-in / Start Service API
  const handleCompleteCheckin = async (id) => {
    try {
      await completeQueueEntry(id);
      message.success("Đã hoàn thành lượt xếp hàng. Guest hàng bắt VNDầu dịch vụ.");
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to complete queue turn.");
    }
  };

  // Create Walk-in Queue Entry API
  const handleCreateQueueEntry = async () => {
    if (!guestName.trim()) {
      message.error("Please enter customer name.");
      return;
    }

    const payload = {
      salonId,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim() || null,
      isLateArrival,
      requestNote: requestNote.trim() || null,
      assignedNailArtistId: selectedArtistId || null,
      bookingItems: selectedServices.map((srv) => ({
        serviceId: srv.serviceId,
        quantity: 1,
      })),
    };

    try {
      await addToQueue(payload);
      message.success("Đã VNDăng ký guests hàng vào hàng chờ thành công!");
      setIsAddDrawerOpen(false);
      resetForm();
      loadQueue();
    } catch (err) {
      message.error(err.message || "Failed to register queue.");
    }
  };

  const resetForm = () => {
    setGuestName("");
    setGuestPhone("");
    setIsLateArrival(false);
    setRequestNote("");
    setSelectedServices([]);
    setSelectedArtistId(null);
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices((current) =>
      current.some((s) => s.serviceId === service.serviceId)
        ? current.filter((s) => s.serviceId !== service.serviceId)
        : [...current, service]
    );
  };

  // Filter service catalog
  const filteredServices = useMemo(() => {
    const query = searchServiceQuery.toLowerCase().trim();
    if (!query) return servicesList;
    return servicesList.filter((s) => s.name.toLowerCase().includes(query));
  }, [servicesList, searchServiceQuery]);

  // Filtered Queue Data based on query
  const filteredQueue = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return queueData;
    return queueData.filter(
      (item) =>
        item.guestName?.toLowerCase().includes(q) ||
        item.guestPhone?.includes(q)
    );
  }, [queueData, searchQuery]);

  // Partition queue items by status for Kanban Board
  const waitingEntries = useMemo(() => filteredQueue.filter((item) => item.status === "Waiting"), [filteredQueue]);
  const calledEntries = useMemo(() => filteredQueue.filter((item) => item.status === "Called"), [filteredQueue]);
  const inServiceEntries = useMemo(() => filteredQueue.filter((item) => item.status === "InService"), [filteredQueue]);
  const doneEntries = useMemo(() => filteredQueue.filter((item) => item.status === "Done"), [filteredQueue]);
  const leftEntries = useMemo(() => filteredQueue.filter((item) => item.status === "Left"), [filteredQueue]);

  // Statistics calculation
  const stats = useMemo(() => {
    const waiting = queueData.filter((i) => i.status === "Waiting").length;
    const called = queueData.filter((i) => i.status === "Called").length;
    const servicing = queueData.filter((i) => i.status === "InService").length;
    const done = queueData.filter((i) => i.status === "Done").length;

    // Average wait time
    const activeWaitTimes = queueData
      .filter((i) => i.status === "Waiting" && i.estimatedWait)
      .map((i) => i.estimatedWait);
    const avgWait = activeWaitTimes.length
      ? Math.round(activeWaitTimes.reduce((a, b) => a + b, 0) / activeWaitTimes.length)
      : 15;

    return { waiting, called, servicing, done, avgWait };
  }, [queueData]);

  // Find latest called customer for marquee/billboard
  const lastCalledEntry = useMemo(() => {
    const calledItems = queueData.filter((i) => i.status === "Called");
    if (!calledItems.length) return null;
    return [...calledItems].sort((a, b) => dayjs(b.calledTime).diff(dayjs(a.calledTime)))[0];
  }, [queueData]);

  // Map queue entries to hours of the day for calendar visualization
  const getEntryHour = (entry) => {
    const targetTime = entry.serviceStartTime || entry.calledTime || entry.arrivalTime;
    return dayjs(targetTime).format("HH:00");
  };

  const totalEstDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalEstPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <section className="flex min-h-full flex-col gap-6 bg-[#f7f4ef] text-[#2f2430] p-6 pb-12">

      {/* UNIFIED HEADER & STATS BLOCK */}
      <div className="flex flex-col gap-6 rounded-3xl border border-[#e2e8f0] bg-[#fffdf9] p-6 shadow-sm">

        {/* Row 1: Title and Actions */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-xl font-black text-[#2f2430] tracking-tight flex items-center gap-2">
              Salon Lobby Queue
              <Sparkle size={16} className="text-[#e85d9b] fill-[#e85d9b] animate-spin" style={{ animationDuration: '6s' }} />
            </h1>
            <p className="text-[11px] text-[#7d6d78] mt-1 font-semibold max-w-xl">
              Coordinate service order and quickly assign nail artists for daily walk-in customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-[#f5f1ed] p-1 border border-[#e2e8f0]">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "kanban"
                  ? "bg-[#fffdf9] text-[#e85d9b] shadow-sm font-extrabold"
                  : "text-[#7d6d78] hover:text-[#e85d9b]"
                  }`}
              >
                <LayoutGrid size={13} />
                Drag-and-Drop Board
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "timeline"
                  ? "bg-[#fffdf9] text-[#e85d9b] shadow-sm font-extrabold"
                  : "text-[#7d6d78] hover:text-[#e85d9b]"
                  }`}
              >
                <Calendar size={13} />
                Allocation Schedule
              </button>
            </div>

            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setIsAddDrawerOpen(true)}
              className="h-10 rounded-xl bg-[#e85d9b] hover:bg-[#d84b8a] border-none font-bold text-white shadow-sm transition-all"
            >
              Add Guest
            </Button>
            <button
              onClick={loadQueue}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#fffdf9] text-[#7d6d78] hover:text-[#e85d9b] hover:bg-gray-50 transition-all shadow-sm"
              title="Reload data"
            >
              <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e2e8f0]/60" />

        {/* Row 2: Live Billboard & Quick Numbers */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Live Speaker Call Billboard */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f2430] to-[#453647] p-5 text-white shadow-sm">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#e85d9b]/10 blur-xl" />
            <div className="relative z-10 flex flex-col justify-between h-full gap-4 md:flex-row md:items-center">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-pink-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e85d9b] animate-pulse" />
                  Loa Call Guest
                </span>

                {lastCalledEntry ? (
                  <div>
                    <h2 className="text-3xl font-black text-pink-100 tracking-tight select-none">
                      No. #{lastCalledEntry.queuePosition}
                    </h2>
                    <p className="mt-1 text-lg font-bold text-white leading-tight">
                      {lastCalledEntry.guestName}
                    </p>
                    <p className="mt-1 text-[10px] text-white/60 font-medium">
                      Called at: {dayjs(lastCalledEntry.calledTime).format("HH:mm")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-white/70">No numbers called yet</h3>
                    <p className="text-[10px] text-white/50 mt-1 max-w-sm">
                      Bấm nút "Call" trên card guests ở cột Sảnh Chờ VNDể mời guests.
                    </p>
                  </div>
                )}
              </div>

              {lastCalledEntry && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="primary"
                    icon={<Volume2 size={13} />}
                    onClick={() => speakCalling(lastCalledEntry.queuePosition, lastCalledEntry.guestName)}
                    className="rounded-xl h-9.5 bg-[#e85d9b] hover:bg-[#d84b8a] border-none font-bold text-white text-xs shadow-sm"
                  >
                    Recall
                  </Button>
                  <Button
                    onClick={() => openAssignArtist(lastCalledEntry)}
                    className="rounded-xl h-9.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs"
                  >
                    Assign
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Core Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fffdf9] p-3 border border-[#e2e8f0] flex flex-col justify-between h-18 transition hover:bg-gray-50/50">
              <span className="text-[9px] font-black uppercase text-[#7d6d78] tracking-wider">Waiting</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#d89b1d]">{stats.waiting}</span>
                <span className="text-[9px] text-[#7d6d78] font-bold"> guests</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#fffdf9] p-3 border border-[#e2e8f0] flex flex-col justify-between h-18 transition hover:bg-gray-50/50">
              <span className="text-[9px] font-black uppercase text-[#7d6d78] tracking-wider">At counter</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#3b82f6]">{stats.called}</span>
                <span className="text-[9px] text-[#7d6d78] font-bold"> guests</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#fffdf9] p-3 border border-[#e2e8f0] flex flex-col justify-between h-18 transition hover:bg-gray-50/50">
              <span className="text-[9px] font-black uppercase text-[#7d6d78] tracking-wider">In service</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#22a06b]">{stats.servicing}</span>
                <span className="text-[9px] text-[#7d6d78] font-bold"> tables</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#fffdf9] p-3 border border-[#e2e8f0] flex flex-col justify-between h-18 transition hover:bg-gray-50/50">
              <span className="text-[9px] font-black uppercase text-[#e85d9b] tracking-wider">Avg Wait</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#e85d9b]">~{stats.avgWait}</span>
                <span className="text-[9px] text-[#e85d9b] font-bold"> mins</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Filter / Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Tìm kiếm guests hàng bằng tên hoặc số VNDiện thoại..."
          prefix={<Search size={16} className="text-[#a08497]" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-[#edd1e2] focus:border-[#ea4f93] focus:shadow-[0_0_0_2px_rgba(234,79,147,0.1)] hover:border-[#ea4f93] transition-all bg-white"
        />
      </div>

      {/* MAIN VIEW AREA */}
      {isLoading ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
          <Spin size="large" className="pink-spin" />
          <p className="text-sm font-semibold text-[#a88a9f]">Syncing queue data...</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ==================== KANBAN BOARD WITH DRAG & DROP ==================== */
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin lg:grid lg:grid-cols-5 lg:overflow-x-visible">

          {/* COLUMN 1: WAITING */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleKanbanDrop(e, "Waiting")}
            className="flex flex-col min-w-[260px] rounded-2xl border border-[#e2d5c5]/40 bg-[#fcf8f0] p-4 shadow-[0_4px_20px_rgba(216,155,29,0.01)] min-h-[580px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#e2d5c5]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d89b1d]" />
                <h3 className="font-extrabold text-[#2f2430] text-xs uppercase tracking-wider">Lobby ({waitingEntries.length})</h3>
              </div>
              <span className="rounded-full bg-[#d89b1d]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#d89b1d] border border-[#d89b1d]/20">Waiting</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
              {waitingEntries.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200/60 rounded-2xl bg-gray-50/10">
                  <Users size={16} className="opacity-20 mb-1" />
                  <p className="text-[10px] font-bold text-gray-400">Kéo thả guests về chờ</p>
                </div>
              ) : (
                waitingEntries.map((item) => (
                  <DraggableCard
                    key={item.queueId}
                    item={item}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingItemId === item.queueId}
                    extraActions={
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f2ece9]/60">
                        <Button
                          size="small"
                          type="primary"
                          icon={<Play size={11} />}
                          onClick={() => handleCall(item)}
                          className="flex-1 bg-[#e85d9b] hover:bg-[#d84b8a] border-none font-bold text-[10px] rounded-xl h-8.5 shadow-sm text-white"
                        >
                          Call
                        </Button>
                        <Button
                          size="small"
                          icon={<ArrowUp size={11} />}
                          onClick={() => handlePrioritize(item.queueId)}
                          title="Đẩy lên VNDầu"
                          className="border-gray-200 text-gray-500 hover:border-pink-300 hover:text-[#e85d9b] h-8.5 w-8.5 flex items-center justify-center rounded-xl"
                        />
                        <Button
                          size="small"
                          danger
                          icon={<XCircle size={11} />}
                          onClick={() => handleMarkLeft(item.queueId)}
                          title="Guest left"
                          className="border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8.5 w-8.5 flex items-center justify-center rounded-xl"
                        />
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: CALLED */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleKanbanDrop(e, "Called")}
            className="flex flex-col min-w-[260px] rounded-2xl border border-[#d2e4f7]/40 bg-[#f4f7fc] p-4 shadow-[0_4px_20px_rgba(59,130,246,0.01)] min-h-[580px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#d2e4f7]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                <h3 className="font-extrabold text-[#2f2430] text-xs uppercase tracking-wider">At Counter ({calledEntries.length})</h3>
              </div>
              <span className="rounded-full bg-[#3b82f6]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#3b82f6] border border-[#3b82f6]/20">Called</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
              {calledEntries.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200/60 rounded-2xl bg-gray-50/10">
                  <User size={16} className="opacity-20 mb-1" />
                  <p className="text-[10px] font-bold text-gray-400">Drag guest to counter</p>
                </div>
              ) : (
                calledEntries.map((item) => (
                  <DraggableCard
                    key={item.queueId}
                    item={item}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingItemId === item.queueId}
                    extraActions={
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[#f2ece9]/60">
                        {item.assignedNailArtistId ? (
                          <>
                            <Button
                              size="small"
                              type="primary"
                              icon={<Play size={11} />}
                              onClick={() => handleCompleteCheckin(item.queueId)}
                              className="w-full bg-[#22a06b] hover:bg-[#1b8557] border-none font-bold text-[10px] rounded-xl h-8.5 shadow-sm text-white"
                            >
                              Serve now
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="small"
                                onClick={() => openAssignArtist(item)}
                                className="flex-1 border-[#e2e8f0] text-[#7d6d78] hover:border-[#e85d9b] hover:text-[#e85d9b] rounded-xl h-8 text-[10px] font-bold"
                              >
                                Change artist
                              </Button>
                              <Button
                                size="small"
                                icon={<Volume2 size={11} />}
                                onClick={() => speakCalling(item.queuePosition, item.guestName)}
                                title="Re-announce"
                                className="border-[#e2e8f0] text-[#7d6d78] hover:border-[#e85d9b] hover:text-[#e85d9b] h-8 w-8 flex items-center justify-center rounded-xl"
                              />
                              <Button
                                size="small"
                                danger
                                icon={<XCircle size={11} />}
                                onClick={() => handleMarkLeft(item.queueId)}
                                title="Absent"
                                className="border-[#fee2e2] bg-[#fff8f8] text-[#e56b6f] h-8 w-8 flex items-center justify-center rounded-xl"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => openAssignArtist(item)}
                              className="w-full bg-[#e85d9b] hover:bg-[#d84b8a] border-none font-bold text-[10px] rounded-xl h-8.5 shadow-sm text-white"
                            >
                              Assign artist
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="small"
                                icon={<Volume2 size={11} />}
                                onClick={() => speakCalling(item.queuePosition, item.guestName)}
                                title="Announce"
                                className="flex-1 border-[#e2e8f0] text-[#7d6d78] hover:border-[#e85d9b] hover:text-[#e85d9b] h-8 flex items-center justify-center gap-1.5 rounded-xl font-bold text-[10px]"
                              >
                                <Volume2 size={11} /> Announce
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<XCircle size={11} />}
                                onClick={() => handleMarkLeft(item.queueId)}
                                title="Absent"
                                className="border-[#fee2e2] bg-[#fff8f8] text-[#e56b6f] h-8 w-8 flex items-center justify-center rounded-xl"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: IN SERVICE */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleKanbanDrop(e, "InService")}
            className="flex flex-col min-w-[260px] rounded-2xl border border-[#c8ebd3]/40 bg-[#f0f8f4] p-4 shadow-[0_4px_20px_rgba(34,160,107,0.01)] min-h-[580px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#c8ebd3]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22a06b]" />
                <h3 className="font-extrabold text-[#2f2430] text-xs uppercase tracking-wider">In Service ({inServiceEntries.length})</h3>
              </div>
              <span className="rounded-full bg-[#22a06b]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#22a06b] border border-[#22a06b]/20">In Service</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
              {inServiceEntries.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200/60 rounded-2xl bg-gray-50/10">
                  <Clock size={16} className="opacity-20 mb-1" />
                  <p className="text-[10px] font-bold text-gray-400">Drag customer when seated</p>
                </div>
              ) : (
                inServiceEntries.map((item) => (
                  <DraggableCard
                    key={item.queueId}
                    item={item}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingItemId === item.queueId}
                    extraActions={
                      <div className="mt-3 pt-3 border-t border-[#f2ece9]/60">
                        <Button
                          size="small"
                          type="primary"
                          icon={<Check size={11} />}
                          onClick={async () => {
                            try {
                              await completeQueueEntry(item.queueId);
                              message.success("Service completed.");
                              loadQueue();
                            } catch (err) {
                              message.error(err.message || "Operation failed.");
                            }
                          }}
                          className="w-full bg-[#5b6472] hover:bg-[#474e59] border-none font-bold text-[10px] rounded-xl h-8.5 text-white"
                        >
                          Complete Service
                        </Button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 4: DONE */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleKanbanDrop(e, "Done")}
            className="flex flex-col min-w-[260px] rounded-2xl border border-[#e2e8f0]/40 bg-[#f5f6f8] p-4 shadow-sm min-h-[580px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5b6472]" />
                <h3 className="font-extrabold text-[#2f2430] text-xs uppercase tracking-wider">Completed ({doneEntries.length})</h3>
              </div>
              <span className="rounded-full bg-[#5b6472]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#5b6472] border border-[#5b6472]/20">Done</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
              {doneEntries.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200/60 rounded-2xl bg-gray-50/10">
                  <Check size={16} className="opacity-20 mb-1" />
                  <p className="text-[10px] font-bold text-gray-400">Completion history</p>
                </div>
              ) : (
                doneEntries.map((item) => (
                  <DraggableCard
                    key={item.queueId}
                    item={item}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingItemId === item.queueId}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 5: LEFT */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleKanbanDrop(e, "Left")}
            className="flex flex-col min-w-[260px] rounded-2xl border border-[#fee2e2]/40 bg-[#fdf3f4] p-4 shadow-[0_4px_20px_rgba(229,107,111,0.01)] min-h-[580px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#fee2e2]/25 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e56b6f]" />
                <h3 className="font-extrabold text-[#2f2430] text-xs uppercase tracking-wider">Absent / Left ({leftEntries.length})</h3>
              </div>
              <span className="rounded-full bg-[#e56b6f]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#e56b6f] border border-[#e56b6f]/20">Left</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
              {leftEntries.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200/60 rounded-2xl bg-gray-50/10">
                  <XCircle size={16} className="opacity-20 mb-1" />
                  <p className="text-[10px] font-bold text-gray-400">Customer left/cancelled</p>
                </div>
              ) : (
                leftEntries.map((item) => (
                  <DraggableCard
                    key={item.queueId}
                    item={item}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingItemId === item.queueId}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ==================== CALENDAR SCHEDULE TIMELINE VIEW (DRAG & DROP) ==================== */
        <div className="overflow-x-auto rounded-3xl border border-[#e2e8f0] bg-[#fffdf9] shadow-sm p-6">
          <div className="min-w-[1200px] space-y-6">

            <div className="flex justify-between items-center border-b border-[#e2e8f0]/60 pb-4">
              <div>
                <h3 className="text-base font-black text-[#2f2430] flex items-center gap-2">
                  <Calendar size={18} className="text-[#e85d9b]" />
                  Today's Staff Allocation Schedule
                </h3>
                <p className="text-[11px] text-[#7d6d78] mt-0.5 font-medium">
                  Drag and drop customer cards from <b>Unassigned</b> or between artists to reassign directly.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="rounded-full bg-[#d89b1d]/10 px-3 py-1 text-[9px] font-black uppercase text-[#d89b1d] border border-[#d89b1d]/20 shadow-sm flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#d89b1d] animate-pulse" />
                  Waiting
                </span>
                <span className="rounded-full bg-[#3b82f6]/10 px-3 py-1 text-[9px] font-black uppercase text-[#3b82f6] border border-[#3b82f6]/20 shadow-sm flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#3b82f6]" />
                  Called
                </span>
                <span className="rounded-full bg-[#22a06b]/10 px-3 py-1 text-[9px] font-black uppercase text-[#22a06b] border border-[#22a06b]/20 shadow-sm flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#22a06b] animate-ping" />
                  In Service
                </span>
              </div>
            </div>

            {/* Visual Grid Layout */}
            <div className="grid grid-cols-[240px_1fr] border border-[#e2e8f0] rounded-2xl overflow-hidden bg-gray-50/10 shadow-sm">

              {/* Vertical Header - Artist Names (Fixed Roster Panel look) */}
              <div className="divide-y divide-gray-100 border-r border-[#e2e8f0] bg-[#fffdf9]">
                <div className="h-14 flex items-center px-4 font-black text-[#2f2430] text-[10px] uppercase tracking-wider bg-gray-50/50 border-b border-[#e2e8f0]">
                  Nail Artist
                </div>

                {/* Row for Unassigned / Queue Pool */}
                <div className="h-32 flex flex-col justify-center px-4 bg-gradient-to-br from-[#fcf8f0] to-[#fffdf9]">
                  <p className="font-black text-[#d89b1d] text-xs flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d89b1d] animate-ping" />
                    Unassigned
                  </p>
                  <p className="text-[10px] text-[#7d6d78] mt-1 font-semibold">Walk-in customers waiting</p>
                </div>

                {/* Rows for each Nail Artist */}
                {staffList.map((artist) => (
                  <div key={artist.staffId} className="h-32 flex items-center gap-3 px-4 bg-[#fffdf9] transition hover:bg-gray-50/40">
                    <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e85d9b] to-[#7c3aed] text-white font-black text-xs shadow-sm">
                      {artist.firstName?.[0]}{artist.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-[#2f2430] truncate">
                        {artist.firstName} {artist.lastName}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[8px] font-bold bg-[#22a06b]/10 text-[#22a06b] border border-[#22a06b]/15 uppercase">
                        <span className="h-1 w-1 rounded-full bg-[#22a06b]" />
                        {artist.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid content columns (Hourly blocks) */}
              <div className="overflow-x-auto">
                <div className="w-[1200px] divide-y divide-gray-100">

                  {/* Grid Time Headers with Current Hour & Peak Hour tags */}
                  <div className="h-14 flex bg-gray-50/50 text-[10px] font-black text-[#7d6d78] divide-x divide-gray-100 border-b border-[#e2e8f0]">
                    {TIME_SLOTS.map((slot) => {
                      const isCurrentHour = dayjs().format("HH:00") === slot;
                      const isPeak = ["11:00", "12:00", "13:00", "17:00", "18:00", "19:00"].includes(slot);
                      return (
                        <div
                          key={slot}
                          className={`flex-1 flex flex-col items-center justify-center font-extrabold tracking-wider relative ${isCurrentHour ? "bg-[#e85d9b]/5 text-[#e85d9b]" : ""
                            }`}
                        >
                          <span>{slot}</span>
                          {isPeak && !isCurrentHour && (
                            <span className="text-[7px] text-[#d89b1d] font-bold mt-0.5">Peak</span>
                          )}
                          {isCurrentHour && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e85d9b]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 1. Unassigned queue entries row */}
                  <div className="h-32 flex divide-x divide-gray-100 bg-gradient-to-b from-[#fcf8f0]/40 to-[#fffdf9]/20">
                    {TIME_SLOTS.map((slot) => {
                      const hourEntries = filteredQueue.filter(
                        (x) => !x.assignedNailArtistId && getEntryHour(x) === slot && (x.status === "Waiting" || x.status === "Called")
                      );
                      const isPeak = ["11:00", "12:00", "13:00", "17:00", "18:00", "19:00"].includes(slot);

                      return (
                        <div
                          key={slot}
                          className={`flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto border-b border-gray-100 scrollbar-none transition-all ${isPeak ? "bg-[#faf6f0]/40" : ""
                            }`}
                        >
                          {hourEntries.map((item) => (
                            <TimelinePill
                              key={item.queueId}
                              item={item}
                              onDragStart={(e) => handleDragStart(e, item)}
                              onDragEnd={handleDragEnd}
                              onCallClick={() => handleCall(item)}
                              onAssignClick={() => openAssignArtist(item)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Rows for Nail Artists with Drop listeners */}
                  {staffList.map((artist) => (
                    <div key={artist.staffId} className="h-32 flex divide-x divide-gray-100 bg-[#fffdf9]">
                      {TIME_SLOTS.map((slot) => {
                        const artistHourEntries = filteredQueue.filter(
                          (x) => x.assignedNailArtistId === artist.staffId && getEntryHour(x) === slot
                        );
                        const isPeak = ["11:00", "12:00", "13:00", "17:00", "18:00", "19:00"].includes(slot);

                        return (
                          <div
                            key={slot}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleArtistTimelineDrop(e, artist.staffId)}
                            className={`flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto transition duration-200 hover:bg-[#faf6f0]/40 border-b border-gray-100 hover:shadow-[inset_0_0_0_1px_rgba(232,93,155,0.06)] scrollbar-none ${isPeak ? "bg-[#faf6f0]/30" : ""
                              }`}
                          >
                            {artistHourEntries.map((item) => (
                              <TimelinePill
                                key={item.queueId}
                                item={item}
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragEnd={handleDragEnd}
                                onCallClick={() => handleCall(item)}
                                onAssignClick={() => openAssignArtist(item)}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Drawer: Add Guest Form */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#ea4f93] shadow-sm">
              <Plus size={16} />
            </span>
            <span className="font-black text-[#321735] text-base">Register Walk-in Guest</span>
          </div>
        }
        placement="right"
        onClose={() => {
          setIsAddDrawerOpen(false);
          resetForm();
        }}
        open={isAddDrawerOpen}
        width={480}
        bodyStyle={{ padding: "24px" }}
        headerStyle={{ borderBottom: "1px solid #f6e6f0" }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter customer name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="h-11 rounded-xl focus:border-[#ea4f93] hover:border-[#ea4f93]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider">Phone Number</label>
            <Input
              placeholder="Enter phone number (optional)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="h-11 rounded-xl focus:border-[#ea4f93] hover:border-[#ea4f93]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider block">Customer Category</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsLateArrival(false)}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${!isLateArrival
                  ? "border-[#ea4f93] bg-[#fff5f9] text-[#ea4f93] font-black shadow-sm"
                  : "border-gray-200 bg-white text-gray-500 hover:border-pink-200"
                  }`}
              >
                Walk-in
              </button>
              <button
                type="button"
                onClick={() => setIsLateArrival(true)}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${isLateArrival
                  ? "border-[#ea4f93] bg-[#fff5f9] text-[#ea4f93] font-black shadow-sm"
                  : "border-gray-200 bg-white text-gray-500 hover:border-pink-200"
                  }`}
              >
                Late Customer (&gt;15 mins)
              </button>
            </div>
          </div>

          {/* Service catalog selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider block">
              Requested Services ({selectedServices.length})
            </label>
            <Input
              placeholder="Quick search services..."
              prefix={<Search size={14} className="text-gray-400" />}
              value={searchServiceQuery}
              onChange={(e) => setSearchServiceQuery(e.target.value)}
              className="h-10 rounded-xl mb-2 focus:border-[#ea4f93] hover:border-[#ea4f93]"
            />
            <div className="max-h-[180px] overflow-y-auto border border-[#f3d9e8] rounded-xl p-2 space-y-1.5 bg-gray-50/50 scrollbar-thin">
              {isServicesLoading ? (
                <div className="text-center py-4 text-xs text-[#a88a9f] font-semibold">Loading services...</div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#a88a9f] font-semibold">No services found</div>
              ) : (
                filteredServices.map((service) => {
                  const isSelected = selectedServices.some((s) => s.serviceId === service.serviceId);
                  return (
                    <button
                      key={service.serviceId}
                      type="button"
                      onClick={() => toggleServiceSelection(service)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition text-xs border ${isSelected
                        ? "bg-[#fff0f6] border-[#f8b4d2] text-[#ea4f93] font-black shadow-sm"
                        : "bg-white border-gray-100 text-[#402542] hover:border-pink-200 hover:bg-pink-50/10"
                        }`}
                    >
                      <span>{service.name}</span>
                      <span className="text-[10px] opacity-75 font-semibold">
                        {service.duration}m • {service.price.toLocaleString("vi-VN")} VND
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Artist selector */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider block">Select preferred artist (Optional)</label>
            <Select
              placeholder="Select an artist"
              allowClear
              value={selectedArtistId}
              onChange={(val) => setSelectedArtistId(val)}
              className="w-full h-11"
              dropdownClassName="rounded-xl"
            >
              {staffList.map((artist) => (
                <Select.Option key={artist.staffId} value={artist.staffId}>
                  {artist.firstName} {artist.lastName} ({artist.status})
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#9b7f92] tracking-wider block">Requests / Notes</label>
            <Input.TextArea
              placeholder="Enter special requests (e.g., acrylics, complex gel art...)"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              rows={3}
              className="rounded-xl focus:border-[#ea4f93] hover:border-[#ea4f93]"
            />
          </div>

          {selectedServices.length > 0 && (
            <div className="rounded-2xl bg-[#fff5fa] p-4 border border-[#fbe1ef] text-xs space-y-2">
              <p className="font-black text-[#ea4f93] flex items-center gap-1">
                <Sparkles size={12} />
                Selected Services Info
              </p>
              <div className="flex justify-between text-[#806579] font-medium">
                <span>Estimated total duration:</span>
                <span className="font-bold text-[#321735]">{totalEstDuration} mins</span>
              </div>
              <div className="flex justify-between text-[#806579] font-medium">
                <span>Estimated total price:</span>
                <span className="font-black text-[#ea4f93] text-sm">
                  {totalEstPrice.toLocaleString("vi-VN")} VND
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3 border-t border-[#f6e6f0]">
            <Button
              onClick={() => {
                setIsAddDrawerOpen(false);
                resetForm();
              }}
              className="flex-1 h-11 rounded-xl font-bold border-gray-250 text-gray-500 hover:text-pink-600 hover:border-pink-300"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleCreateQueueEntry}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#ea4f93] to-[#cc437a] border-none font-bold text-white shadow-md shadow-pink-200"
            >
              Register to Lobby
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal: Assign Artist */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[#ea4f93]" />
            <span className="font-black text-[#321735]">Assign Nail Artist</span>
          </div>
        }
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
        width={420}
        className="rounded-3xl overflow-hidden"
      >
        {selectedQueueItem && (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl bg-gradient-to-tr from-[#fff7fb] to-[#fffbfc] p-4 border border-[#f3d9e8] text-xs">
              <p className="text-[#9b7f92] font-semibold">Assigned Customer:</p>
              <p className="font-black text-[#321735] text-sm mt-1 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ea4f93] text-white text-[9px]">
                  #{selectedQueueItem.queuePosition}
                </span>
                {selectedQueueItem.guestName}
              </p>
            </div>

            <p className="text-[10px] font-black uppercase text-[#9b7f92] tracking-widest">
              Salon's Artist List
            </p>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {isStaffLoading ? (
                <div className="text-center py-4">
                  <Spin size="small" />
                </div>
              ) : staffList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 font-semibold">No active artists found.</p>
              ) : (
                staffList.map((artist) => (
                  <button
                    key={artist.staffId}
                    type="button"
                    onClick={() => handleAssignArtist(artist.staffId)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-150 bg-white hover:border-[#ea4f93] hover:bg-[#fff9fc] text-left transition duration-200"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#321735]">
                        {artist.firstName} {artist.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                        Status: {artist.status}
                      </p>
                    </div>
                    <div>
                      <Tag
                        color={artist.status === "Active" ? "green" : "gray"}
                        className="m-0 rounded-full font-bold uppercase text-[9px] px-2 border-emerald-200"
                      >
                        {artist.status}
                      </Tag>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

// Draggable Kanban Card
function DraggableCard({ item, onDragStart, onDragEnd, isDragging, extraActions }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden rounded-xl bg-[#fffdf9] p-5 border cursor-grab active:cursor-grabbing transition-all duration-300 hover:shadow-md hover:border-[#e85d9b] ${isDragging ? "opacity-30 border-dashed border-[#e85d9b]" : "border-[#e2e8f0] shadow-sm"
        }`}
    >
      {/* Visual status accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${item.status === "Waiting" ? "bg-[#d89b1d]" :
        item.status === "Called" ? "bg-[#3b82f6]" :
          item.status === "InService" ? "bg-[#22a06b]" :
            item.status === "Done" ? "bg-[#5b6472]" :
              "bg-[#e56b6f]"
        }`} />

      <div className="flex justify-between items-start gap-2 pl-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded bg-[#e85d9b]/10 text-[9px] font-black text-[#e85d9b] border border-[#e85d9b]/15 shadow-sm">
              #{item.queuePosition}
            </span>
            <h4 className="font-extrabold text-[#2f2430] text-sm truncate tracking-tight">{item.guestName}</h4>
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-[#7d6d78] flex items-center gap-1.5 font-normal">
              <Phone size={10} className="text-[#7d6d78] opacity-75" />
              {item.guestPhone || "No Phone"}
            </p>
            <p className="text-[10px] text-[#7d6d78] flex items-center gap-1.5 font-normal">
              <Clock size={10} className="text-[#7d6d78] opacity-75" />
              Arrival: <span className="text-[#2f2430] font-semibold">{dayjs(item.arrivalTime).format("HH:mm")}</span>
            </p>
          </div>

          {item.requestNote && (
            <div className="mt-3 bg-[#f5f1ed]/50 text-[#7d6d78] border border-[#e2e8f0]/60 rounded-lg px-2 py-1 text-[9px] font-medium leading-relaxed max-w-full truncate">
              {item.requestNote}
            </div>
          )}

          {item.assignedNailArtistName && (
            <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#22a06b] bg-[#22a06b]/10 border border-[#22a06b]/15 px-2 py-0.5 rounded-lg w-max max-w-full shadow-sm">
              <span className="h-1 w-1 rounded-full bg-[#22a06b] animate-pulse" />
              <span className="truncate">Artist: {item.assignedNailArtistName}</span>
            </div>
          )}

          {item.status === "Waiting" && item.estimatedWait !== null && (
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-[#d89b1d] font-bold bg-[#d89b1d]/10 border border-[#d89b1d]/15 px-2 py-0.5 rounded-lg w-max shadow-sm">
              <Clock size={10} className="text-[#d89b1d]" />
              <span>Wait: {item.estimatedWait} mins</span>
            </div>
          )}
        </div>

        <div className="shrink-0">
          {item.isLateArrival ? (
            <span className="bg-red-50 text-[#e56b6f] border border-red-100 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">Late 15m+</span>
          ) : (
            <span className="bg-[#f5f1ed] text-[#7d6d78] border border-[#e2e8f0] text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">Walk-in</span>
          )}
        </div>
      </div>

      {extraActions}
    </div>
  );
}

// Compact Draggable Timeline Pill for Calendar cells
function TimelinePill({ item, onDragStart, onDragEnd, onCallClick, onAssignClick }) {
  const statusColors = {
    Waiting: "from-[#fffdf9] to-[#fffcf3] text-[#d89b1d] border-[#fbe9c7] shadow-[0_2px_8px_rgba(216,155,29,0.05)]",
    Called: "from-[#fffdf9] to-[#f4f7fc] text-[#3b82f6] border-[#d2e4f7] shadow-[0_2px_8px_rgba(59,130,246,0.05)]",
    InService: "from-[#fffdf9] to-[#f0f8f4] text-[#22a06b] border-[#c8ebd3] shadow-[0_2px_8px_rgba(34,160,107,0.05)]",
    Done: "from-[#fffdf9] to-[#f5f6f8] text-[#5b6472] border-[#e2e8f0]",
    Left: "from-[#fffdf9] to-[#fdf3f4] text-[#e56b6f] border-[#fbc9c9]",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab active:cursor-grabbing p-3 rounded-xl border text-[10px] bg-gradient-to-b shadow-sm hover:border-[#e85d9b] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${statusColors[item.status] || "bg-white text-[#2f2430] border-[#e2e8f0]"
        }`}
    >
      <div className="flex items-center justify-between gap-1 font-extrabold">
        <span className="truncate">#{item.queuePosition} {item.guestName}</span>
        {item.isLateArrival && (
          <span className="text-[7px] bg-red-150 text-[#e56b6f] px-1 py-0.5 rounded font-black uppercase shadow-sm">L</span>
        )}
      </div>

      <p className="text-[9px] text-[#7d6d78] mt-1.5 font-medium">
        Arrival: {dayjs(item.arrivalTime).format("HH:mm")}
      </p>

      {/* Mini Actions for instant clicking in calendar view */}
      <div className="flex gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {item.status === "Waiting" && (
          <button
            onClick={onCallClick}
            className="flex-1 bg-[#fffdf9] text-[#e85d9b] hover:bg-[#fff5f9] py-1 border border-[#e2e8f0] rounded-lg font-bold text-[8px] transition-all shadow-sm cursor-pointer"
          >
            Call
          </button>
        )}
        {!item.assignedNailArtistId && (item.status === "Waiting" || item.status === "Called") && (
          <button
            onClick={onAssignClick}
            className="flex-1 bg-[#e85d9b] text-white hover:bg-[#d84b8a] py-1 rounded-lg font-bold text-[8px] transition-all cursor-pointer"
          >
            Assign
          </button>
        )}
      </div>
    </div>
  );
}

export default WalkInQueuePage;
