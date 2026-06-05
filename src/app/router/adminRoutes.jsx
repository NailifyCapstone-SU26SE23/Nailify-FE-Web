import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AdminDashboardPage } from "../../features/dashboard/pages/AdminDashboardPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";
import { UserManagementPage } from "../../features/user-management/pages/UserManagementPage";
import { UserManagementCreatePage } from "../../features/user-management/pages/UserManagementCreatePage";
import { UserManagementDetailPage } from "../../features/user-management/pages/UserManagementDetailPage";
import { BookingListPage } from "../../features/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/booking-management/pages/BookingCreatePage";
import { AdminBookingDetailPage } from "../../features/booking-management/pages/AdminBookingDetailPage";
import { NailDesignManagementPage } from "../../features/nails-design-management/pages/NailDesignManagementPage";
import { NailDesignManagementCreatePage } from "../../features/nails-design-management/pages/NailDesignManagementCreatePage";
import { NailDesignManagementDetailPage } from "../../features/nails-design-management/pages/NailDesignManagementDetailPage";

export const adminRoutes = [
  {
    path: ROUTES.adminRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.admin]}>
          <DashboardLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.adminDashboard} replace />,
      },
      {
        path: ROUTES.adminDashboard,
        element: <AdminDashboardPage />,
      },
      {
        path: ROUTES.adminBookings,
        element: <BookingListPage />,
      },
      {
        path: ROUTES.adminBookingsCreate,
        element: <BookingCreatePage />,
      },
      {
        path: ROUTES.adminBookingDetail,
        element: <AdminBookingDetailPage />,
      },
      {
        path: ROUTES.adminUsers,
        element: <UserManagementPage />,
      },
      {
        path: ROUTES.adminNailDesigns,
        element: <NailDesignManagementPage />,
      },
      {
        path: ROUTES.adminNailDesignsCreate,
        element: <NailDesignManagementCreatePage />,
      },
      {
        path: ROUTES.adminNailDesignDetail,
        element: <NailDesignManagementDetailPage />,
      },
      {
        path: ROUTES.adminUsersCreate,
        element: <UserManagementCreatePage />,
      },
      {
        path: ROUTES.adminUserDetail,
        element: <UserManagementDetailPage />,
      },
      {
        path: "*",
        element: <Navigate to={ROUTES.adminDashboard} replace />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={ROUTES.login} replace />,
  },
];
