import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useInactivityLogout } from "../../features/auth/hooks/useInactivityLogout";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ConfirmDialog from "../ui/ConfirmDialog";
import ScrollToTopButton from "../ui/ScrollToTopButton";

function AppLayout() {
  const { isSessionWarningOpen, staySignedIn, logoutNow } =
    useInactivityLogout();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-primary-white">
      <ConfirmDialog
        isOpen={isSessionWarningOpen}
        title="Session expiring soon"
        message="You have been inactive. Your session will expire soon. Choose Stay Signed In to continue working."
        confirmLabel="Stay Signed In"
        cancelLabel="Logout"
        variant="warning"
        onConfirm={staySignedIn}
        onCancel={logoutNow}
      />
      <div className="flex min-w-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
          <ScrollToTopButton />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
