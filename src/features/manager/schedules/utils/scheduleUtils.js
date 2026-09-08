import { Zap, Star, Sun, Moon } from "lucide-react";

export function formatTimeSpan(timeSpanStr) {
  if (!timeSpanStr) return "N/A";
  const parts = String(timeSpanStr).trim().split(":");
  if (parts.length < 2) return timeSpanStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculateShiftHours(shiftStart, shiftEnd) {
  if (!shiftStart || !shiftEnd) return 0;
  const startParts = String(shiftStart).split(":").map(Number);
  const endParts = String(shiftEnd).split(":").map(Number);
  const startMinutes = (startParts[0] || 0) * 60 + (startParts[1] || 0);
  const endMinutes = (endParts[0] || 0) * 60 + (endParts[1] || 0);
  return Math.max(0, Math.round(((endMinutes - startMinutes) / 60) * 10) / 10);
}

// Determine shift badge styling based on start/end hours
export function getShiftTheme(shiftStart, shiftEnd) {
  const startHour = parseInt(String(shiftStart).split(":")[0], 10) || 8;
  const hours = calculateShiftHours(shiftStart, shiftEnd);

  if (hours <= 2 && hours > 0) {
    return {
      bg: "bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-[#F5F3FF]",
      border: "border-[#C4B5FD]",
      text: "text-[#5B21B6]",
      badgeBg: "bg-[#7C3AED]/15 text-[#6D28D9]",
      dot: "bg-[#8B5CF6]",
      label: "Short Shift",
      icon: Zap,
    };
  } else if (hours >= 10) {
    return {
      bg: "bg-gradient-to-r from-[#ECFDF5] via-[#D1FAE5] to-[#ECFDF5]",
      border: "border-[#86EFAC]",
      text: "text-[#065F46]",
      badgeBg: "bg-[#059669]/15 text-[#047857]",
      dot: "bg-[#10B981]",
      label: "Full Day Shift",
      icon: Star,
    };
  } else if (startHour < 11) {
    return {
      bg: "bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE] to-[#EFF6FF]",
      border: "border-[#93C5FD]",
      text: "text-[#1E40AF]",
      badgeBg: "bg-[#2563EB]/15 text-[#1D4ED8]",
      dot: "bg-[#3B82F6]",
      label: "Morning Shift",
      icon: Sun,
    };
  } else {
    return {
      bg: "bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB]",
      border: "border-[#FDE68A]",
      text: "text-[#92400E]",
      badgeBg: "bg-[#D97706]/15 text-[#B45309]",
      dot: "bg-[#F59E0B]",
      label: "Evening Shift",
      icon: Moon,
    };
  }
}
