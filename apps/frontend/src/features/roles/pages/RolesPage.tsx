import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser } from "../../../utils/permissions";

import {
  activateRole,
  createRole,
  deactivateRole,
  deleteRole,
  getPaginatedRoles,
  updateRole,
} from "../api/roleApi";

import type { Role } from "../types/role.types";

function getPositiveNumberFromSearchParam(
  value: string | null,
  fallback: number,
) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
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

function RolesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getPositiveNumberFromSearchParam(searchParams.get("page"), 1);
  const pageSize = getPositiveNumberFromSearchParam(
    searchParams.get("page_size"),
    10,
  );
  const skip = (page - 1) * pageSize;
  const currentUser = getStoredUser();

  const canAccessAdminPage =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const [roles, setRoles] = useState<Role[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [actionRoleId, setActionRoleId] = useState<string | null>(null);

  const [roleToDeactivate, setRoleToDeactivate] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [selectedMobileRole, setSelectedMobileRole] = useState<Role | null>(
    null,
  );
  const [confirmError, setConfirmError] = useState("");

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  function updatePaginationSearchParams(
    nextPage: number,
    nextPageSize: number,
  ) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      nextParams.set("page", String(nextPage));
      nextParams.set("page_size", String(nextPageSize));

      return nextParams;
    });
  }

  function handlePageChange(nextPage: number) {
    updatePaginationSearchParams(nextPage, pageSize);
  }

  function handlePageSizeChange(nextPageSize: number) {
    updatePaginationSearchParams(1, nextPageSize);
  }

  async function loadRoles(nextSkip = skip, nextLimit = pageSize) {
    if (!canAccessAdminPage) {
      setInitialLoading(false);
      setRecordsLoading(false);
      return;
    }
    try {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await getPaginatedRoles({
        skip: nextSkip,
        limit: nextLimit,
      });

      setRoles(response.rows);
      setTotalCount(response.total_count);
    } catch (error) {
      setRecordsError(getApiErrorMessage(error, "Failed to load roles."));
    } finally {
      setRecordsLoading(false);
      setInitialLoading(false);
    }
  }

  async function resetToFirstPageAndReloadRoles() {
    updatePaginationSearchParams(1, pageSize);
    await loadRoles(0, pageSize);
  }

  useEffect(() => {
    loadRoles();
  }, [skip, pageSize, canAccessAdminPage]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingRole(null);
  }

  function startEdit(role: Role) {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description ?? "");

    if (role.is_system_role) {
      showAlert(
        "warning",
        "System roles are protected and cannot be modified.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      showAlert("error", "Role name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingRole) {
        await updateRole(editingRole.id, {
          name: trimmedName,
          description: trimmedDescription || null,
        });

        showAlert("success", "Role updated successfully.");
      } else {
        await createRole({
          name: trimmedName,
          description: trimmedDescription || null,
          is_active: true,
        });

        showAlert("success", "Role created successfully.");
      }

      resetForm();
      await resetToFirstPageAndReloadRoles();
    } catch (error) {
      showAlert("error", getApiErrorMessage(error, "Failed to save role."));
    } finally {
      setIsSaving(false);
    }
  }

  function toggleMobileRoleActions(role: Role) {
    setSelectedMobileRole((current) => (current?.id === role.id ? null : role));
  }

  function handleToggleStatus(role: Role) {
    if (role.is_system_role) {
      showAlert(
        "warning",
        "System roles cannot be deactivated because they protect company governance.",
      );
      return;
    }

    if (role.is_active) {
      setConfirmError("");
      setRoleToDeactivate(role);
      return;
    }

    activateInactiveRole(role);
  }

  async function activateInactiveRole(role: Role) {
    try {
      setActionRoleId(role.id);

      await activateRole(role.id);

      showAlert("success", "Role activated successfully.");

      await resetToFirstPageAndReloadRoles();
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to update role status."),
      );
    } finally {
      setActionRoleId(null);
    }
  }

  async function confirmDeactivateRole() {
    if (!roleToDeactivate) return;

    try {
      setActionRoleId(roleToDeactivate.id);

      await deactivateRole(roleToDeactivate.id);

      showAlert("success", "Role deactivated successfully.");

      setRoleToDeactivate(null);
      setConfirmError("");

      await resetToFirstPageAndReloadRoles();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(error, "Failed to update role status."),
      );
    } finally {
      setActionRoleId(null);
    }
  }

  function handleDelete(role: Role) {
    if (role.is_system_role) {
      showAlert(
        "warning",
        "System roles cannot be deleted because they protect company governance.",
      );
      return;
    }

    setConfirmError("");
    setRoleToDelete(role);
  }

  async function confirmDeleteRole() {
    if (!roleToDelete) return;

    try {
      setActionRoleId(roleToDelete.id);

      await deleteRole(roleToDelete.id);

      showAlert("success", "Role deleted successfully.");

      setRoleToDelete(null);
      setConfirmError("");

      await resetToFirstPageAndReloadRoles();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(
          error,
          "Failed to delete role. If this role is already used, deactivate it or reassign users first.",
        ),
      );
    } finally {
      setActionRoleId(null);
    }
  }

  if (!canAccessAdminPage) {
    return (
      <PageContainer>
        <PageHeader
          title="Roles"
          description="Create and manage company roles used for permissions, user access, and procurement approval workflows."
        />

        <ErrorState message="Admin access is required to manage roles." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(roleToDeactivate)}
        title="Deactivate role"
        message={`Deactivate role "${roleToDeactivate?.name}"? This will only work if the role is not assigned to users or approval workflows.`}
        confirmLabel="Deactivate"
        variant="warning"
        isLoading={actionRoleId === roleToDeactivate?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeactivateRole}
        onCancel={() => {
          setRoleToDeactivate(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(roleToDelete)}
        title="Delete role"
        message={`Delete role "${roleToDelete?.name}"? This will only work if the role is not assigned to users, permissions, or approval workflows.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actionRoleId === roleToDelete?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeleteRole}
        onCancel={() => {
          setRoleToDelete(null);
          setConfirmError("");
        }}
      />

      <PageHeader
        title="Roles"
        description="Create and manage company roles used for permissions, user access, and procurement approval workflows."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && (
        <>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-black">
                  {editingRole ? "Edit role" : "Add role"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Create roles before assigning users or configuring workflow
                  approval levels.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
                <Input
                  label="Role name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Admin, Approver, Requester"
                />

                <Input
                  label="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short description of this role"
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[100px]"
                  >
                    {isSaving ? "Saving..." : editingRole ? "Update" : "Create"}
                  </Button>

                  {editingRole && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetForm}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Role list
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Deactivate roles instead of deleting them when they are already
                used by users or approval workflows.
              </p>
            </div>

            {recordsLoading && roles.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating roles...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : roles.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No roles found"
                message="Add your first role to start assigning users and approvers."
              />
            ) : recordsLoading && roles.length === 0 ? (
              <LoadingState message="Loading roles..." />
            ) : (
              <>
                <TableWrapper minWidth="850px">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className={`${stickyLeftHeader} px-4 py-3`}>
                          Role
                        </th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="hidden px-4 py-3 text-right lg:table-cell">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {roles.map((role) => {
                        const isActionLoading = actionRoleId === role.id;

                        return (
                          <tr key={role.id} className="group hover:bg-gray-50">
                            <td className={`${stickyLeftCell} px-4 py-3`}>
                              <button
                                type="button"
                                onClick={() => toggleMobileRoleActions(role)}
                                className="block max-w-[260px] text-left lg:pointer-events-none"
                                title="Tap to show actions"
                              >
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-primary-black">
                                    {role.name}
                                  </span>

                                  {role.is_system_role && (
                                    <StatusBadge variant="info">
                                      System Role
                                    </StatusBadge>
                                  )}
                                </span>
                              </button>
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {role.description || "No description"}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge
                                variant={role.is_active ? "success" : "neutral"}
                              >
                                {role.is_active ? "Active" : "Inactive"}
                              </StatusBadge>
                            </td>

                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div className="flex justify-end gap-2 whitespace-nowrap">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEdit(role)}
                                  disabled={role.is_system_role}
                                >
                                  Edit
                                </Button>

                                <Button
                                  type="button"
                                  variant={
                                    role.is_active ? "secondary" : "primary"
                                  }
                                  size="sm"
                                  onClick={() => handleToggleStatus(role)}
                                  disabled={
                                    isActionLoading || role.is_system_role
                                  }
                                  className="min-w-[92px]"
                                >
                                  {role.is_active ? "Deactivate" : "Activate"}
                                </Button>

                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(role)}
                                  disabled={
                                    isActionLoading || role.is_system_role
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrapper>

                <MobileFloatingTableAction
                  isOpen={Boolean(selectedMobileRole)}
                  reference={selectedMobileRole?.name ?? ""}
                  label="Selected role"
                  onClose={() => setSelectedMobileRole(null)}
                >
                  {selectedMobileRole && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(selectedMobileRole)}
                        disabled={selectedMobileRole.is_system_role}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant={
                          selectedMobileRole.is_active ? "secondary" : "primary"
                        }
                        size="sm"
                        onClick={() => handleToggleStatus(selectedMobileRole)}
                        disabled={
                          actionRoleId === selectedMobileRole.id ||
                          selectedMobileRole.is_system_role
                        }
                        className="min-w-[92px]"
                      >
                        {selectedMobileRole.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(selectedMobileRole)}
                        disabled={
                          actionRoleId === selectedMobileRole.id ||
                          selectedMobileRole.is_system_role
                        }
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </MobileFloatingTableAction>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}

export default RolesPage;
