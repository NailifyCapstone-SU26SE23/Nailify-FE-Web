import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { fetchSalons } from "../../../admin/salon-management/services/salonsService";

export const useAdminDashboard = (startDate, endDate, groupBy) => {
  return useQuery({
    queryKey: ["adminDashboard", startDate, endDate, groupBy],
    queryFn: () => dashboardService.getAdminDashboard(startDate, endDate, groupBy),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useManagerDashboard = (salonId, startDate, endDate, groupBy) => {
  return useQuery({
    queryKey: ["managerDashboard", salonId, startDate, endDate, groupBy],
    queryFn: () => dashboardService.getManagerDashboard(salonId, startDate, endDate, groupBy),
    staleTime: 5 * 60 * 1000,
    enabled: !!salonId,
  });
};

export const useStaffDashboard = (artistId, startDate, endDate) => {
  return useQuery({
    queryKey: ["staffDashboard", artistId, startDate, endDate],
    queryFn: () => dashboardService.getStaffDashboard(artistId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    enabled: !!artistId,
  });
};

export const useStaffSkills = (artistId) => {
  return useQuery({
    queryKey: ["staffSkills", artistId],
    queryFn: () => dashboardService.getStaffSkills(artistId),
    staleTime: 5 * 60 * 1000,
    enabled: !!artistId,
  });
};

export const useRecentUsers = () => {
  return useQuery({
    queryKey: ["recentUsersDashboard"],
    queryFn: () => dashboardService.getRecentUsers(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalonDetails = (salonId) => {
  return useQuery({
    queryKey: ["salonDetails", salonId],
    queryFn: () => dashboardService.getSalonDetails(salonId),
    enabled: !!salonId,
  });
};

export const useManagersList = () => {
  return useQuery({
    queryKey: ["managersList"],
    queryFn: () => dashboardService.getManagers(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStaffsList = () => {
  return useQuery({
    queryKey: ["staffsList"],
    queryFn: () => dashboardService.getStaffs(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalonsList = () => {
  return useQuery({
    queryKey: ["allSalonsList"],
    queryFn: fetchSalons,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalonStaffs = (salonId) => {
  return useQuery({
    queryKey: ["salonStaffs", salonId],
    queryFn: () => dashboardService.getSalonStaffs(salonId),
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useNailArtistDashboard = (artistId, startDate, endDate) => {
  return useQuery({
    queryKey: ["nailArtistDashboard", artistId, startDate, endDate],
    queryFn: () => dashboardService.getNailArtistDashboard(artistId, startDate, endDate),
    enabled: !!artistId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserDetail = (userId) => {
  return useQuery({
    queryKey: ["userDetail", userId],
    queryFn: () => dashboardService.getUserDetail(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useReceptionistDashboard = (salonId, date) => {
  return useQuery({
    queryKey: ["receptionistDashboard", salonId, date],
    queryFn: () => dashboardService.getReceptionistDashboard(salonId, date),
    enabled: !!salonId && !!date,
    staleTime: 5 * 60 * 1000,
  });
};

export const useWalkInQueue = (salonId) => {
  return useQuery({
    queryKey: ["walkInQueue", salonId],
    queryFn: () => dashboardService.getWalkInQueue(salonId),
    enabled: !!salonId,
  });
};

export const useWaitlist = (salonId) => {
  return useQuery({
    queryKey: ["waitlist", salonId],
    queryFn: () => dashboardService.getWaitlist(salonId),
    enabled: !!salonId,
  });
};

export const useStaffArtists = (salonId) => {
  return useQuery({
    queryKey: ["staffArtists", salonId],
    queryFn: () => dashboardService.getStaffArtists(salonId),
    enabled: !!salonId,
  });
};
