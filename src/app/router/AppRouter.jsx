import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./adminRoutes";
import { managerRoutes } from "./managerRoutes";
import { publicRoutes } from "./publicRoutes";
import { receptionistRoutes } from "./receptionistRoutes";
import { staffRoutes } from "./staffRoutes";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...staffRoutes,
  ...receptionistRoutes,
  ...managerRoutes,
  ...adminRoutes,
]);
