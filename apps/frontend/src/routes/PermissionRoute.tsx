import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../components/ui/PageContainer";
import { getStoredUser } from "../utils/permissions";

type PermissionRouteProps = {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAdmin?: boolean;
  adminMessage?: string;
  permissionMessage?: string;
};

type AccessDeniedPanelProps = {
  message: string;
  variant: "admin" | "permission";
};

function AccessDeniedPanel({ message, variant }: AccessDeniedPanelProps) {
  const title = variant === "admin" ? "Admin access needed" : "Access unavailable";
  const helperText =
    variant === "admin"
      ? "This area is reserved for administrators and company owners."
      : "Your current role does not include access to this page.";

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-[#A7C7E7]/70 bg-white/78 p-6 shadow-[0_24px_70px_rgba(1,28,64,0.10)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#A7C7E7]/70 bg-[#A7C7E7]/24 text-[#26658C] shadow-sm">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            <path d="M12 15v2" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2A7387]">
            Permission check
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#011C40] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#40566b]">{message}</p>
          <p className="mt-2 text-sm leading-6 text-[#66788a]">
            {helperText} If you believe you should have access, ask your admin
            to review your role and permissions.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-[#54ACBF]/40 bg-[#26658C] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#26658C]/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/80 hover:bg-white/35 hover:text-[#26658C] hover:shadow-md"
            >
              Go to dashboard
            </Link>
            <Link
              to="/user-guide"
              className="inline-flex items-center justify-center rounded-xl border border-[#A7C7E7]/70 bg-white/75 px-4 py-2 text-sm font-semibold text-[#26658C] shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54ACBF]/70 hover:bg-white hover:text-[#011C40] hover:shadow-md"
            >
              Open user guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PermissionRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAdmin = false,
  adminMessage = "Admin access is required to view this page.",
  permissionMessage = "You do not have permission to view this page.",
}: PermissionRouteProps) {
  const user = getStoredUser();

  if (!user) {
    return null;
  }

  const isAdmin =
    user.role_name?.trim().toLowerCase() === "admin" ||
    user.is_company_owner === true;

  if (requireAdmin && !isAdmin) {
    return (
      <PageContainer className="module-theme module-admin py-8">
        <AccessDeniedPanel message={adminMessage} variant="admin" />
      </PageContainer>
    );
  }

  if (requiredPermission) {
    const hasPermission =
      user.permissions?.includes(requiredPermission) ?? false;

    if (!hasPermission) {
      return (
        <PageContainer className="module-theme module-admin py-8">
          <AccessDeniedPanel message={permissionMessage} variant="permission" />
        </PageContainer>
      );
    }
  }

  if (requiredPermissions?.length) {
    const hasAnyPermission = requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );

    if (!hasAnyPermission) {
      return (
        <PageContainer className="module-theme module-admin py-8">
          <AccessDeniedPanel message={permissionMessage} variant="permission" />
        </PageContainer>
      );
    }
  }

  return <>{children}</>;
}
