import { Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminDashboardPage } from "../../features/core/dashboard/pages/AdminDashboardPage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";
import { UserManagementPage } from "../../features/admin/user-management/pages/UserManagementPage";
import { UserManagementCreatePage } from "../../features/admin/user-management/pages/UserManagementCreatePage";
import { UserManagementDetailPage } from "../../features/admin/user-management/pages/UserManagementDetailPage";
import { SalonManagementPage } from "../../features/admin/salon-management/pages/SalonManagementPage";
import { SalonCreatePage } from "../../features/admin/salon-management/pages/SalonCreatePage";
import { SalonUpdatePage } from "../../features/admin/salon-management/pages/SalonUpdatePage";
import { StaffManagementPage } from "../../features/admin/staff-management/pages/StaffManagementPage";
import { StaffCreatePage } from "../../features/admin/staff-management/pages/StaffCreatePage";
import { StaffUpdatePage } from "../../features/admin/staff-management/pages/StaffUpdatePage";
import { BookingListPage } from "../../features/core/booking-management/pages/BookingListPage";
import { BookingCreatePage } from "../../features/core/booking-management/pages/BookingCreatePage";
import { BookingDetailPage } from "../../features/core/booking-management/pages/BookingDetailPage";
import { NailDesignManagementPage } from "../../features/admin/nails-design-management/pages/NailDesignManagementPage";
import { NailDesignManagementCreatePage } from "../../features/admin/nails-design-management/pages/NailDesignManagementCreatePage";
import { NailDesignManagementDetailPage } from "../../features/admin/nails-design-management/pages/NailDesignManagementDetailPage";
import { ServicePricingManagementPage } from "../../features/admin/service-pricing-management/pages/ServicePricingManagementPage";

export const adminRoutes = [
  {
    path: ROUTES.adminRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.admin]}>
          <AdminLayout />
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
        element: <BookingDetailPage />,
      },
      {
        path: ROUTES.adminSalons,
        element: <SalonManagementPage />,
      },
      {
        path: ROUTES.adminSalonsCreate,
        element: <SalonCreatePage />,
      },
      {
        path: ROUTES.adminSalonUpdate,
        element: <SalonUpdatePage />,
      },
      {
        path: ROUTES.adminStaff,
        element: <StaffManagementPage />,
      },
      {
        path: ROUTES.adminStaffCreate,
        element: <StaffCreatePage />,
      },
      {
        path: ROUTES.adminStaffUpdate,
        element: <StaffUpdatePage />,
      },
      {
        path: ROUTES.adminUsers,
        element: <UserManagementPage />,
      },
      {
        path: ROUTES.adminServicePricing,
        element: <ServicePricingManagementPage />,
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
