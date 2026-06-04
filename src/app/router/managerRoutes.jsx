import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ManagerDashboardPage } from "../../features/dashboard/pages/ManagerDashboardPage";
import { BookingListPage } from "../../features/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/booking-management/pages/BookingCreatePage";
import { ManagerBookingDetailPage } from "../../features/booking-management/pages/ManagerBookingDetailPage";
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
        element: <BookingListPage />,
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
