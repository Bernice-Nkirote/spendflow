import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import { getMyPendingApprovalQueue } from "../../features/approvals/api/approvalApi";
import type { ApprovalInstance } from "../../features/approvals/types/approval.types";
import GlobalSearch from "../../features/global-search/components/GlobalSearch";
import MyTasksDropdown from "../../features/tasks/components/MyTasksDropdown";

type TopbarProps = {
  onMenuClick?: () => void;
};

type StoredUser = {
  name?: string;
  email?: string;
  company_name?: string;
  role_name?: string;
};

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return parts[0][0]?.toUpperCase() || "U";
  }

  return email?.[0]?.toUpperCase() || "U";
}

function getPendingAgeLabel(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursOld = Math.floor((now - createdTime) / (1000 * 60 * 60));

  if (hoursOld >= 48) {
    return "Over 48h pending";
  }

  if (hoursOld >= 24) {
    return "Over 24h pending";
  }

  if (hoursOld >= 1) {
    return `${hoursOld}h pending`;
  }

  return "New";
}

function isUrgentApproval(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursOld = (now - createdTime) / (1000 * 60 * 60);

  return hoursOld >= 24;
}

function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [approvalNotifications, setApprovalNotifications] = useState<
    ApprovalInstance[]
  >([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const storedUser = localStorage.getItem("user");
  const user: StoredUser | null = storedUser ? JSON.parse(storedUser) : null;

  const displayName = user?.name || "User";
  const displaySubtitle =
    user?.company_name && user?.role_name
      ? `${user.company_name} â€¢ ${user.role_name}`
      : user?.email || "Company Workspace";

  const initials = getInitials(user?.name, user?.email);

  const urgentCount = useMemo(() => {
    return approvalNotifications.filter((item) =>
      isUrgentApproval(item.created_at),
    ).length;
  }, [approvalNotifications]);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);

      const response = await getMyPendingApprovalQueue({
        page: 1,
        pageSize: 5,
      });

      setApprovalNotifications(response.rows);
      setNotificationCount(response.total_count);
    } catch {
      setApprovalNotifications([]);
      setNotificationCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    function handleApprovalNotificationsRefresh() {
      loadNotifications();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        loadNotifications();
      }
    }

    window.addEventListener(
      "approval-notifications:refresh",
      handleApprovalNotificationsRefresh,
    );
    window.addEventListener("focus", handleApprovalNotificationsRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "approval-notifications:refresh",
        handleApprovalNotificationsRefresh,
      );
      window.removeEventListener("focus", handleApprovalNotificationsRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 lg:hidden"
            aria-label="Open navigation menu"
          >
            â˜°
          </button>

          <div className="min-w-0 max-w-[9.5rem] sm:max-w-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-blue">
              Tendaflow
            </p>

            <h2 className="truncate text-sm font-semibold text-primary-black sm:text-lg">
              Procurement Management
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 text-right lg:block">
            <p className="truncate text-sm font-semibold text-primary-black">
              {displayName}
            </p>

            <p className="hidden truncate text-xs text-primary-gray lg:block">
              {displaySubtitle}
            </p>
          </div>

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-bold text-white shadow-sm lg:flex">
            {initials}
          </div>
          <div className="hidden sm:block xl:hidden">
            <GlobalSearch placeholder="Search Tendaflow..." variant="overlay" />
          </div>

          <div className="hidden xl:block">
            <GlobalSearch placeholder="Search Tendaflow..." variant="inline" />
          </div>

          <MyTasksDropdown />

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-[20px] text-primary-blue shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-blue/20 hover:bg-blue-50 hover:shadow-md"
              aria-label="Open notifications"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-5 text-primary-blue"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 px-1 text-[11px] font-bold text-red-600 shadow-sm">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="fixed left-3 right-3 top-20 z-50 rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-96">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-primary-black">
                      Notifications
                    </h3>
                    <p className="mt-1 text-xs text-primary-gray">
                      Approvals requering your attention.
                    </p>
                  </div>

                  {urgentCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm">
                      ðŸš© {urgentCount} urgent
                    </span>
                  )}
                </div>

                {notificationsLoading ? (
                  <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
                    Loading notifications...
                  </p>
                ) : approvalNotifications.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
                    No pending approvals for you right now.
                  </p>
                ) : (
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(39,76,119,0.35)_transparent]">
                    {approvalNotifications.map((item) => (
                      <Link
                        key={item.id}
                        to={`/approvals/${item.id}`}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-blue/20 hover:bg-blue-50/30 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-primary-black">
                              {item.entity_reference ?? "Approval request"}
                            </p>
                            <p className="mt-1 text-xs text-primary-gray">
                              {item.entity_type} â€¢{" "}
                              {item.current_level_name ?? "Current level"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                              isUrgentApproval(item.created_at)
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-primary-blue"
                            }`}
                          >
                            {getPendingAgeLabel(item.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-xs text-primary-gray">
                          Requested by {item.requester_name ?? "Unknown user"}
                        </p>
                      </Link>
                    ))}

                    <Link
                      to="/approvals"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="block rounded-2xl bg-primary-blue px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-blue/90 hover:shadow-md"
                    >
                      View all approvals
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleLogout}
            className="hidden lg:inline-flex"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-bold text-white shadow-sm">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary-black">
              {displayName}
            </p>
            <p className="truncate text-xs text-primary-gray">
              {displaySubtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="sm:hidden">
            <GlobalSearch placeholder="Search Tendaflow..." variant="overlay" />
          </div>
          <Button type="button" variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
