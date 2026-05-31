import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { StaffDashboardPage } from "../../features/dashboard/pages/StaffDashboardPage";
import { AuthGuard } from "../../shared/guards/AuthGuard";
import { RoleGuard } from "../../shared/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";

export const staffRoutes = [
  {
    path: ROUTES.staffRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.staff]}>
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
    ],
  },
];
