import { Alert, Spin } from "antd";
import {
  ArrowRight,
  CheckCircle2,
  GripVertical,
  Layers3,
  RefreshCw,
  Sparkles,
  TimerReset,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { ROUTES, getStaffBookingDetailRoute } from "../../../../shared/constants/routes";
import { formatDate } from "../../../../shared/utils/formatDate";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import {
  claimStaffTask,
  fetchAssignedStaffTasks,
  fetchClaimableSalonTasks,
  updateStaffTaskStatus,
} from "../services/staffTaskService";

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
      <h2 className="text-sm font-extrabold text-[#402542]">{title}</h2>
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

function formatTaskTime(value) {
  if (!value) return "--";

  const directTimeMatch = String(value).match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (directTimeMatch) {
    return directTimeMatch[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function MiniInfo({ label, value, className = "" }) {
  return (
    <div className={`rounded-[12px] border px-2.5 py-2 ${className || "border-[#f7d8e5] bg-white/80"}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c08aa4]">{label}</p>
      <p className="mt-1 text-[11px] font-bold text-[#402542]">{value || "--"}</p>
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

function canTaskBeDragged(task) {
  return isTaskAssigned(task);
}

function getTaskOwnerLabel(task, fallbackLabel = "Assigned to you") {
  return task?.assignedArtistName || fallbackLabel;
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
}) {
  const theme = getTaskTheme(task);

  return (
    <div
      draggable={canDrag && !isUpdating}
      onDragStart={canDrag ? (event) => onDragStart(event, task) : undefined}
      onDragEnd={onDragEnd}
      className={`rounded-[18px] border p-3 transition ${theme.cardClassName} ${
        isDragging ? "rotate-[1deg] opacity-60" : "hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(236,72,153,0.12)]"
      } ${isUpdating ? "cursor-wait opacity-70" : canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${theme.chipClassName}`}>
              Step {task.stepOrder || 0}
            </span>
            {task.isMainStep ? (
              <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${theme.chipClassName}`}>
                Main
              </span>
            ) : null}
          </div>
          <h3 className="mt-2.5 text-[14px] font-extrabold leading-5 text-[#402542]">{task.procedureName}</h3>
        </div>

        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${theme.handleClassName}`}>
          {canDrag ? <GripVertical size={14} /> : <Sparkles size={14} />}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniInfo label="Customer" value={task.customerName} className={theme.infoClassName} />
        <MiniInfo label="Chair" value={task.chairName || "--"} className={theme.infoClassName} />
        <MiniInfo
          label="Booking Date"
          value={formatDate(task.bookingDate) || "--"}
          className={theme.infoClassName}
        />
        <MiniInfo
          label="Duration"
          value={formatDurationMinutes(task.duration)}
          className={theme.infoClassName}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] font-bold text-[#8f7184]">
        <span>{formatTaskTime(task.startTime)}</span>
        <span>{task.canOverlap ? "Overlap OK" : "Sequential step"}</span>
      </div>

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
              View
              <ArrowRight size={12} />
            </Link>
          ))}
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
  return (
    <div
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, column.key)}
      className={`flex h-[540px] min-w-[290px] flex-col overflow-hidden rounded-[24px] border p-4 transition ${column.ringClassName} ${column.panelClassName} ${
        isActiveDropTarget ? "scale-[1.01] shadow-[0_18px_36px_rgba(236,72,153,0.12)]" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.dotClassName}`} />
          <h3 className="text-sm font-extrabold text-[#402542]">{column.label}</h3>
          <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${column.badgeClassName}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="flex h-[140px] items-center justify-center rounded-[18px] border border-dashed border-[#efcadd] bg-white/70 px-4 text-center text-[12px] font-semibold text-[#b07a94]">
            {emptyText}
          </div>
        ) : (
          tasks.map((task) => (
            renderTask ? renderTask(task) : (
              <BoardTaskCard
                key={task.bookingProcedureId}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggingTaskId === task.bookingProcedureId}
                isUpdating={updatingTaskId === task.bookingProcedureId}
              />
            )
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

  const loadTasks = useCallback(async (options = {}) => {
    const { silent = false } = options;

    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const [assignedData, claimableData] = await Promise.all([
        fetchAssignedStaffTasks(),
        fetchClaimableSalonTasks(),
      ]);

      setMyTasks(assignedData);
      setSalonTasks(claimableData);
    } catch (err) {
      console.error("Failed to load staff tasks:", err);
      setError(err?.message || "Failed to load tasks.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleClaimTask = useCallback(async (task) => {
    try {
      setClaimingTaskId(task.bookingProcedureId);
      await claimStaffTask(task.bookingProcedureId);
      await loadTasks({ silent: true });
      setActiveTab("my");
    } catch (err) {
      console.error("Failed to claim task:", err);
      setError(err?.message || "Failed to claim task.");
    } finally {
      setClaimingTaskId("");
    }
  }, [loadTasks]);

  const handleDragStart = useCallback((event, task, source = "my") => {
    if (!canTaskBeDragged(task)) {
      event.preventDefault();
      return;
    }

    setDraggingTask(task);
    setDraggingSource(source);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.bookingProcedureId);
  }, []);

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

    const previousTasks = myTasks;
    const optimisticTasks = myTasks.map((task) =>
      task.bookingProcedureId === draggingTask.bookingProcedureId
        ? { ...task, status: nextStatus }
        : task,
    );

    try {
      setUpdatingTaskId(draggingTask.bookingProcedureId);
      setMyTasks(optimisticTasks);

      const updatedTask = await updateStaffTaskStatus(
        draggingTask.bookingProcedureId,
        nextStatus,
      );

      setMyTasks((current) =>
        current.map((task) =>
          task.bookingProcedureId === updatedTask.bookingProcedureId ? updatedTask : task,
        ),
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
      setMyTasks(previousTasks);
      setError(err?.message || "Failed to update task status.");
    } finally {
      setUpdatingTaskId("");
      setDraggingTask(null);
      setDraggingSource("");
    }
  }, [draggingSource, draggingTask, myTasks]);

  const handleSalonColumnDrop = useCallback(async (event, nextStatus) => {
    event.preventDefault();
    setDragOverColumn("");

    if (!draggingTask || draggingSource !== "salon") {
      return;
    }

    if (!canTaskBeDragged(draggingTask)) {
      setError("Claim this task before moving it to another status.");
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

    const previousTasks = salonTasks;
    const optimisticTasks = salonTasks.map((task) =>
      task.bookingProcedureId === draggingTask.bookingProcedureId
        ? { ...task, status: nextStatus }
        : task,
    );

    try {
      setUpdatingTaskId(draggingTask.bookingProcedureId);
      setSalonTasks(optimisticTasks);

      const updatedTask = await updateStaffTaskStatus(
        draggingTask.bookingProcedureId,
        nextStatus,
      );

      setSalonTasks((current) =>
        current.map((task) =>
          task.bookingProcedureId === updatedTask.bookingProcedureId ? updatedTask : task,
        ),
      );
    } catch (err) {
      console.error("Failed to update salon task status:", err);
      setSalonTasks(previousTasks);
      setError(err?.message || "Failed to update salon task status.");
    } finally {
      setUpdatingTaskId("");
      setDraggingTask(null);
      setDraggingSource("");
    }
  }, [draggingSource, draggingTask, salonTasks]);

  const myTasksByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce((groups, column) => {
      groups[column.key] = myTasks.filter(
        (task) => normalizeStatusKey(task.status) === column.key,
      );
      return groups;
    }, {});
  }, [myTasks]);

  const salonTasksByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce((groups, column) => {
      groups[column.key] = salonTasks.filter(
        (task) => normalizeStatusKey(task.status) === column.key,
      );
      return groups;
    }, {});
  }, [salonTasks]);

  const stats = useMemo(() => {
    const requiredMyTasks = myTasks.filter((task) => task.isRequired).length;
    const overlapReadyTasks = salonTasks.filter((task) => task.canOverlap).length;

    return [
      {
        key: "assigned",
        title: "Assigned",
        value: myTasks.length,
        note: "Tasks currently assigned to you",
        icon: UserRoundCheck,
        toneClassName: "bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93]",
      },
      {
        key: "claimable",
        title: "Claimable",
        value: salonTasks.length,
        note: "Open tasks ready to be claimed",
        icon: Sparkles,
        toneClassName: "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]",
      },
      {
        key: "required",
        title: "Required",
        value: requiredMyTasks,
        note: "Required steps in your queue",
        icon: CheckCircle2,
        toneClassName: "bg-gradient-to-br from-[#34d399] to-[#059669]",
      },
      {
        key: "overlap",
        title: "Overlap Ready",
        value: overlapReadyTasks,
        note: "Claimable tasks that can overlap",
        icon: Layers3,
        toneClassName: "bg-gradient-to-br from-[#f59e0b] to-[#d97706]",
      },
    ];
  }, [myTasks, salonTasks]);

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
              title="Task Queue"
              subtitle={
                activeTab === "my"
                  ? "Drag tasks between columns to update their working status."
                  : "Claim unlocked salon tasks and move them into your own queue."
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
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" tip="Loading tasks..." />
            </div>
          ) : activeTab === "my" ? (
            myTasks.length === 0 ? (
              <EmptyState
                title="No assigned tasks"
                description="You currently do not have any active booking procedures assigned."
              />
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {BOARD_COLUMNS.map((column) => (
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
              title="No claimable salon tasks"
              description="There are no open booking procedures ready for self-claim right now."
            />
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
                {BOARD_COLUMNS.map((column) => (
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
                    emptyText={column.key === "Pending" ? "No claimable tasks here" : "No tasks in this status"}
                    renderTask={(task) => {
                      const canDrag = canTaskBeDragged(task);
                      const isClaimable = column.key === "Pending" && !canDrag;

                      return (
                        <BoardTaskCard
                          key={task.bookingProcedureId}
                          task={task}
                          onDragStart={(event, currentTask) => handleDragStart(event, currentTask, "salon")}
                          onDragEnd={handleDragEnd}
                          isDragging={draggingTask?.bookingProcedureId === task.bookingProcedureId}
                          isUpdating={updatingTaskId === task.bookingProcedureId}
                          canDrag={canDrag}
                          ownerLabel={canDrag ? getTaskOwnerLabel(task) : "Unassigned"}
                          footerHint={canDrag ? "Drag to move this task" : "Claim this task before updating status"}
                          primaryAction={
                            isClaimable ? (
                              <button
                                type="button"
                                onClick={() => void handleClaimTask(task)}
                                disabled={claimingTaskId === task.bookingProcedureId}
                                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-3 py-1 text-[11px] font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {claimingTaskId === task.bookingProcedureId ? "Claiming..." : "Claim"}
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
            <h3 className="text-sm font-extrabold text-[#402542]">How this screen works</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <MiniInfo label="My Tasks" value="Drag a card into another column to update its real status." />
              <MiniInfo label="Salon Tasks" value="Unassigned To Do tasks can be claimed, assigned tasks can be dragged across statuses." />
              <MiniInfo label="No Add Button" value="This board only reflects backend booking procedures, no manual task creation." />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
