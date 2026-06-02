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
