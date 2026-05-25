import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Value } from "react-phone-number-input";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
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
import PhoneInputField from "../../../components/ui/PhoneInputField";

import { getDepartments } from "../../Departments/api/departmentApi";
import type { Department } from "../../Departments/types/department.types";
import { getRoles } from "../../roles/api/roleApi";
import type { Role } from "../../roles/types/role.types";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getPaginatedUsers,
  resendUserSetupLink,
  updateUser,
} from "../api/userApi";
import type { User } from "../types/user.types";

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

function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getPositiveNumberFromSearchParam(searchParams.get("page"), 1);
  const pageSize = getPositiveNumberFromSearchParam(
    searchParams.get("page_size"),
    10,
  );
  const skip = (page - 1) * pageSize;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<Value>();
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(
    null,
  );
  const [userToResendSetup, setUserToResendSetup] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [selectedMobileUser, setSelectedMobileUser] = useState<User | null>(
    null,
  );

  const [confirmError, setConfirmError] = useState("");

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active),
    [departments],
  );

  const activeRoles = useMemo(
    () => roles.filter((role) => role.is_active),
    [roles],
  );

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

  function toggleMobileUserActions(user: User) {
    setSelectedMobileUser((current) => (current?.id === user.id ? null : user));
  }

  function handlePageSizeChange(nextPageSize: number) {
    updatePaginationSearchParams(1, nextPageSize);
  }

  async function loadUserRecords(nextSkip = skip, nextLimit = pageSize) {
    try {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await getPaginatedUsers({
        skip: nextSkip,
        limit: nextLimit,
      });

      setUsers(response.rows);
      setTotalCount(response.total_count);
    } catch (error) {
      setRecordsError(getApiErrorMessage(error, "Failed to load users."));
    } finally {
      setRecordsLoading(false);
    }
  }

  async function resetToFirstPageAndReloadUsers() {
    updatePaginationSearchParams(1, pageSize);
    await loadUserRecords(0, pageSize);
  }

  function isProtectedOwner(user: User | null) {
    return Boolean(user?.is_company_owner);
  }

  function getUserStatus(user: User) {
    if (user.is_active) {
      return {
        label: "Active",
        variant: "success" as const,
      };
    }

    if (user.has_completed_onboarding) {
      return {
        label: "Inactive",
        variant: "neutral" as const,
      };
    }

    return {
      label: "Pending setup",
      variant: "warning" as const,
    };
  }

  async function loadSupportingData() {
    try {
      setInitialLoading(true);
      setError(null);

      const [rolesData, departmentsData] = await Promise.all([
        getRoles(),
        getDepartments(),
      ]);

      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load user page data."));
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    loadUserRecords();
  }, [skip, pageSize]);

  function resetForm() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPhoneNumber(undefined);
    setDepartmentId("");
    setRoleId("");
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhoneNumber((user.phone_number ?? undefined) as Value);
    setDepartmentId(user.department_id ?? "");
    setRoleId(user.role_id);

    if (isProtectedOwner(user)) {
      showAlert(
        "warning",
        "Company owner access is protected. Email and role cannot be changed.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPhoneNumber = phoneNumber ?? null;

    if (!trimmedName) {
      showAlert("error", "User name is required.");
      return;
    }

    if (!trimmedEmail) {
      showAlert("error", "Email is required.");
      return;
    }

    if (!roleId) {
      showAlert("error", "Role is required.");
      return;
    }

    if (!departmentId && !isProtectedOwner(editingUser)) {
      showAlert("error", "Department is required for users.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingUser) {
        await updateUser(editingUser.id, {
          name: trimmedName,
          email: trimmedEmail,
          phone_number: normalizedPhoneNumber,
          department_id: departmentId || null,
          role_id: roleId,
        });

        showAlert("success", "User updated successfully.");
      } else {
        await createUser({
          name: trimmedName,
          email: trimmedEmail,
          phone_number: normalizedPhoneNumber,
          department_id: departmentId,
          role_id: roleId,
        });

        showAlert(
          "success",
          "User created successfully. An onboarding email has been sent.",
        );
      }

      resetForm();
      await resetToFirstPageAndReloadUsers();
    } catch (error) {
      showAlert("error", getApiErrorMessage(error, "Failed to save user."));
    } finally {
      setIsSaving(false);
    }
  }

  function handleToggleStatus(user: User) {
    if (isProtectedOwner(user)) {
      showAlert(
        "warning",
        "Company owner access is protected and cannot be deactivated.",
      );
      return;
    }

    setConfirmError("");
    setUserToToggleStatus(user);
  }

  async function confirmToggleUserStatus() {
    if (!userToToggleStatus) return;

    try {
      setActionUserId(userToToggleStatus.id);

      if (userToToggleStatus.is_active) {
        await deactivateUser(userToToggleStatus.id);
        showAlert("success", "User deactivated successfully.");
      } else {
        await activateUser(userToToggleStatus.id);
        showAlert("success", "User activated successfully.");
      }

      setUserToToggleStatus(null);
      setConfirmError("");
      await resetToFirstPageAndReloadUsers();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(error, "Failed to update user status."),
      );
    } finally {
      setActionUserId(null);
    }
  }

  function handleResendSetupLink(user: User) {
    setConfirmError("");
    setUserToResendSetup(user);
  }

  async function confirmResendSetupLink() {
    if (!userToResendSetup) return;

    try {
      setActionUserId(userToResendSetup.id);

      await resendUserSetupLink(userToResendSetup.id);

      showAlert("success", `Setup link resent to ${userToResendSetup.email}.`);

      setUserToResendSetup(null);
      setConfirmError("");
      await resetToFirstPageAndReloadUsers();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(error, "Failed to resend setup link."),
      );
    } finally {
      setActionUserId(null);
    }
  }

  function handleDelete(user: User) {
    if (isProtectedOwner(user)) {
      showAlert(
        "warning",
        "Company owner access is protected and cannot be deleted.",
      );
      return;
    }

    setConfirmError("");
    setUserToDelete(user);
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;

    try {
      setActionUserId(userToDelete.id);

      await deleteUser(userToDelete.id);

      showAlert("success", "User deleted successfully.");

      setUserToDelete(null);
      setConfirmError("");
      await resetToFirstPageAndReloadUsers();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(
          error,
          "Failed to delete user. Deactivate the user if they already have linked records.",
        ),
      );
    } finally {
      setActionUserId(null);
    }
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
        isOpen={Boolean(userToToggleStatus)}
        title={
          userToToggleStatus?.is_active ? "Deactivate user" : "Activate user"
        }
        message={`${userToToggleStatus?.is_active ? "Deactivate" : "Activate"} user "${userToToggleStatus?.name}"?`}
        confirmLabel={userToToggleStatus?.is_active ? "Deactivate" : "Activate"}
        variant={userToToggleStatus?.is_active ? "warning" : "info"}
        isLoading={actionUserId === userToToggleStatus?.id}
        errorMessage={confirmError}
        onConfirm={confirmToggleUserStatus}
        onCancel={() => {
          setUserToToggleStatus(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(userToResendSetup)}
        title="Resend setup link"
        message={`Resend setup link to "${userToResendSetup?.email}"? The new link will be valid for 24 hours.`}
        confirmLabel="Resend"
        variant="info"
        isLoading={actionUserId === userToResendSetup?.id}
        errorMessage={confirmError}
        onConfirm={confirmResendSetupLink}
        onCancel={() => {
          setUserToResendSetup(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        title="Delete user"
        message={`Delete user "${userToDelete?.name}"? This will only work if the user has no linked procurement, approval, invoice, or payment records.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actionUserId === userToDelete?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setUserToDelete(null);
          setConfirmError("");
        }}
      />

      <PageHeader
        title="Users"
        description="Create internal users, assign roles and departments, resend onboarding links, and manage account status."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-black">
                  {editingUser ? "Edit user" : "Add user"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Create users, assign their role and department, and send them
                  an onboarding email to set their password.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Jane Wanjiku"
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@company.com"
                  disabled={isProtectedOwner(editingUser)}
                  className="disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />

                <PhoneInputField
                  label="Phone number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary-black">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(event) => setDepartmentId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  >
                    <option value="">
                      {isProtectedOwner(editingUser)
                        ? "No department"
                        : "Select department"}
                    </option>
                    {activeDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary-black">
                    Role
                  </label>
                  <select
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                    disabled={isProtectedOwner(editingUser)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Select role</option>
                    {activeRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  {isProtectedOwner(editingUser) && (
                    <p className="text-xs text-yellow-700">
                      Company owner role is protected and cannot be changed.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="min-w-[110px]"
                >
                  {isSaving
                    ? "Saving..."
                    : editingUser
                      ? "Update"
                      : "Create user"}
                </Button>

                {editingUser && (
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
            </form>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                User list
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage user access, onboarding status, roles, and departments.
              </p>
            </div>

            {recordsLoading && users.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating users...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : users.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No users found"
                message="Add your first user and they will receive an onboarding email."
              />
            ) : recordsLoading && users.length === 0 ? (
              <LoadingState message="Loading users..." />
            ) : (
              <>
                <TableWrapper minWidth="980px">
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className={`${stickyLeftHeader} w-[24%] px-4 py-3`}>
                          User
                        </th>
                        <th className="w-[15%] px-4 py-3">Role</th>
                        <th className="w-[15%] px-4 py-3">Department</th>
                        <th className="w-[12%] px-4 py-3">Status</th>
                        <th className="hidden w-[34%] px-4 py-3 text-right lg:table-cell">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {users.map((user) => {
                        const status = getUserStatus(user);
                        const isActionLoading = actionUserId === user.id;

                        return (
                          <tr key={user.id} className="group hover:bg-gray-50">
                            <td className={`${stickyLeftCell} px-4 py-3`}>
                              <button
                                type="button"
                                onClick={() => toggleMobileUserActions(user)}
                                className="block w-full text-left lg:pointer-events-none"
                                title="Tap to show actions"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-primary-black">
                                    {user.name}
                                  </span>

                                  {isProtectedOwner(user) && (
                                    <StatusBadge variant="info">
                                      Company Owner
                                    </StatusBadge>
                                  )}
                                </div>

                                <p className="mt-1 truncate text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </button>
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              {user.role_name ?? "Not assigned"}
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              {user.department_name ?? "No department"}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge variant={status.variant}>
                                {status.label}
                              </StatusBadge>
                            </td>

                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEdit(user)}
                                >
                                  Edit
                                </Button>

                                {!user.has_completed_onboarding &&
                                  !isProtectedOwner(user) && (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleResendSetupLink(user)
                                      }
                                      disabled={isActionLoading}
                                      className="min-w-[92px]"
                                    >
                                      {isActionLoading
                                        ? "Sending..."
                                        : "Resend"}
                                    </Button>
                                  )}

                                <Button
                                  type="button"
                                  variant={
                                    user.is_active ? "secondary" : "primary"
                                  }
                                  size="sm"
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={
                                    isActionLoading || isProtectedOwner(user)
                                  }
                                  className="min-w-[92px]"
                                >
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </Button>

                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(user)}
                                  disabled={
                                    isActionLoading || isProtectedOwner(user)
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
                  isOpen={Boolean(selectedMobileUser)}
                  reference={selectedMobileUser?.name ?? ""}
                  label="Selected user"
                  onClose={() => setSelectedMobileUser(null)}
                >
                  {selectedMobileUser && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(selectedMobileUser)}
                      >
                        Edit
                      </Button>

                      {!selectedMobileUser.has_completed_onboarding &&
                        !isProtectedOwner(selectedMobileUser) && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleResendSetupLink(selectedMobileUser)
                            }
                            disabled={actionUserId === selectedMobileUser.id}
                            className="min-w-[92px]"
                          >
                            {actionUserId === selectedMobileUser.id
                              ? "Sending..."
                              : "Resend"}
                          </Button>
                        )}

                      <Button
                        type="button"
                        variant={
                          selectedMobileUser.is_active ? "secondary" : "primary"
                        }
                        size="sm"
                        onClick={() => handleToggleStatus(selectedMobileUser)}
                        disabled={
                          actionUserId === selectedMobileUser.id ||
                          isProtectedOwner(selectedMobileUser)
                        }
                        className="min-w-[92px]"
                      >
                        {selectedMobileUser.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(selectedMobileUser)}
                        disabled={
                          actionUserId === selectedMobileUser.id ||
                          isProtectedOwner(selectedMobileUser)
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

export default UsersPage;
