import { RouterProvider } from "react-router-dom";
import { AppRoutes } from "../../routes/AppRoutes";

function AppContent() {
  return <RouterProvider router={AppRoutes} />;
}

export default AppContent;
