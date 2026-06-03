import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ManagerDashboardPage } from "../../features/dashboard/pages/ManagerDashboardPage";
import { BookingManagementPage } from "../../features/booking-management/pages/BookingManagementPage";
import { BookingManagementCreatePage } from "../../features/booking-management/pages/BookingManagementCreatePage";
import { BookingManagementDetailPage } from "../../features/booking-management/pages/BookingManagementDetailPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const managerRoutes = [
  {
    path: ROUTES.managerRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.manager]}>
          <DashboardLayout />
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
        element: <BookingManagementPage />,
      },
      {
        path: ROUTES.managerBookingsCreate,
        element: <BookingManagementCreatePage />,
      },
      {
        path: "/manager/bookings/:bookingId",
        element: <BookingManagementDetailPage />,
      },
    ],
  },
];
