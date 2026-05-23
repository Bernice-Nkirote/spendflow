import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

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

function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user: StoredUser | null = storedUser ? JSON.parse(storedUser) : null;

  const displayName = user?.name || "User";
  const displaySubtitle =
    user?.company_name && user?.role_name
      ? `${user.company_name} • ${user.role_name}`
      : user?.email || "Company Workspace";

  const initials = getInitials(user?.name, user?.email);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 lg:hidden"
            aria-label="Open navigation menu"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-blue">
              SpendFlow
            </p>

            <h2 className="truncate text-base font-semibold text-primary-black sm:text-lg">
              Procurement Management
            </h2>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold text-primary-black">
              {displayName}
            </p>
            <p className="truncate text-xs text-primary-gray">
              {displaySubtitle}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-bold text-white shadow-sm">
            {initials}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleLogout}
            className="hidden sm:inline-flex"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary-black">
            {displayName}
          </p>
          <p className="truncate text-xs text-primary-gray">
            {displaySubtitle}
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Topbar;
