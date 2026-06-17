import { Navigate } from "react-router-dom";
import { ManagerLayout } from "../layouts/ManagerLayout";
import { ManagerDashboardPage } from "../../features/core/dashboard/pages/ManagerDashboardPage";
import { BookingCreatePage } from "../../features/core/booking-management/pages/BookingCreatePage";
import { ManagerBookingDetailPage } from "../../features/manager/bookings/pages/ManagerBookingDetailPage";
import { ManagerBookingListPage } from "../../features/manager/bookings/pages/ManagerBookingListPage";
import { StaffCreatePage } from "../../features/manager/staff-artist-management/pages/StaffCreatePage";
import { StaffManagementPage } from "../../features/manager/staff-artist-management/pages/StaffManagementPage";
import { StaffUpdatePage } from "../../features/manager/staff-artist-management/pages/StaffUpdatePage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const managerRoutes = [
  {
    path: ROUTES.managerRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.manager]}>
          <ManagerLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.managerDashboard} replace />,
      },
      {
        path: ROUTES.managerDashboard,
        element: <ManagerDashboardPage />,
      },
      {
        path: ROUTES.managerBookings,
        element: <ManagerBookingListPage />,
      },
      {
        path: ROUTES.managerStaffArtists,
        element: <StaffManagementPage />,
      },
      {
        path: ROUTES.managerStaffArtistsCreate,
        element: <StaffCreatePage />,
      },
      {
        path: ROUTES.managerStaffArtistUpdate,
        element: <StaffUpdatePage />,
      },
      {
        path: ROUTES.managerBookingsCreate,
        element: <BookingCreatePage />,
      },
      {
        path: ROUTES.managerBookingDetail,
        element: <ManagerBookingDetailPage />,
      },
    ],
  },
];
