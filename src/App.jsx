import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./app/router/AppRouter";
import { NotificationProvider } from "./features/core/notifications/context/NotificationContext";

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </NotificationProvider>
  );
}

export default App;
