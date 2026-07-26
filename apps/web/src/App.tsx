import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";

export const App = () => {
  switch (window.location.pathname.replace(/\/+$/, "") || "/") {
    case "/login":
      return <AuthPage mode="login" />;
    case "/register":
      return <AuthPage mode="register" />;
    case "/app":
      return <DashboardPage />;
    default:
      return <LandingPage />;
  }
};
