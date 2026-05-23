import type { ReactNode } from "react";

import ErrorState from "../components/ui/ErrorState";
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
      <PageContainer>
        <ErrorState message={adminMessage} />
      </PageContainer>
    );
  }

  if (requiredPermission) {
    const hasPermission =
      user.permissions?.includes(requiredPermission) ?? false;

    if (!hasPermission) {
      return (
        <PageContainer>
          <ErrorState message={permissionMessage} />
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
        <PageContainer>
          <ErrorState message={permissionMessage} />
        </PageContainer>
      );
    }
  }

  return <>{children}</>;
}
