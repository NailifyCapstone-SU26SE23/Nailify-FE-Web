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
