import { Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { LoginPage } from "../../features/core/auth/pages/LoginPage";
import { GuestGuard } from "../../shared/components/guards/GuestGuard";
import { ROUTES } from "../../shared/constants/routes";

export const publicRoutes = [
  {
    path: ROUTES.root,
    element: <Navigate to={ROUTES.login} replace />,
  },
  {
    element: (
      <GuestGuard>
        <PublicLayout />
      </GuestGuard>
    ),
    children: [
      {
        path: ROUTES.login,
        element: <LoginPage />,
      },
    ],
  },
];
