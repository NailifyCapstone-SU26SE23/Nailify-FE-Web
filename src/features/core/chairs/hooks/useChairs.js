import { useQuery } from "@tanstack/react-query";
import { chairsService } from "../services/chairsService";

export const CHAIRS_QUERY_KEYS = {
  all: ["chairs"],
  list: (salonId) => [...CHAIRS_QUERY_KEYS.all, "list", salonId],
  liveStatus: (salonId, date) => [...CHAIRS_QUERY_KEYS.all, "liveStatus", salonId, date],
  detail: (chairId) => [...CHAIRS_QUERY_KEYS.all, "detail", chairId],
};

export const useSalonChairs = (salonId) => {
  return useQuery({
    queryKey: CHAIRS_QUERY_KEYS.list(salonId),
    queryFn: () => chairsService.getChairsBySalon(salonId),
    enabled: !!salonId,
  });
};

export const useLiveChairStatus = (salonId, date) => {
  return useQuery({
    queryKey: CHAIRS_QUERY_KEYS.liveStatus(salonId, date),
    queryFn: () => chairsService.getLiveChairStatus(salonId, date),
    enabled: !!salonId && !!date,
    refetchInterval: 60000, // Optional: refetch every minute
  });
};

export const useChairDetail = (chairId) => {
  return useQuery({
    queryKey: CHAIRS_QUERY_KEYS.detail(chairId),
    queryFn: () => chairsService.getChairDetail(chairId),
    enabled: !!chairId,
  });
};
