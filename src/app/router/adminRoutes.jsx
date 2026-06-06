import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AdminDashboardPage } from "../../features/dashboard/pages/AdminDashboardPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
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
        path: ROUTES.adminSalons,
        element: <SalonManagementPage />,
      },
      {
        path: ROUTES.adminSalonsCreate,
        element: <SalonCreatePage />,
      },
      {
        path: "salons/:salonId/edit",
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
        path: "staff/:staffId/edit",
        element: <StaffUpdatePage />,
      },
      {
        path: ROUTES.adminUsers,
        element: <UserManagementPage />,
      },
      {
        path: ROUTES.adminUsersCreate,
        element: <UserManagementCreatePage />,
      },
      {
        path: "/admin/users/:userId",
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
