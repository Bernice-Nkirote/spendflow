import axios from "axios";
import { useEffect, useMemo, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import ErrorState from "../../../components/ui/ErrorState";
import { getStoredUser } from "../../../utils/permissions";

import { getRoles } from "../../roles/api/roleApi";
import type { Role } from "../../roles/types/role.types";

import {
  assignPermissionToRole,
  getPermissions,
  getPermissionsForRole,
  removePermissionFromRole,
} from "../api/permissionApi";

import type { Permission, RolePermission } from "../types/permission.types";

const MODULE_LABELS: Record<string, string> = {
  pr: "Purchase Requisitions",
  purchase_requisition: "Purchase Requisitions",
  po: "Purchase Orders",
  purchase_order: "Purchase Orders",
  invoice: "Invoices",
  payment: "Payments",
  reports: "Reports",
  audit_logs: "Audit Logs",
  users: "Users",
  suppliers: "Suppliers",
  departments: "Departments",
  roles: "Roles",
  approval_workflows: "Approval Workflows",
  exchange_rates: "Exchange Rates",
};

function formatPermissionLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function getPermissionModule(permissionName: string) {
  const moduleKey = permissionName.split(".")[0];

  return MODULE_LABELS[moduleKey] ?? formatPermissionLabel(moduleKey);
}

function PermissionsPage() {
  const currentUser = getStoredUser();

  const canAccessAdminPage =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isRolePermissionsLoading, setIsRolePermissionsLoading] =
    useState(false);

  const [actionPermissionId, setActionPermissionId] = useState<string | null>(
    null,
  );

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  async function loadInitialData() {
    if (!canAccessAdminPage) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

      const [rolesData, permissionsData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);

      const activeRoles = rolesData.filter((role) => role.is_active);

      setRoles(activeRoles);

      setPermissions(
        permissionsData.filter((permission) => permission.is_active),
      );

      if (activeRoles.length > 0) {
        setSelectedRoleId(activeRoles[0].id);
      }
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to load roles and permissions."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRolePermissions(roleId: string) {
    if (!roleId) return;

    try {
      setIsRolePermissionsLoading(true);

      const data = await getPermissionsForRole(roleId);

      setRolePermissions(data);
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to load permissions for this role."),
      );
    } finally {
      setIsRolePermissionsLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [canAccessAdminPage]);

  useEffect(() => {
    if (canAccessAdminPage && selectedRoleId) {
      loadRolePermissions(selectedRoleId);
    }
  }, [canAccessAdminPage, selectedRoleId]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  const assignedPermissionMap = useMemo(() => {
    const map = new Map<string, RolePermission>();

    rolePermissions.forEach((rolePermission) => {
      map.set(rolePermission.permission_id, rolePermission);
    });

    return map;
  }, [rolePermissions]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>(
      (groups, permission) => {
        const moduleName = getPermissionModule(permission.name);

        if (!groups[moduleName]) {
          groups[moduleName] = [];
        }

        groups[moduleName].push(permission);

        return groups;
      },
      {},
    );
  }, [permissions]);

  async function handleTogglePermission(permission: Permission) {
    if (!selectedRoleId) {
      showAlert("error", "Please select a role first.");
      return;
    }

    const assignedPermission = assignedPermissionMap.get(permission.id);

    try {
      setActionPermissionId(permission.id);

      if (assignedPermission) {
        await removePermissionFromRole(assignedPermission.id);

        showAlert("success", "Permission removed from role.");
      } else {
        await assignPermissionToRole({
          role_id: selectedRoleId,
          permission_id: permission.id,
        });

        showAlert("success", "Permission assigned to role.");
      }

      await loadRolePermissions(selectedRoleId);
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to update role permission."),
      );
    } finally {
      setActionPermissionId(null);
    }
  }

  if (!canAccessAdminPage) {
    return (
      <PageContainer className="module-theme module-admin">
        <PageHeader
          title="Permissions"
          description="Manage role-based access by assigning readable permissions to company roles."
        />

        <ErrorState message="Admin access is required to manage permissions." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="module-theme module-admin">
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <PageHeader
        title="Permissions"
        description="Manage role-based access by assigning readable permissions to company roles."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-primary-black">
              Select role
            </label>

            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
            >
              <option value="">Select a role</option>

              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-primary-black">
                {selectedRole ? selectedRole.name : "No role selected"}
              </p>

              {selectedRole?.is_system_role && (
                <StatusBadge variant="info">System Role</StatusBadge>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-600">
              {selectedRole?.description ??
                "Choose a role to manage assigned permissions."}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState message="Loading permissions..." />
      ) : !selectedRoleId ? (
        <EmptyState
          title="No role selected"
          message="Select a role to manage permissions."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(groupedPermissions).map(
            ([moduleName, modulePermissions]) => (
              <Card key={moduleName} className="h-full">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-primary-black">
                    {moduleName}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Manage access for {moduleName.toLowerCase()}.
                  </p>
                </div>

                {isRolePermissionsLoading ? (
                  <LoadingState message="Loading role permissions..." />
                ) : (
                  <div className="space-y-3">
                    {modulePermissions.map((permission) => {
                      const isAssigned = assignedPermissionMap.has(
                        permission.id,
                      );

                      const isActionLoading =
                        actionPermissionId === permission.id;

                      return (
                        <div
                          key={permission.id}
                          className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary-black">
                              {formatPermissionLabel(permission.name)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {permission.description ??
                                "No description provided."}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant={isAssigned ? "danger" : "secondary"}
                            size="sm"
                            onClick={() => handleTogglePermission(permission)}
                            disabled={isActionLoading}
                            className="min-w-[90px]"
                          >
                            {isActionLoading
                              ? "Updating..."
                              : isAssigned
                                ? "Remove"
                                : "Assign"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ),
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default PermissionsPage;
