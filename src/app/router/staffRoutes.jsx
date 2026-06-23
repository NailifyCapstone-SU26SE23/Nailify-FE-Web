import { Navigate } from "react-router-dom";
import { StaffLayout } from "../layouts/StaffLayout";
import { StaffDashboardPage } from "../../features/core/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/core/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/core/booking-management/pages/BookingCreatePage";
import { BookingDetailPage } from "../../features/core/booking-management/pages/BookingDetailPage";
import { StaffNailDesignStudioPage } from "../../features/staff/bookings/pages/StaffNailDesignStudioPage";
import { StaffServiceSessionPage } from "../../features/staff/bookings/pages/StaffServiceSessionPage";
import { StaffUpdateBookingDesignPage } from "../../features/staff/bookings/pages/StaffUpdateBookingDesignPage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const staffRoutes = [
  {
    path: ROUTES.staffRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.staff]}>
          <StaffLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.staffDashboard} replace />,
      },
      {
        path: ROUTES.staffDashboard,
        element: <StaffDashboardPage />,
      },
      {
        path: ROUTES.staffBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTES.staffBookingsCreate,
        element: <BookingCreatePage />,
      },
      {
        path: ROUTES.staffBookingDesignStudio,
        element: <StaffNailDesignStudioPage />,
      },
      {
        path: ROUTES.staffBookingDesignUpdate,
        element: <StaffUpdateBookingDesignPage />,
      },
      {
        path: ROUTES.staffBookingServiceSession,
        element: <StaffServiceSessionPage />,
      },
      {
        path: ROUTES.staffBookingDetail,
        element: <BookingDetailPage />,
      },
    ],
  },
];
