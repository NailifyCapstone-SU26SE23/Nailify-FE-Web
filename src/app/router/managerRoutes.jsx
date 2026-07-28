import { Navigate } from "react-router-dom";
import { ManagerLayout } from "../layouts/ManagerLayout";
import { ProfilePage } from "../../features/core/auth/pages/profilePage";
import { ManagerDashboardPage } from "../../features/core/dashboard/pages/ManagerDashboardPage";
import { BookingCreatePage } from "../../shared/bookings/pages/BookingCreatePage";
import { ManagerBookingDetailPage } from "../../features/manager/bookings/pages/ManagerBookingDetailPage";
import { ManagerBookingListPage } from "../../features/manager/bookings/pages/ManagerBookingListPage";
import { RescheduleBooking } from "../../features/manager/bookings/pages/RescheduleBooking";
import { BookingRatingListPage } from "../../features/manager/bookings/pages/BookingRatingListPage";
import { StaffCreatePage } from "../../features/manager/staff-artist-management/pages/StaffCreatePage";
import { StaffManagementPage } from "../../features/manager/staff-artist-management/pages/StaffManagementPage";
import { StaffUpdatePage } from "../../features/manager/staff-artist-management/pages/StaffUpdatePage";
import { CustomerNailPage } from "../../features/manager/customer-nail/pages/CustomerNailPage";
import { CustomerNailDetailPage } from "../../features/manager/customer-nail/pages/CustomerNailDetailPage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";
import { TransactionManagementPage } from "../../features/manager/transaction-management/pages/TransactionManagementPage";
import { ManagerSchedulesPage } from "../../features/manager/schedules/pages/ManagerSchedulesPage";
import { ManagerArtistBreakPage } from "../../features/manager/breaks/pages/ManagerArtistBreakPage";
import { ChairsPage } from "../../features/core/chairs/pages/ChairsPage";

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
        path: ROUTES.managerReschedule,
        element: <RescheduleBooking />,
      },
      {
        path: ROUTES.managerSchedules,
        element: <ManagerSchedulesPage />,
      },
      {
        path: ROUTES.managerBreaks,
        element: <ManagerArtistBreakPage />,
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
        path: ROUTES.managerTransactions,
        element: <TransactionManagementPage />,
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
      {
        path: ROUTES.managerBookingRatings,
        element: <BookingRatingListPage />,
      },
      {
        path: ROUTES.managerChairs,
        element: <ChairsPage />,
      },
    ],
  },
];
