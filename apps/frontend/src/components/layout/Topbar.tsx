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
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          ☰
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-primary-black">
            Procurement Management
          </h2>
          <p className="text-sm text-primary-gray">
            Multi-tenant business workflow system
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="min-w-0 text-left sm:text-right">
          <p className="text-sm font-medium text-primary-black">
            {displayName}
          </p>
          <p className="truncate text-xs text-primary-gray">
            {displaySubtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-bold text-white">
          {initials}
        </div>

        <Button type="button" variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Topbar;
