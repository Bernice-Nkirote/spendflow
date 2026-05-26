import { useEffect, useState } from "react";

import AppLoader from "./components/ui/AppLoader";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsInitializing(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isInitializing) {
    return <AppLoader />;
  }

  return <AppRoutes />;
}

export default App;
