import { useState, useCallback, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import {
  fetchNailArtists,
  getSalonId,
  getSalonIdAsync,
} from "../../staff-artist-management/services/nailArtistsService";
import { fetchSchedulesBySalonId, fetchNailArtistBreaks } from "../services/scheduleService";
import { calculateShiftHours } from "../utils/scheduleUtils";
import { AVATAR_GRADIENTS } from "../constants/scheduleConstants";

export function useSchedules() {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => dayjs().startOf("week").add(1, "day"));
  const [staffList, setStaffList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [breaksList, setBreaksList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) {
        setError("No salon ID found in session. Please log in as a salon manager.");
        setIsLoading(false);
        return;
      }

      const startDateStr = selectedWeekStart.format("YYYY-MM-DD");
      const endDateStr = selectedWeekStart.add(6, "day").format("YYYY-MM-DD");

      const [artistsData, schedulesData, breaksData] = await Promise.all([
        fetchNailArtists(salonId),
        fetchSchedulesBySalonId(salonId, {
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        fetchNailArtistBreaks({ pageNumber: 1, pageSize: 1000 }),
      ]);

      const rawArtists = Array.isArray(artistsData) ? artistsData : artistsData?.items || [];
      const mappedArtists = rawArtists.map((a, idx) => {
        const fullName =
          a.account?.fullName ||
          (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.fullName || a.name || "Staff Artist");
        const theme = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
        return {
          id: a.nailArtistId || a.id || a.staffId || a.userId,
          nailArtistId: a.nailArtistId || a.id,
          accountId: a.accountId || a.userId || a.id,
          name: fullName,
          phone: a.account?.phone || a.phone || "",
          avatar: a.account?.avatarUrl || a.avatarUrl || "",
          initials: fullName
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          gradient: theme.grad,
          ring: theme.ring,
          specialty: idx % 2 === 0 ? "Senior Gel Specialist" : "Nail Art Master",
        };
      });

      setStaffList(mappedArtists);
      setSchedulesList(Array.isArray(schedulesData) ? schedulesData : []);
      setBreaksList(Array.isArray(breaksData?.items) ? breaksData.items : (Array.isArray(breaksData) ? breaksData : []));
    } catch (err) {
      console.error("Failed to load staff schedules:", err);
      setError(err.message || "Failed to load staff schedules.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWeekStart]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const scheduleMatrix = useMemo(() => {
    const map = new Map();
    schedulesList.forEach((s) => {
      const scheduleArtistId = s.nailArtistId || s.artistId;
      const dateKey = dayjs(s.workDate || s.date).format("YYYY-MM-DD");
      const matchingStaff = staffList.find(
        (st) =>
          st.id === scheduleArtistId ||
          st.nailArtistId === scheduleArtistId ||
          st.accountId === scheduleArtistId
      );
      const targetId = matchingStaff ? matchingStaff.id : scheduleArtistId;
      const key = `${targetId}_${dateKey}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [schedulesList, staffList]);

  const breaksMatrix = useMemo(() => {
    const map = new Map();
    breaksList.forEach((b) => {
      const artistId = b.nailArtistId;
      const dateKey = dayjs(b.breakDate).format("YYYY-MM-DD");
      const matchingStaff = staffList.find(
        (st) =>
          st.id === artistId ||
          st.nailArtistId === artistId ||
          st.accountId === artistId
      );
      const targetId = matchingStaff ? matchingStaff.id : artistId;
      const key = `${targetId}_${dateKey}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [breaksList, staffList]);

  const totalWeeklyHours = useMemo(() => {
    return schedulesList.reduce((acc, s) => acc + calculateShiftHours(s.shiftStart, s.shiftEnd), 0);
  }, [schedulesList]);

  const activeTodayCount = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    return schedulesList.filter((s) => dayjs(s.workDate).format("YYYY-MM-DD") === todayStr).length;
  }, [schedulesList]);

  return {
    selectedWeekStart,
    setSelectedWeekStart,
    staffList,
    schedulesList,
    scheduleMatrix,
    breaksMatrix,
    isLoading,
    error,
    loadData,
    totalWeeklyHours,
    activeTodayCount
  };
}
