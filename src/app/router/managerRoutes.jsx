import { Navigate } from "react-router-dom";
import { ManagerLayout } from "../layouts/ManagerLayout";
import { ProfilePage } from "../../features/core/auth/pages/profilePage";
import { ManagerDashboardPage } from "../../features/core/dashboard/pages/ManagerDashboardPage";
import { BookingCreatePage } from "../../shared/bookings/pages/BookingCreatePage";
import { ManagerBookingDetailPage } from "../../features/manager/bookings/pages/ManagerBookingDetailPage";
import { ManagerBookingListPage } from "../../features/manager/bookings/pages/ManagerBookingListPage";
import { StaffCreatePage } from "../../features/manager/staff-artist-management/pages/StaffCreatePage";
import { StaffManagementPage } from "../../features/manager/staff-artist-management/pages/StaffManagementPage";
import { StaffUpdatePage } from "../../features/manager/staff-artist-management/pages/StaffUpdatePage";
import { CustomerNailPage } from "../../features/manager/customer-nail/pages/CustomerNailPage";
import { CustomerNailDetailPage } from "../../features/manager/customer-nail/pages/CustomerNailDetailPage";
import { ManagerWaitlistPage } from "../../features/manager/bookings/pages/ManagerWaitlistPage";
import { WalkInQueuePage } from "../../features/manager/bookings/pages/WalkInQueuePage";
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
        path: ROUTES.managerProfile,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.managerBookings,
        element: <ManagerBookingListPage />,
      },
      {
        path: ROUTES.managerWaitlist,
        element: <ManagerWaitlistPage />,
      },
      {
        path: ROUTES.managerQueue,
        element: <WalkInQueuePage />,
      },
      {
        path: ROUTES.managerCustomerNails,
        element: <CustomerNailPage />,
      },
      {
          path: ROUTES.managerCustomerNailDetail,
          element: <CustomerNailDetailPage />,
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
