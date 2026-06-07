import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { StaffDashboardPage } from "../../features/core/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/core/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/core/booking-management/pages/BookingCreatePage";
import { BookingDetailPage } from "../../features/core/booking-management/pages/BookingDetailPage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const receptionistRoutes = [
  {
    path: ROUTES.receptionistRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.receptionist]}>
          <DashboardLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.receptionistDashboard} replace />,
      },
      {
        path: ROUTES.receptionistDashboard,
        element: <StaffDashboardPage />,
      },
      {
        path: ROUTES.receptionistBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTES.receptionistBookingsCreate,
        element: <BookingCreatePage />,
      },
      {
        path: ROUTES.receptionistBookingDetail,
        element: <BookingDetailPage />,
      },
    ],
  },
];
