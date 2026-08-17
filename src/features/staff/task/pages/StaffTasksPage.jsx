import { Alert, Spin, Tooltip } from "antd";
import {
  ArrowRight,
  CheckCircle2,
  GripVertical,
  Layers3,
  RefreshCw,
  Sparkles,
  TimerReset,
  UserRoundCheck,
  Search,
  CircleUserRound,
  X,
  ChevronDown, ChevronUp,
  LockKeyhole,
  Clock,
  AlarmClock,
  Zap,
  Hourglass
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { ROUTES, getStaffBookingDetailRoute } from "../../../../shared/constants/routes";
import { formatDate } from "../../../../shared/utils/formatDate";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { getErrorMessage } from "../../../../shared/utils/getErrorMessage";
import { getStaffArtistId } from "../../bookings/services/staffBookingService";
import {
  claimStaffTask,
  filterTasksByBookingInProgress,
  fetchAssignedStaffTasks,
  fetchSalonQueueTasks,
  updateStaffTaskStatus,
} from "../services/staffTaskService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const TASK_TABS = [
  { key: "my", label: "My Tasks" },
  { key: "salon", label: "Salon Tasks" },
];

const BOARD_COLUMNS = [
  {
    key: "Pending",
    label: "To Do",
    dotClassName: "bg-[#4f7cff]",
    badgeClassName: "bg-[#fff4dc] text-[#c78518]",
    ringClassName: "border-[#f8dfb7]",
    panelClassName: "bg-[linear-gradient(180deg,#fffefb_0%,#fff8ea_100%)]",
  },
  {
    key: "InProgress",
    label: "In Progress",
    dotClassName: "bg-[#f5b638]",
    badgeClassName: "bg-[#e9f0ff] text-[#3f68d8]",
    ringClassName: "border-[#d5e2ff]",
    panelClassName: "bg-[linear-gradient(180deg,#fcfdff_0%,#f3f7ff_100%)]",
  },
  {
    key: "Completed",
    label: "Completed",
    dotClassName: "bg-[#34b36b]",
    badgeClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    ringClassName: "border-[#d6f0df]",
    panelClassName: "bg-[linear-gradient(180deg,#fcfffd_0%,#f2fbf5_100%)]",
  },
  {
    key: "Skipped",
    label: "Skipped",
    dotClassName: "bg-[#ef5350]",
    badgeClassName: "bg-[#f3e8ff] text-[#7c3aed]",
    ringClassName: "border-[#e7d8ff]",
    panelClassName: "bg-[linear-gradient(180deg,#fefcff_0%,#f8f2ff_100%)]",
  },
];

const TASK_CARD_THEMES = [
  {
    cardClassName:
      "border-[#d8e5ff] bg-[linear-gradient(180deg,rgba(240,246,255,0.96)_0%,rgba(228,238,255,0.92)_100%)] shadow-[0_12px_28px_rgba(79,124,255,0.12)]",
    chipClassName: "bg-[#dbe8ff] text-[#4368d5]",
    handleClassName: "bg-white/70 text-[#4368d5]",
    infoClassName: "border-[#d6e2ff] bg-white/60",
    dividerClassName: "border-[#dce8ff]",
  },
  {
    cardClassName:
      "border-[#f7deba] bg-[linear-gradient(180deg,rgba(255,246,230,0.96)_0%,rgba(255,236,198,0.92)_100%)] shadow-[0_12px_28px_rgba(245,182,56,0.14)]",
    chipClassName: "bg-[#ffe6bf] text-[#b97710]",
    handleClassName: "bg-white/70 text-[#c78518]",
    infoClassName: "border-[#f7ddb5] bg-white/58",
    dividerClassName: "border-[#fae3c2]",
  },
  {
    cardClassName:
      "border-[#cfeede] bg-[linear-gradient(180deg,rgba(235,255,246,0.96)_0%,rgba(211,244,227,0.92)_100%)] shadow-[0_12px_28px_rgba(52,179,107,0.12)]",
    chipClassName: "bg-[#d7f4e4] text-[#228b53]",
    handleClassName: "bg-white/70 text-[#2fa25f]",
    infoClassName: "border-[#caeadb] bg-white/58",
    dividerClassName: "border-[#d7efe3]",
  },
  {
    cardClassName:
      "border-[#efd7ff] bg-[linear-gradient(180deg,rgba(250,242,255,0.96)_0%,rgba(241,229,255,0.92)_100%)] shadow-[0_12px_28px_rgba(124,58,237,0.11)]",
    chipClassName: "bg-[#eadbff] text-[#7b49d1]",
    handleClassName: "bg-white/72 text-[#7c3aed]",
    infoClassName: "border-[#ead9fb] bg-white/58",
    dividerClassName: "border-[#eddffb]",
  },
  {
    cardClassName:
      "border-[#ffd5df] bg-[linear-gradient(180deg,rgba(255,241,245,0.96)_0%,rgba(255,224,233,0.92)_100%)] shadow-[0_12px_28px_rgba(236,72,153,0.12)]",
    chipClassName: "bg-[#ffdbe7] text-[#cf4f89]",
    handleClassName: "bg-white/72 text-[#d94f92]",
    infoClassName: "border-[#f9d6e1] bg-white/58",
    dividerClassName: "border-[#fce0e8]",
  },
];

function normalizeStatusKey(status) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "in progress":
    case "inprogress":
      return "InProgress";
    case "completed":
      return "Completed";
    case "skipped":
      return "Skipped";
    case "pending":
    default:
      return "Pending";
  }
}

function isTaskTerminalStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "completed" || normalized === "done" || normalized === "skipped";
}

function buildTaskSequenceBlockMap(tasks) {
  const groupedTasks = new Map();

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const groupKey = String(task?.bookingItemId || task?.bookingId || "").trim();

    if (!groupKey) {
      return;
    }

    if (!groupedTasks.has(groupKey)) {
      groupedTasks.set(groupKey, []);
    }

    groupedTasks.get(groupKey).push(task);
  });

  const blockMap = new Map();

  groupedTasks.forEach((groupTasks) => {
    const sortedTasks = [...groupTasks].sort(
      (left, right) => Number(left?.stepOrder || 0) - Number(right?.stepOrder || 0),
    );

    sortedTasks.forEach((task) => {
      const currentStepOrder = Number(task?.stepOrder || 0);
      const isBlocked = sortedTasks.some((previousTask) => {
        const previousStepOrder = Number(previousTask?.stepOrder || 0);

        if (!Number.isFinite(previousStepOrder) || !Number.isFinite(currentStepOrder)) {
          return false;
        }

        if (previousStepOrder >= currentStepOrder) {
          return false;
        }

        if (!previousTask?.isRequired || previousTask?.canOverlap) {
          return false;
        }

        return !isTaskTerminalStatus(previousTask?.status);
      });

      blockMap.set(String(task?.bookingProcedureId || "").trim(), isBlocked);
    });
  });

  return blockMap;
}

function applyTaskSequenceBlockState(tasks, blockMap) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => ({
    ...task,
    isBlockedBySequence: blockMap.get(String(task?.bookingProcedureId || "").trim()) || false,
  }));
}

function decorateTaskBoards(myTaskList, salonTaskList) {
  const nextMyTasks = Array.isArray(myTaskList) ? myTaskList : [];
  const nextSalonTasks = Array.isArray(salonTaskList) ? salonTaskList : [];
  const sequenceBlockMap = buildTaskSequenceBlockMap([...nextMyTasks, ...nextSalonTasks]);

  return {
    myTasks: applyTaskSequenceBlockState(nextMyTasks, sequenceBlockMap),
    salonTasks: applyTaskSequenceBlockState(nextSalonTasks, sequenceBlockMap),
  };
}

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[22px] border border-[#f6dce7] bg-white shadow-[0_14px_34px_rgba(236,72,153,0.08)] ${className}`}
    >
      {children}
    </article>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-[#402542]">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-[#b07a94]">{subtitle}</p> : null}
    </div>
  );
}

function StatCard({ title, value, note, icon: Icon, toneClassName }) {
  return (
    <div className="rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c08aa4]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#402542]">{value}</p>
          <p className="mt-1 text-xs text-[#a07c90]">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_12px_24px_rgba(236,72,153,0.16)] ${toneClassName}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function formatTaskTime(value) {
  if (!value) return "--";

  const rawStr = String(value).trim();
  if (rawStr === "Đang làm..." || rawStr === "--:--") return rawStr;

  // Match TimeSpan format like "06:19:43.3487340" or "19:22:56.1019770" or "06:19:43" or "06:19"
  const timeSpanMatch = rawStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?$/);
  if (timeSpanMatch) {
    const hh = timeSpanMatch[1].padStart(2, "0");
    const mm = timeSpanMatch[2];
    return `${hh}:${mm}`;
  }

  // ISO DateTime string or Date object
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return rawStr;
}

function getTaskTheme(task) {
  const seed = String(
    task?.bookingProcedureId || task?.bookingItemId || task?.procedureId || task?.procedureName || "",
  );
  const index =
    Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % TASK_CARD_THEMES.length;

  return TASK_CARD_THEMES[index];
}

function TaskTabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition ${active
        ? "border-[#ea4f93] bg-[#fff1f7] text-[#d94f92] shadow-[0_10px_20px_rgba(236,72,153,0.12)]"
        : "border-[#f3d5e2] bg-white text-[#8f7184] hover:bg-[#fff7fb]"
        }`}
    >
      {label}
    </button>
  );
}

function MiniInfo({ label, value, className = "" }) {
  return (
    <div className={`rounded-[12px] border px-2.5 py-2 ${className || "border-[#f7d8e5] bg-white/80"}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c08aa4]">{label}</p>
      <p className="mt-1 text-[11px] font-bold text-[#402542]">{value}</p>
    </div>
  );
}

function isTaskAssigned(task) {
  const assignedArtistId = String(task?.assignedArtistId || "").trim();
  const assignedArtistName = String(task?.assignedArtistName || "").trim().toLowerCase();

  if (assignedArtistId) {
    return true;
  }

  return Boolean(
    assignedArtistName &&
    assignedArtistName !== "unassigned" &&
    assignedArtistName !== "unassigned artist" &&
    assignedArtistName !== "unknown" &&
    assignedArtistName !== "--",
  );
}

function isTaskAssignedToCurrentArtist(task, currentStaffArtistId) {
  const assignedArtistId = String(task?.assignedArtistId || "").trim();
  const normalizedCurrentStaffArtistId = String(currentStaffArtistId || "").trim();

  if (!assignedArtistId || !normalizedCurrentStaffArtistId) {
    return false;
  }

  return assignedArtistId === normalizedCurrentStaffArtistId;
}

function canTaskBeDragged(task, currentStaffArtistId) {
  if (!isTaskAssigned(task)) {
    return false;
  }

  if (!isTaskAssignedToCurrentArtist(task, currentStaffArtistId)) {
    return false;
  }

  return !(task?.isBlockedBySequence && normalizeStatusKey(task?.status) === "Pending");
}

function getTaskOwnerLabel(task, fallbackLabel = "Assigned to you") {
  return task?.assignedArtistName || fallbackLabel;
}

function mergeTaskWithStatusUpdate(currentTask, updatedTask) {
  if (!currentTask) {
    return updatedTask;
  }

  if (!updatedTask) {
    return currentTask;
  }

  const pickText = (nextValue, currentValue, invalidValues = []) => {
    const normalizedNext = String(nextValue || "").trim();
    if (!normalizedNext || invalidValues.includes(normalizedNext)) {
      return currentValue;
    }

    return nextValue;
  };

  return {
    ...currentTask,
    ...updatedTask,
    bookingItemId: pickText(updatedTask.bookingItemId, currentTask.bookingItemId),
    procedureId: pickText(updatedTask.procedureId, currentTask.procedureId),
    procedureName: pickText(updatedTask.procedureName, currentTask.procedureName, ["Unnamed Procedure"]),
    description: pickText(updatedTask.description, currentTask.description),
    assignedArtistId: pickText(updatedTask.assignedArtistId, currentTask.assignedArtistId),
    assignedArtistName: pickText(updatedTask.assignedArtistName, currentTask.assignedArtistName),
    estimatedStartTime: pickText(updatedTask.estimatedStartTime, currentTask.estimatedStartTime),
    estimatedEndTime: pickText(updatedTask.estimatedEndTime, currentTask.estimatedEndTime),
    actualStartTime: pickText(updatedTask.actualStartTime, currentTask.actualStartTime),
    actualEndTime: pickText(updatedTask.actualEndTime, currentTask.actualEndTime),
    bookingId: pickText(updatedTask.bookingId, currentTask.bookingId),
    customerName: pickText(updatedTask.customerName, currentTask.customerName, ["Unknown Customer"]),
    chairName: pickText(updatedTask.chairName, currentTask.chairName),
    bookingDate: updatedTask.bookingDate || currentTask.bookingDate,
    startTime: pickText(updatedTask.startTime, currentTask.startTime),
    stepOrder: updatedTask.stepOrder || currentTask.stepOrder,
    duration: updatedTask.duration || currentTask.duration,
    activeDuration: updatedTask.activeDuration || currentTask.activeDuration,
    passiveDuration: updatedTask.passiveDuration || currentTask.passiveDuration,
  };
}

function BoardTaskCard({
  task,
  onDragStart,
  onDragEnd,
  isDragging,
  isUpdating,
  canDrag = true,
  footerHint,
  ownerLabel,
  primaryAction,
  secondaryAction,
  hideHeader = false,
}) {
  const theme = getTaskTheme(task);
  const activeDuration = task.activeDuration ?? task.duration ?? 0;
  const passiveDuration = task.passiveDuration ?? 0;
  const hasPassive = passiveDuration > 0;
  const [showDetails, setShowDetails] = useState(false);
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div
      draggable={canDrag && !isUpdating}
      onDragStart={canDrag ? (event) => onDragStart(event, task) : undefined}
      onDragEnd={onDragEnd}
      className={`rounded-[18px] border p-3.5 transition ${theme.cardClassName} ${isDragging ? "rotate-[1deg] opacity-60" : "hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(236,72,153,0.12)]"
        } ${isUpdating ? "cursor-wait opacity-70" : canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      {/* Prominent Customer & Booking Identifier Header Pill */}
      {!hideHeader ? (
        <div className="flex flex-row justify-center gap-2 w-full">
          <div className="w-full mb-2.5 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 p-2 border border-purple-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#C97A9E] font-bold text-[10px] shrink-0">
                <CircleUserRound size={14} strokeWidth={2.3} />
              </span>
              <span className="font-bold text-[#221F26] text-xs truncate">
                {task.customerName || "Khách Vãng Lai"}
              </span>
            </div>

          </div>
          <Tooltip
            title={showDetails ? "Hide details" : "Show details"}
            placement="top"
            color="#262626"
          >
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="
        flex h-9 w-9 shrink-0 items-center justify-center
        rounded-xl
        border border-white/70
        bg-white/70
        text-[#7C3AED]
        shadow-sm
        transition-all
        hover:scale-105
        hover:bg-white
        hover:shadow-md
      "
            >
              {showDetails ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>
          </Tooltip>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${theme.chipClassName}`}>
              {isVi ? `Bước ${task.stepOrder || 0}` : `Step ${task.stepOrder || 0}`}
            </span>
            {task.isMainStep ? (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${theme.chipClassName}`}>
                {isVi ? "Chính" : "Main"}
              </span>
            ) : null}
          </div>
          <Tooltip
            title={showDetails ? "Hide details" : "Show details"}
            placement="top"
            color="#262626"
          >
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="
                flex h-6 w-6 shrink-0 items-center justify-center
                rounded-lg
                border border-white/70
                bg-white/70
                text-[#7C3AED]
                shadow-2xs
                transition-all
                hover:scale-105
                hover:bg-white
              "
            >
              {showDetails ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
          </Tooltip>
        </div>
      )}

      {/* Step Badge & Procedure Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!hideHeader && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${theme.chipClassName}`}>
                {isVi ? `Bước ${task.stepOrder || 0}` : `Step ${task.stepOrder || 0}`}
              </span>
              {task.isMainStep ? (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${theme.chipClassName}`}>
                  {isVi ? "Chính" : "Main"}
                </span>
              ) : null}
            </div>
          )}
          <h3 className={`${!hideHeader ? "mt-2" : ""} text-[13px] font-bold leading-snug text-[#402542]`}>{task.procedureName}</h3>
        </div>
      </div>
      <div
        className={`
                  overflow-hidden
                  transition-all
                  duration-300
                  ${showDetails ? "max-h-[700px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                `}
      >
        {/* Basic Meta Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniInfo label={isVi ? "Khách hàng" : "Customer"} value={task.customerName} className={theme.infoClassName} />
          <MiniInfo label={isVi ? "Ghế" : "Chair"} value={task.chairName} className={theme.infoClassName} />
          <MiniInfo
            label={isVi ? "Ngày" : "Date"}
            value={formatDate(task.bookingDate)}
            className={theme.infoClassName}
          />
          <MiniInfo
            label={isVi ? "Tổng thời gian" : "Total Time"}
            value={formatDurationMinutes(task.duration)}
            className={theme.infoClassName}
          />
        </div>

        {/* Active vs Passive Time Breakdown Bar */}
        <div className="mt-2.5 space-y-2 border-t pt-2 border-white/60">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 text-yellow-600">
              <Zap size={13} strokeWidth={2.5} />
              {isVi ? "Hoạt động:" : "Active:"} {activeDuration}m
            </span>

            {hasPassive && (
              <span className="inline-flex items-center gap-1 text-[#0284C7]">
                <Hourglass size={13} strokeWidth={2.5} />
                {isVi ? "Thụ động" : "Passive"}: {passiveDuration}m
              </span>
            )}
            {(hasPassive || task.canOverlap) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#047857] border border-[#A7F3D0]">
                <Sparkles size={12} />
                {isVi ? "Thực hiện chéo" : "Overlap"} ({passiveDuration}m free)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                <LockKeyhole size={12} />
                {isVi ? "Liên tục" : "Continuous"}
              </span>
            )}
          </div>

          {/* Estimated Schedule & Actual Execution Time */}
          <div className="flex flex-col gap-1.5 text-[10px]">
            <div className="flex items-center justify-between text-blue-600 font-medium opacity-80">
              <span className="flex items-center justify-center gap-1.5">
                <Clock size={12} />
                {isVi ? "Dự kiến" : "Estimated"} : {formatTaskTime(task.estimatedStartTime || task.startTime)} - {formatTaskTime(task.estimatedEndTime)}
              </span>
            </div>
            {(task.actualStartTime || task.actualEndTime) && (
              <div className="flex items-center justify-center align-center gap-2 rounded-xl bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-teal-50 px-3 py-1.5 text-emerald-950 border border-emerald-300 shadow-2xs">
                <span className="font-bold text-[11px] text-emerald-800 flex items-center gap-1">
                  <AlarmClock size={13} /> {isVi ? "Thực tế" : "Actually do"}:
                </span>
                <span className="font-bold text-xs text-emerald-700 tracking-tight">
                  {formatTaskTime(task.actualStartTime)} ~ {task.actualEndTime ? formatTaskTime(task.actualEndTime) : "Doing..."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Row */}
        <div className={`mt-3 flex items-center justify-between gap-3 border-t pt-2.5 ${theme.dividerClassName}`}>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-[#402542]">
              {ownerLabel || getTaskOwnerLabel(task)}
            </p>
            <p className="text-[10px] text-[#a07c90]">
              {isUpdating ? "Updating status..." : footerHint || (canDrag ? "Drag to move this task" : "Claim this task to start")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction}
            {primaryAction || (!secondaryAction && (
              <Link
                to={task.bookingId ? getStaffBookingDetailRoute(task.bookingId) : ROUTES.staffBookings}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f3d5e2] bg-white px-3 py-1 text-[11px] font-bold text-[#d94f92] transition hover:bg-[#fff5fa]"
              >
                {isVi ? "Xem chi tiết" : "View Details"}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  tasks,
  isActiveDropTarget,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  draggingTaskId,
  updatingTaskId,
  renderTask,
  emptyText = "Drop a task here",
}) {
  const { language } = useLanguage();
  const isVi = language === "vi";

  // Group tasks with the same bookingId together
  const groupedTasks = useMemo(() => {
    const groups = [];
    const groupMap = {};

    (tasks || []).forEach((task) => {
      const bookingId = task.bookingId || "unassigned";
      if (!groupMap[bookingId]) {
        groupMap[bookingId] = {
          bookingId,
          customerName: task.customerName || (isVi ? "Khách vãng lai" : "Walk-in Customer"),
          chairName: task.chairName,
          tasks: [],
        };
        groups.push(groupMap[bookingId]);
      }
      groupMap[bookingId].tasks.push(task);
    });

    return groups;
  }, [tasks, isVi]);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, column.key)}
      className={`flex h-[540px] min-w-[310px] flex-col overflow-hidden rounded-[24px] border p-4 transition ${column.ringClassName} ${column.panelClassName} ${isActiveDropTarget ? "scale-[1.01] shadow-[0_18px_36px_rgba(236,72,153,0.12)]" : ""
        }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.dotClassName}`} />
          <h3 className="text-sm font-bold text-[#402542]">{column.label}</h3>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${column.badgeClassName}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
        {groupedTasks.length === 0 ? (
          <div className="flex h-[140px] items-center justify-center rounded-[18px] border border-dashed border-[#efcadd] bg-white/70 px-4 text-center text-[12px] font-semibold text-[#b07a94]">
            {emptyText}
          </div>
        ) : (
          groupedTasks.map((group) => (
            <div
              key={group.bookingId}
              className="rounded-2xl border border-purple-100 bg-[#fffafd]/60 p-2.5 space-y-2 shadow-inner hover:bg-[#fff9fc]/80 transition-all duration-300"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between gap-2 px-0.5 pb-0.5 border-b border-pink-50/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-[#ea4f93] shrink-0">
                    <CircleUserRound size={12} strokeWidth={2.5} />
                  </span>
                  <span className="font-extrabold text-[#3f2a3c] text-[11px] truncate">
                    {group.customerName}
                  </span>
                </div>
                {group.chairName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-extrabold text-[#7c3aed] border border-purple-200/50 shadow-3xs">
                    {isVi ? `Ghế ${group.chairName}` : `Chair ${group.chairName}`}
                  </span>
                )}
              </div>

              {/* Group Tasks */}
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  renderTask ? renderTask(task, true) : (
                    <BoardTaskCard
                      key={task.bookingProcedureId}
                      task={task}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      isDragging={draggingTaskId === task.bookingProcedureId}
                      isUpdating={updatingTaskId === task.bookingProcedureId}
                      hideHeader
                    />
                  )
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function StaffTasksPage() {
  const [activeTab, setActiveTab] = useState("my");
  const [myTasks, setMyTasks] = useState([]);
  const [salonTasks, setSalonTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [claimingTaskId, setClaimingTaskId] = useState("");
  const [draggingTask, setDraggingTask] = useState(null);
  const [draggingSource, setDraggingSource] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const currentStaffArtistId = useMemo(() => {
    try {
      return String(getStaffArtistId() || "").trim();
    } catch {
      return "";
    }
  }, []);
  const { language } = useLanguage();

  const TASK_TABS = [
    { key: "my", label: language === "vi" ? "Nhiệm vụ của tôi" : "My Tasks" },
    { key: "salon", label: language === "vi" ? "Nhiệm vụ Salon" : "Salon Tasks" },
  ];

  const BOARD_COLUMNS_TRANSLATED = [
    { ...BOARD_COLUMNS[0], label: language === "vi" ? "Cần làm" : "To Do" },
    { ...BOARD_COLUMNS[1], label: language === "vi" ? "Đang làm" : "In Progress" },
    { ...BOARD_COLUMNS[2], label: language === "vi" ? "Hoàn thành" : "Completed" },
    { ...BOARD_COLUMNS[3], label: language === "vi" ? "Bỏ qua" : "Skipped" },
  ];

  const loadTasks = useCallback(async (options = {}) => {
    const { silent = false } = options;

    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const [assignedData, salonQueueData] = await Promise.all([
        fetchAssignedStaffTasks(),
        fetchSalonQueueTasks(),
      ]);
      const [visibleAssignedTasks, visibleClaimableTasks] = await Promise.all([
        filterTasksByBookingInProgress(assignedData),
        Promise.resolve(salonQueueData),
      ]);
      const decoratedBoards = decorateTaskBoards(visibleAssignedTasks, visibleClaimableTasks);

      setMyTasks(decoratedBoards.myTasks);
      setSalonTasks(decoratedBoards.salonTasks);
    } catch (err) {
      console.error("Failed to load staff tasks:", err);
      const message = getErrorMessage(err, "Failed to load tasks.");
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleClaimTask = useCallback(async (task) => {
    if (isTaskAssigned(task)) {
      setError("This task has already been claimed by another staff member.");
      return;
    }

    if (task?.isBlockedBySequence) {
      setError("Claim this booking in step order. Finish the earlier required step first.");
      return;
    }

    try {
      setClaimingTaskId(task.bookingProcedureId);
      await claimStaffTask(task.bookingProcedureId);
      await loadTasks({ silent: true });
      setActiveTab("my");
    } catch (err) {
      console.error("Failed to claim task:", err);
      const message = getErrorMessage(err, "Failed to claim task.");
      setError(message);
      toast.error(message);
    } finally {
      setClaimingTaskId("");
    }
  }, [loadTasks]);

  const handleDragStart = useCallback((event, task, source = "my") => {
    if (!canTaskBeDragged(task, currentStaffArtistId)) {
      event.preventDefault();
      return;
    }

    setDraggingTask(task);
    setDraggingSource(source);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.bookingProcedureId);
  }, [currentStaffArtistId]);

  const handleDragEnd = useCallback(() => {
    setDraggingTask(null);
    setDraggingSource("");
    setDragOverColumn("");
  }, []);

  const handleMyColumnDrop = useCallback(async (event, nextStatus) => {
    event.preventDefault();
    setDragOverColumn("");

    if (!draggingTask || draggingSource !== "my") {
      return;
    }

    const currentStatus = normalizeStatusKey(draggingTask.status);
    if (currentStatus === nextStatus) {
      setDraggingTask(null);
      return;
    }

    const nowTimeStr = new Date().toTimeString().slice(0, 8);
    const previousTasks = myTasks;
    const optimisticTasks = myTasks.map((task) => {
      if (task.bookingProcedureId !== draggingTask.bookingProcedureId) return task;
      const timeUpdates = {};
      if (nextStatus === "InProgress" && !task.actualStartTime) {
        timeUpdates.actualStartTime = nowTimeStr;
      } else if (nextStatus === "Completed") {
        if (!task.actualStartTime) timeUpdates.actualStartTime = nowTimeStr;
        timeUpdates.actualEndTime = nowTimeStr;
      }
      return { ...task, status: nextStatus, ...timeUpdates };
    });

    try {
      setUpdatingTaskId(draggingTask.bookingProcedureId);
      const optimisticBoards = decorateTaskBoards(optimisticTasks, salonTasks);
      setMyTasks(optimisticBoards.myTasks);
      setSalonTasks(optimisticBoards.salonTasks);

      const updatedTask = await updateStaffTaskStatus(
        draggingTask.bookingProcedureId,
        nextStatus,
      );

      setMyTasks((current) => {
        const mergedMyTasks = current.map((task) => {
          if (task.bookingProcedureId !== updatedTask.bookingProcedureId) return task;
          const merged = mergeTaskWithStatusUpdate(task, updatedTask);
          const timeUpdates = {};
          if (nextStatus === "InProgress" && !merged.actualStartTime) {
            timeUpdates.actualStartTime = nowTimeStr;
          } else if (nextStatus === "Completed") {
            if (!merged.actualStartTime) timeUpdates.actualStartTime = task.actualStartTime || nowTimeStr;
            if (!merged.actualEndTime) timeUpdates.actualEndTime = nowTimeStr;
          }
          return { ...merged, ...timeUpdates };
        });
        const decoratedBoards = decorateTaskBoards(mergedMyTasks, salonTasks);
        setSalonTasks(decoratedBoards.salonTasks);
        return decoratedBoards.myTasks;
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
      const revertedBoards = decorateTaskBoards(previousTasks, salonTasks);
      setMyTasks(revertedBoards.myTasks);
      setSalonTasks(revertedBoards.salonTasks);
      const message = getErrorMessage(err, "Failed to update task status.");
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingTaskId("");
      setDraggingTask(null);
      setDraggingSource("");
    }
  }, [draggingSource, draggingTask, myTasks, salonTasks]);

  const handleSalonColumnDrop = useCallback(async (event, nextStatus) => {
    event.preventDefault();
    setDragOverColumn("");

    if (!draggingTask || draggingSource !== "salon") {
      return;
    }

    if (!canTaskBeDragged(draggingTask, currentStaffArtistId)) {
      if (isTaskAssigned(draggingTask)) {
        setError("Only the staff member who claimed this step can move it.");
      } else {
        setError("Claim this task before moving it to another status.");
      }
      setDraggingTask(null);
      setDraggingSource("");
      return;
    }

    const currentStatus = normalizeStatusKey(draggingTask.status);
    if (currentStatus === nextStatus) {
      setDraggingTask(null);
      setDraggingSource("");
      return;
    }

    const nowTimeStr = new Date().toTimeString().slice(0, 8);
    const previousTasks = salonTasks;
    const optimisticTasks = salonTasks.map((task) => {
      if (task.bookingProcedureId !== draggingTask.bookingProcedureId) return task;
      const timeUpdates = {};
      if (nextStatus === "InProgress" && !task.actualStartTime) {
        timeUpdates.actualStartTime = nowTimeStr;
      } else if (nextStatus === "Completed") {
        if (!task.actualStartTime) timeUpdates.actualStartTime = nowTimeStr;
        timeUpdates.actualEndTime = nowTimeStr;
      }
      return { ...task, status: nextStatus, ...timeUpdates };
    });

    try {
      setUpdatingTaskId(draggingTask.bookingProcedureId);
      const optimisticBoards = decorateTaskBoards(myTasks, optimisticTasks);
      setMyTasks(optimisticBoards.myTasks);
      setSalonTasks(optimisticBoards.salonTasks);

      const updatedTask = await updateStaffTaskStatus(
        draggingTask.bookingProcedureId,
        nextStatus,
      );

      setSalonTasks((current) => {
        const mergedSalonTasks = current.map((task) => {
          if (task.bookingProcedureId !== updatedTask.bookingProcedureId) return task;
          const merged = mergeTaskWithStatusUpdate(task, updatedTask);
          const timeUpdates = {};
          if (nextStatus === "InProgress" && !merged.actualStartTime) {
            timeUpdates.actualStartTime = nowTimeStr;
          } else if (nextStatus === "Completed") {
            if (!merged.actualStartTime) timeUpdates.actualStartTime = task.actualStartTime || nowTimeStr;
            if (!merged.actualEndTime) timeUpdates.actualEndTime = nowTimeStr;
          }
          return { ...merged, ...timeUpdates };
        });
        const decoratedBoards = decorateTaskBoards(myTasks, mergedSalonTasks);
        setMyTasks(decoratedBoards.myTasks);
        return decoratedBoards.salonTasks;
      });
    } catch (err) {
      console.error("Failed to update salon task status:", err);
      const revertedBoards = decorateTaskBoards(myTasks, previousTasks);
      setMyTasks(revertedBoards.myTasks);
      setSalonTasks(revertedBoards.salonTasks);
      const message = getErrorMessage(err, "Failed to update salon task status.");
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingTaskId("");
      setDraggingTask(null);
      setDraggingSource("");
    }
  }, [currentStaffArtistId, draggingSource, draggingTask, myTasks, salonTasks]);

  const [searchTaskText, setSearchTaskText] = useState("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("all");

  const uniqueCustomers = useMemo(() => {
    const all = [...myTasks, ...salonTasks];
    const customerMap = new Map();
    all.forEach((t) => {
      if (t.customerName && t.customerName !== "Unknown Customer") {
        const bkCode = t.bookingId ? `BK-${String(t.bookingId).slice(-4).toUpperCase()}` : "";
        customerMap.set(t.customerName, bkCode ? `${t.customerName} (${bkCode})` : t.customerName);
      }
    });
    return Array.from(customerMap.entries()).map(([name, display]) => ({
      name,
      display,
    }));
  }, [myTasks, salonTasks]);

  const filterSingleTask = useCallback(
    (task) => {
      if (selectedCustomerFilter !== "all" && task.customerName !== selectedCustomerFilter) {
        return false;
      }
      if (searchTaskText.trim()) {
        const q = searchTaskText.toLowerCase();
        const cName = String(task.customerName || "").toLowerCase();
        const pName = String(task.procedureName || "").toLowerCase();
        const bkId = String(task.bookingId || "").toLowerCase();
        const chair = String(task.chairName || "").toLowerCase();
        const code = task.bookingId ? `bk-${String(task.bookingId).slice(-4).toLowerCase()}` : "";
        return cName.includes(q) || pName.includes(q) || bkId.includes(q) || chair.includes(q) || code.includes(q);
      }
      return true;
    },
    [selectedCustomerFilter, searchTaskText]
  );

  const myTasksByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce((groups, column) => {
      groups[column.key] = myTasks
        .filter(filterSingleTask)
        .filter((task) => normalizeStatusKey(task.status) === column.key);
      return groups;
    }, {});
  }, [myTasks, filterSingleTask]);

  const salonTasksByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce((groups, column) => {
      groups[column.key] = salonTasks
        .filter(filterSingleTask)
        .filter((task) => normalizeStatusKey(task.status) === column.key);
      return groups;
    }, {});
  }, [salonTasks, filterSingleTask]);

  const stats = useMemo(() => {
    const requiredMyTasks = myTasks.filter((task) => task.isRequired).length;
    const overlapReadyTasks = salonTasks.filter((task) => task.canOverlap).length;

    return [
      {
        key: "assigned",
        title: language === "vi" ? "Được phân công" : "Assigned",
        value: myTasks.length,
        note: language === "vi" ? "Nhiệm vụ hiện đang được giao cho bạn" : "Tasks currently assigned to you",
        icon: UserRoundCheck,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        key: "claimable",
        title: language === "vi" ? "Có thể nhận" : "Claimable",
        value: salonTasks.length,
        note: language === "vi" ? "Các bước hiện thị trong hàng đợi salon" : "Visible steps in the salon queue",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]",
      },
      {
        key: "required",
        title: language === "vi" ? "Bắt buộc" : "Required",
        value: requiredMyTasks,
        note: language === "vi" ? "Bước bắt buộc trong hàng đợi của bạn" : "Required steps in your queue",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#34d399] to-[#059669]",
      },
      {
        key: "overlap",
        title: language === "vi" ? "Sẵn sàng song song" : "Overlap Ready",
        value: overlapReadyTasks,
        note: language === "vi" ? "Nhiệm vụ có thể làm đồng thời" : "Claimable tasks that can overlap",
        icon: Layers3,
        toneClassName: "bg-gradient-to-br from-[#f59e0b] to-[#d97706]",
      },
    ];
  }, [myTasks, salonTasks, language]);

  return (
    <section className="mx-auto w-full max-w-[1450px] space-y-5">
      {error ? (
        <Alert
          message="Task Loading Error"
          description={error}
          type="error"
          showIcon
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={stat.icon}
            toneClassName={stat.toneClassName}
          />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#f6dce7] bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f8_100%)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeading
              title={language === "vi" ? "Hàng đợi nhiệm vụ" : "Task Queue"}
              subtitle={
                activeTab === "my"
                  ? (language === "vi" ? "Kéo thả nhiệm vụ giữa các cột để cập nhật trạng thái làm việc." : "Drag tasks between columns to update their working status.")
                  : (language === "vi" ? "Xem toàn bộ hàng đợi nhiệm vụ salon. Các bước bị khóa vẫn hiển thị cho đến khi các bước trước đó hoàn thành." : "Review the full salon task queue. Locked steps stay visible until earlier required steps are finished.")
              }
            />

            <div className="flex flex-wrap items-center gap-2">
              {TASK_TABS.map((tab) => (
                <TaskTabButton
                  key={tab.key}
                  active={activeTab === tab.key}
                  label={tab.label}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}

              <button
                type="button"
                onClick={() => void loadTasks({ silent: true })}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f3d5e2] bg-white px-4 py-2 text-xs font-bold text-[#8f7184] transition hover:bg-[#fff7fb]"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {language === "vi" ? "Tải lại" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Customer & Task Filter Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#f6dce7]/70 pt-4">

            {/* Search */}
            <div className="relative min-w-[320px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a07c90]"
              />

              <input
                type="text"
                placeholder={language === "vi" ? "Tìm khách, mã booking, thủ thuật..." : "Search customer, booking code, procedure..."}
                value={searchTaskText}
                onChange={(e) => setSearchTaskText(e.target.value)}
                className="
        h-11
        w-full
        rounded-xl
        border border-[#f3d5e2]
        bg-white
        pl-10
        pr-10
        text-xs
        font-semibold
        text-[#402542]
        placeholder:text-[#a07c90]
        shadow-sm
        transition-all
        focus:border-[#C97A9E]
        focus:ring-4
        focus:ring-[#fde7ef]
        focus:outline-none
      "
              />

              {searchTaskText && (
                <button
                  type="button"
                  onClick={() => setSearchTaskText("")}
                  className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          bg-[#fde7ef]
          text-[#d94f92]
          transition
          hover:bg-[#f9d2e1]
        "
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Customer Filter */}
            <div className="relative shrink-0">
              <CircleUserRound
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b5cf6]"
              />

              <select
                value={selectedCustomerFilter}
                onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                className="
                            h-11
                            appearance-none
                            rounded-xl
                            border border-[#edd8f8]
                            bg-white
                            pl-10
                            pr-16
                            text-xs
                            font-semibold
                            text-[#4c1d95]
                            shadow-sm
                            transition-all
                            hover:border-[#c084fc]
                            focus:border-[#a855f7]
                            focus:ring-4
                            focus:ring-[#f3e8ff]
                            focus:outline-none
                            cursor-pointer
                          "
              >
                <option value="all">
                  {language === "vi" ? `Tất cả khách hàng (${uniqueCustomers.length})` : `All Customers (${uniqueCustomers.length})`}
                </option>

                {uniqueCustomers.map((cust) => (
                  <option key={cust.name} value={cust.name}>
                    {cust.display}
                  </option>
                ))}
              </select>

              {selectedCustomerFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerFilter("all")}
                  className="
                              absolute
                              right-9
                              top-1/2
                              -translate-y-1/2
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              text-red-700
                              transition
                              hover:bg-red-200
                            "
                >
                  <X size={12} />
                </button>
              )}

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b5cf6]"
              />
            </div>

          </div>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" tip={language === "vi" ? "Đang tải nhiệm vụ..." : "Loading tasks..."} />
            </div>
          ) : activeTab === "my" ? (
            myTasks.length === 0 ? (
              <EmptyState
                title={language === "vi" ? "Không có nhiệm vụ được phân công" : "No assigned tasks"}
                description={language === "vi" ? "Bạn hiện không có bất kỳ thủ thuật đặt chỗ nào được giao." : "You currently do not have any active booking procedures assigned."}
              />
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {BOARD_COLUMNS_TRANSLATED.map((column) => (
                    <BoardColumn
                      key={column.key}
                      column={column}
                      tasks={myTasksByColumn[column.key] || []}
                      isActiveDropTarget={dragOverColumn === column.key}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragOverColumn !== column.key) {
                          setDragOverColumn(column.key);
                        }
                      }}
                      onDrop={handleMyColumnDrop}
                      onDragStart={(event, task) => handleDragStart(event, task, "my")}
                      onDragEnd={handleDragEnd}
                      draggingTaskId={draggingTask?.bookingProcedureId || ""}
                      updatingTaskId={updatingTaskId}
                    />
                  ))}
                </div>
              </div>
            )
          ) : salonTasks.length === 0 ? (
            <EmptyState
              title={language === "vi" ? "Không có nhiệm vụ salon" : "No salon tasks"}
              description={language === "vi" ? "Hiện không có thủ thuật đặt chỗ nào đang tiến hành trong hàng đợi salon." : "There are no in-progress booking procedures visible in the salon queue right now."}
            />
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
                {BOARD_COLUMNS_TRANSLATED.map((column) => (
                  <BoardColumn
                    key={column.key}
                    column={column}
                    tasks={salonTasksByColumn[column.key] || []}
                    isActiveDropTarget={dragOverColumn === column.key}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragOverColumn !== column.key) {
                        setDragOverColumn(column.key);
                      }
                    }}
                    onDrop={handleSalonColumnDrop}
                    onDragStart={(event, task) => handleDragStart(event, task, "salon")}
                    onDragEnd={handleDragEnd}
                    draggingTaskId={draggingTask?.bookingProcedureId || ""}
                    updatingTaskId={updatingTaskId}
                    emptyText={column.key === "Pending" ? "No salon tasks here" : "No tasks in this status"}
                    renderTask={(task, hideHeader) => {
                      const canDrag = canTaskBeDragged(task, currentStaffArtistId);
                      const isAssigned = isTaskAssigned(task);
                      const isAssignedToCurrentArtist = isTaskAssignedToCurrentArtist(
                        task,
                        currentStaffArtistId,
                      );
                      const isBlockedBySequence =
                        Boolean(task?.isBlockedBySequence) && normalizeStatusKey(task?.status) === "Pending";
                      const isClaimable =
                        column.key === "Pending" &&
                        !isAssigned &&
                        !isBlockedBySequence;

                      return (
                        <BoardTaskCard
                          key={task.bookingProcedureId}
                          task={task}
                          onDragStart={(event, currentTask) => handleDragStart(event, currentTask, "salon")}
                          onDragEnd={handleDragEnd}
                          isDragging={draggingTask?.bookingProcedureId === task.bookingProcedureId}
                          isUpdating={updatingTaskId === task.bookingProcedureId}
                          canDrag={canDrag}
                          hideHeader={hideHeader}
                          ownerLabel={
                            isAssigned
                              ? getTaskOwnerLabel(task, language === "vi" ? "Đã nhận" : "Assigned")
                              : (language === "vi" ? "Chưa nhận" : "Unassigned")
                          }
                          footerHint={
                            isBlockedBySequence
                              ? (language === "vi" ? "Nhận theo thứ tự bước booking" : "Claim follows the booking step order")
                              : canDrag
                                ? (language === "vi" ? "Kéo để di chuyển nhiệm vụ này" : "Drag to move this task")
                                : isAssignedToCurrentArtist
                                  ? (language === "vi" ? "Nhận nhiệm vụ này trước khi cập nhật trạng thái" : "Claim this task before updating status")
                                  : isAssigned
                                    ? (language === "vi" ? "Chỉ thợ đã nhận bước này mới có thể di chuyển" : "Only the staff who claimed this step can move it")
                                    : (language === "vi" ? "Nhận nhiệm vụ này trước khi cập nhật trạng thái" : "Claim this task before updating status")
                          }
                          primaryAction={
                            isClaimable ? (
                              <button
                                type="button"
                                onClick={() => void handleClaimTask(task)}
                                disabled={claimingTaskId === task.bookingProcedureId}
                                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-3 py-1 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {claimingTaskId === task.bookingProcedureId ? (language === "vi" ? "Đang nhận..." : "Claiming...") : (language === "vi" ? "Nhận" : "Claim")}
                              </button>
                            ) : undefined
                          }
                          secondaryAction={
                            <Link
                              to={task.bookingId ? getStaffBookingDetailRoute(task.bookingId) : ROUTES.staffBookings}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f3d5e2] bg-white px-3 py-1 text-[11px] font-bold text-[#d94f92] transition hover:bg-[#fff5fa]"
                            >
                              View
                              <ArrowRight size={12} />
                            </Link>
                          }
                        />
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#f5b455_0%,#db8520_100%)] text-white shadow-[0_12px_24px_rgba(219,133,32,0.18)]">
            <TimerReset size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#402542]">{language === "vi" ? "Cách hoạt động" : "How this screen works"}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <MiniInfo label={language === "vi" ? "Nhiệm vụ của tôi" : "My Tasks"} value={language === "vi" ? "Kéo thẻ sang cột khác để cập nhật trạng thái thực tế." : "Drag a card into another column to update its real status."} />
              <MiniInfo label={language === "vi" ? "Nhiệm vụ Salon" : "Salon Tasks"} value={language === "vi" ? "Tất cả các bước đều hiển thị, nhưng các bước bị khóa không thể nhận được cho đến khi các bước bắt buộc trước đó hoàn thành." : "All salon steps stay visible, but blocked pending steps cannot be claimed until the earlier required step is done."} />
              <MiniInfo label={language === "vi" ? "Không có nút Thêm" : "No Add Button"} value={language === "vi" ? "Bảng này chỉ phản ánh các thủ thuật booking từ backend." : "This board only reflects backend booking procedures, no manual task creation."} />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
