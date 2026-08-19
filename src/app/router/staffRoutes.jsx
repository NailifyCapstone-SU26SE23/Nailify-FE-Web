import { Navigate } from "react-router-dom";
import { StaffLayout } from "../layouts/StaffLayout";
import { ProfilePage } from "../../features/core/auth/pages/profilePage";
import { StaffDashboardPage } from "../../features/core/dashboard/pages/StaffDashboardPage";
import { StaffBookingListPage } from "../../features/staff/bookings/pages/StaffBookingListPage";
import { StaffBookingCreatePage } from "../../features/staff/bookings/pages/StaffBookingCreatePage";
import { StaffBookingDetailPage } from "../../features/staff/bookings/pages/StaffBookingDetailPage";
import { StaffNailDesignStudioPage } from "../../features/staff/bookings/pages/StaffNailDesignStudioPage";
import { StaffServiceSessionPage } from "../../features/staff/bookings/pages/StaffServiceSessionPage";
import { StaffUpdateBookingDesignPage } from "../../features/staff/bookings/pages/StaffUpdateBookingDesignPage";
import { StaffCustomerNailsListPage } from "../../features/staff/customer-nail/pages/StaffCustomerNailsListPage";
import { StaffCustomerNailReviewPage } from "../../features/staff/customer-nail/pages/StaffCustomerNailReviewPage";
import { StaffTasksPage } from "../../features/staff/task/pages/StaffTasksPage";
import { StaffWaittingPage } from "../../features/staff/waitting/pages/StaffWaittingPage";
import { StaffSchedulesPage } from "../../features/staff/schedules/pages/StaffSchedulesPage";
import { StaffBreaksPage } from "../../features/core/breaks/pages/StaffBreaksPage";
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
        path: ROUTES.staffProfile,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.staffBookings,
        element: <StaffBookingListPage />,
      },
      {
        path: ROUTES.staffTasks,
        element: <StaffTasksPage />,
      },
      {
        path: ROUTES.staffSchedules,
        element: <StaffSchedulesPage />,
      },
      {
        path: ROUTES.staffBookingsCreate,
        element: <StaffBookingCreatePage />,
      },
      {
        path: ROUTES.staffBookingDesignStudio,
        element: <StaffNailDesignStudioPage />,
      },
      {
        path: ROUTES.staffBookingDesignUpdate,
        element: <StaffUpdateBookingDesignPage />,
      },
      {
        path: ROUTES.staffBookingServiceSession,
        element: <StaffServiceSessionPage />,
      },
      {
        path: ROUTES.staffBookingDetail,
        element: <StaffBookingDetailPage />,
      },
      {
        path: ROUTES.staffCustomerNails,
        element: <StaffCustomerNailsListPage />,
      },
      {
        path: ROUTES.staffCustomerNailDetail,
        element: <StaffCustomerNailReviewPage />,
      },
      {
        path: ROUTES.staffWaitting,
        element: <StaffWaittingPage />,
      },
      {
        path: ROUTES.staffBreaks,
        element: <StaffBreaksPage />,
      },
    ],
  },
];
