import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary-white">
      <div className="flex min-w-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 ">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
