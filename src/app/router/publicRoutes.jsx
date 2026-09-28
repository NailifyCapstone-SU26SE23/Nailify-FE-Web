import { Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { LoginPage } from "../../features/core/auth/pages/LoginPage";
import { ForgotPasswordPage } from "../../features/core/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../../features/core/auth/pages/ResetPasswordPage";
import { GuestGuard } from "../../shared/components/guards/GuestGuard";
import { ROUTES } from "../../shared/constants/routes";
import PaymentStatusPage, {
  PaymentCancelPage,
  PaymentSuccessPage,
} from "../../features/receptionist/payments/pages/PaymentStatusPage";

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
      {
        path: ROUTES.forgotPassword,
        element: <ForgotPasswordPage />,
      },
      {
        path: ROUTES.resetPassword,
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: ROUTES.paymentStatus,
    element: <PaymentStatusPage />,
  },
  {
    path: ROUTES.paymentSuccess,
    element: <PaymentSuccessPage />,
  },
  {
    path: ROUTES.paymentCancel,
    element: <PaymentCancelPage />,
  },
];