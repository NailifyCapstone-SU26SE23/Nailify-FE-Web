import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { StaffDashboardPage } from "../../features/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/booking-management/pages/BookingCreatePage";
import { ReceptionistBookingDetailPage } from "../../features/booking-management/pages/ReceptionistBookingDetailPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
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
        element: <ReceptionistBookingDetailPage />,
      },
    ],
  },
];
