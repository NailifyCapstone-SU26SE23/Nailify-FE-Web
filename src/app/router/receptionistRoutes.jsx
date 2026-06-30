import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ReceptionistDashboardPage } from "../../features/core/dashboard/pages/ReceptionistDashboardPage";
import { ReceptionistBookingListPage } from "../../features/receptionist/bookings/pages/ReceptionistBookingListPage";
import { ReceptionistBookingCreatePage } from "../../features/receptionist/bookings/pages/ReceptionistBookingCreatePage";
import { ReceptionistBookingDetailPage } from "../../features/receptionist/bookings/pages/ReceptionistBookingDetailPage";
import { ReceptionistCheckoutPaymentPage } from "../../features/receptionist/payment";
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
        element: <ReceptionistDashboardPage />,
      },
      {
        path: ROUTES.receptionistBookings,
        element: <ReceptionistBookingListPage />,
      },
      {
        path: ROUTES.receptionistBookingsCreate,
        element: <ReceptionistBookingCreatePage />,
      },
      {
        path: ROUTES.receptionistBookingDetail,
        element: <ReceptionistBookingDetailPage />,
      },
      {
        path: ROUTES.receptionistBookingCheckout,
        element: <ReceptionistCheckoutPaymentPage />,
      },
    ],
  },
];
