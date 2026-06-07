import { Navigate } from "react-router-dom";
import { StaffLayout } from "../layouts/StaffLayout";
import { StaffDashboardPage } from "../../features/core/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/core/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/core/booking-management/pages/BookingCreatePage";
import { BookingDetailPage } from "../../features/core/booking-management/pages/BookingDetailPage";
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
        path: ROUTES.staffBookingDetail,
        element: <BookingDetailPage />,
      },
    ],
  },
];
