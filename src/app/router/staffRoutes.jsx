import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { StaffDashboardPage } from "../../features/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/booking-management/pages/BookingCreatePage";
import { ReceptionistBookingDetailPage } from "../../features/booking-management/pages/ReceptionistBookingDetailPage";
import { StaffBookingDetailPage } from "../../features/booking-management/pages/StaffBookingDetailPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const staffRoutes = [
  {
    path: ROUTES.staffRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.staff, ROLES.receptionist]}>
          <DashboardLayout />
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
        path: ROUTES.receptionistBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTES.receptionistBookingsCreate,
        element: <BookingCreatePage />,
      },
      {
        path: ROUTES.staffBookingDetail,
        element: <StaffBookingDetailPage />,
      },
      {
        path: ROUTES.receptionistBookingDetail,
        element: <ReceptionistBookingDetailPage />,
      },
    ],
  },
];
