import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { managerRoutes } from "./managerRoutes";
import { publicRoutes } from "./publicRoutes";
import { receptionistRoutes } from "./receptionistRoutes";
import { staffRoutes } from "./staffRoutes";
import { ROUTES } from "../../shared/constants/routes";
import { HandTryOnPage } from "../../features/virtual-try-on/hand-try-on/HandTryOnPage";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...staffRoutes,
  ...receptionistRoutes,
  ...managerRoutes,
  {
    path: ROUTES.adminNailVariantCreateTryOn,
    element: <HandTryOnPage />,
  },
  {
    path: ROUTES.adminNailVariantTryOn,
    element: <HandTryOnPage />,
  },
  ...adminRoutes,
]);
