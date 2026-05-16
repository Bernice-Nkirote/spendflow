import { useEffect, useMemo, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
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

function getPermissionModule(permissionName: string) {
  const moduleKey = permissionName.split(".")[0];
  return MODULE_LABELS[moduleKey] ?? formatPermissionLabel(moduleKey);
}

function formatPermissionLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function PermissionsPage() {
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
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setError("");

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
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to load roles and permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRolePermissions(roleId: string) {
    if (!roleId) return;

    try {
      setIsRolePermissionsLoading(true);
      setError("");

      const data = await getPermissionsForRole(roleId);
      setRolePermissions(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to load permissions for this role.",
      );
    } finally {
      setIsRolePermissionsLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = window.setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error, successMessage]);

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
      setError("Please select a role first.");
      return;
    }

    const assignedPermission = assignedPermissionMap.get(permission.id);

    try {
      setActionPermissionId(permission.id);
      setError("");
      setSuccessMessage("");

      if (assignedPermission) {
        await removePermissionFromRole(assignedPermission.id);
        setSuccessMessage("Permission removed from role.");
      } else {
        await assignPermissionToRole({
          role_id: selectedRoleId,
          permission_id: permission.id,
        });
        setSuccessMessage("Permission assigned to role.");
      }

      await loadRolePermissions(selectedRoleId);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to update role permission.",
      );
    } finally {
      setActionPermissionId(null);
    }
  }

  return (
    <div className="relative space-y-6">
      {(error || successMessage) && (
        <div
          className={`fixed right-4 top-20 z-[9999] max-w-md rounded-xl border p-4 text-sm shadow-lg ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{error || successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
              }}
              className="font-semibold"
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-primary-black">Permissions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage role-based access by assigning readable permissions to each
          role.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select role
            </label>
            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              disabled={isLoading}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-primary-black">
              {selectedRole ? selectedRole.name : "No role selected"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {selectedRole?.description ||
                "Choose a role to view and manage assigned permissions."}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-gray-600">Loading permissions...</p>
        </Card>
      ) : !selectedRoleId ? (
        <Card>
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No role selected
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Select a role to manage permissions.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(groupedPermissions).map(
            ([moduleName, modulePermissions]) => (
              <Card key={moduleName}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-primary-black">
                    {moduleName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage access for {moduleName.toLowerCase()}.
                  </p>
                </div>

                {isRolePermissionsLoading ? (
                  <p className="text-sm text-gray-600">
                    Loading role permissions...
                  </p>
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
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-primary-black">
                              {formatPermissionLabel(permission.name)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {permission.description ||
                                "No description provided."}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant={isAssigned ? "danger" : "secondary"}
                            onClick={() => handleTogglePermission(permission)}
                            disabled={isActionLoading}
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
    </div>
  );
}

export default PermissionsPage;
