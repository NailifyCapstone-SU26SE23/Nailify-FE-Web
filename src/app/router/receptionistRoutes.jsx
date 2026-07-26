import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProfilePage } from "../../features/core/auth/pages/profilePage";
import { ReceptionistDashboardPage } from "../../features/core/dashboard/pages/ReceptionistDashboardPage";
import { ReceptionistBookingListPage } from "../../features/receptionist/bookings/pages/ReceptionistBookingListPage";
import { ReceptionistBookingDetailPage } from "../../features/receptionist/bookings/pages/ReceptionistBookingDetailPage";
import { ReceptionistCheckoutPaymentPage } from "../../features/receptionist/payments";
import {
  ReceptionistCustomerCreatePage,
  ReceptionistCustomerListPage,
  ReceptionistCustomerDetailPage
} from "../../features/receptionist/customers";
import { ReceptionistWalkInBookingCreatePage } from "../../features/receptionist/walk-in-bookings";
import { ReceptionistBreaksPage } from "../../features/core/breaks/pages/ReceptionistBreaksPage";
import { WalkInQueuePage } from "../../features/manager/bookings/pages/WalkInQueuePage";
import { ManagerWaitlistPage } from "../../features/manager/bookings/pages/ManagerWaitlistPage";
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
        path: ROUTES.receptionistProfile,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.receptionistBookings,
        element: <ReceptionistBookingListPage />,
      },
      {
        path: ROUTES.receptionistQueue,
        element: <WalkInQueuePage />,
      },
      {
        path: ROUTES.receptionistWaitlist,
        element: <ManagerWaitlistPage />,
      },
      {
        path: ROUTES.receptionistBookingsCreate,
        element: <ReceptionistWalkInBookingCreatePage />,
      },
      {
        path: ROUTES.receptionistCustomers,
        element: <ReceptionistCustomerListPage />,
      },
      {
        path: ROUTES.receptionistCustomersCreate,
        element: <ReceptionistCustomerCreatePage />,
      },
      {
        path: ROUTES.receptionistCustomerDetail,
        element: <ReceptionistCustomerDetailPage />,
      },
      {
        path: ROUTES.receptionistBookingDetail,
        element: <ReceptionistBookingDetailPage />,
      },
      {
        path: ROUTES.receptionistBookingCheckout,
        element: <ReceptionistCheckoutPaymentPage />,
      },
      {
        path: ROUTES.receptionistBreaks,
        element: <ReceptionistBreaksPage />,
      },
    ],
  },
];
