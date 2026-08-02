import { useAuth } from "./auth/AuthContext";
import { Navigate } from "./components/Link";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";

export const App = () => {
  const { session } = useAuth();

  switch (window.location.pathname.replace(/\/+$/, "") || "/") {
    case "/":
      return session ? <Navigate to="/dashboard" replace /> : <LandingPage />;
    case "/login":
      return <AuthPage mode="login" />;
    case "/register":
      return <AuthPage mode="register" />;
    case "/dashboard":
      return <DashboardPage />;
    case "/app":
      return <Navigate to="/dashboard" replace />;
    default:
      return session ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <Navigate to="/" replace />
      );
  }
};
