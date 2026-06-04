import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { StaffDashboardPage } from "../../features/dashboard/pages/StaffDashboardPage";
import { BookingListPage } from "../../features/bookings/pages/BookingListPage";
import { BookingManagementCreatePage } from "../../features/booking-management/pages/BookingManagementCreatePage";
import { ReceptionistBookingDetailPage } from "../../features/bookings/pages/ReceptionistBookingDetailPage";
import { StaffBookingDetailPage } from "../../features/bookings/pages/StaffBookingDetailPage";
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
        element: <BookingManagementCreatePage />,
      },
      {
        path: ROUTES.receptionistBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTES.receptionistBookingsCreate,
        element: <BookingManagementCreatePage />,
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
