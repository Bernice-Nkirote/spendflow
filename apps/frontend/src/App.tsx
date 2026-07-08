import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import AppLoader from "./components/ui/AppLoader";
import ThemeToggle from "./components/ui/ThemeToggle";
import AppRoutes from "./routes/AppRoutes";

const authThemePaths = [
  "/login",
  "/company-signup",
  "/forgot-password",
  "/reset-password",
  "/setup-password",
  "/supplier-login",
  "/supplier-setup-password",
  "/supplier-forgot-password",
  "/supplier-reset-password",
];

function App() {
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  const showAuthThemeToggle = authThemePaths.some((path) =>
    location.pathname.startsWith(path),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsInitializing(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {showAuthThemeToggle && <ThemeToggle floating />}
      {isInitializing ? <AppLoader /> : <AppRoutes />}
    </>
  );
}

export default App;
