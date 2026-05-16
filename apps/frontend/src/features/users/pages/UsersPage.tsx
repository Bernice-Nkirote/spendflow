import { useEffect, useMemo, useState } from "react";
import type { Value } from "react-phone-number-input";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
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
  getUsers,
  resendUserSetupLink,
  updateUser,
} from "../api/userApi";
import type { User } from "../types/user.types";

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<Value>();
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active),
    [departments],
  );

  const activeRoles = useMemo(
    () => roles.filter((role) => role.is_active),
    [roles],
  );

  function isAdminUser(user: User | null) {
    return user?.role_name?.trim().toLowerCase() === "admin";
  }

  async function loadPageData() {
    try {
      setIsLoading(true);
      setError("");

      const [usersData, rolesData, departmentsData] = await Promise.all([
        getUsers(),
        getRoles(),
        getDepartments(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = window.setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error, successMessage]);

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

    if (isAdminUser(user)) {
      setSuccessMessage(
        "Admin access is protected. Email and role cannot be changed.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPhoneNumber = phoneNumber ?? null;

    if (!trimmedName) {
      setError("User name is required.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!roleId) {
      setError("Role is required.");
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

        setSuccessMessage("User updated successfully.");
      } else {
        await createUser({
          name: trimmedName,
          email: trimmedEmail,
          phone_number: normalizedPhoneNumber,
          department_id: departmentId || null,
          role_id: roleId,
        });

        setSuccessMessage(
          "User created successfully. An onboarding email has been sent.",
        );
      }

      resetForm();
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save user.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(user: User) {
    const action = user.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `${action === "deactivate" ? "Deactivate" : "Activate"} user "${user.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionUserId(user.id);
      setError("");
      setSuccessMessage("");

      if (user.is_active) {
        await deactivateUser(user.id);
        setSuccessMessage("User deactivated successfully.");
      } else {
        await activateUser(user.id);
        setSuccessMessage("User activated successfully.");
      }

      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to update user status.");
    } finally {
      setActionUserId(null);
    }
  }

  async function handleResendSetupLink(user: User) {
    const confirmed = window.confirm(
      `Resend setup link to "${user.email}"? The new link will be valid for 24 hours.`,
    );

    if (!confirmed) return;

    try {
      setActionUserId(user.id);
      setError("");
      setSuccessMessage("");

      await resendUserSetupLink(user.id);

      setSuccessMessage(`Setup link resent to ${user.email}.`);
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to resend setup link.");
    } finally {
      setActionUserId(null);
    }
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Delete user "${user.name}"? This will only work if the user has no linked procurement, approval, invoice, or payment records.`,
    );

    if (!confirmed) return;

    try {
      setActionUserId(user.id);
      setError("");
      setSuccessMessage("");

      await deleteUser(user.id);
      setSuccessMessage("User deleted successfully.");
      await loadPageData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to delete user. Deactivate the user if they already have linked records.",
      );
    } finally {
      setActionUserId(null);
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
              className={error ? "text-red-700" : "text-green-700"}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              {editingUser ? "Edit user" : "Add user"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Create users, assign their role and department, and send them an
              onboarding email to set their password.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Jane Wanjiku"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@company.com"
                disabled={isAdminUser(editingUser)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <div>
              <PhoneInputField
                label="Phone number"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                <option value="">No department</option>
                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                disabled={isAdminUser(editingUser)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select role</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {isAdminUser(editingUser) && (
                <p className="mt-1 text-xs text-yellow-700">
                  Admin role is protected and cannot be changed.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingUser ? "Update" : "Create user"}
            </Button>

            {editingUser && (
              <Button
                type="button"
                variant="secondary"
                className="whitespace-nowrap px-3 py-1.5 text-xs"
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

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading users...</p>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No users found
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Add your first user and they will receive an onboarding email.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] table-fixed text-left text-sm">
              {" "}
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-[24%] px-4 py-3">User</th>
                  <th className="w-[15%] px-4 py-3">Role</th>
                  <th className="w-[15%] px-4 py-3">Department</th>
                  <th className="w-[12%] px-4 py-3">Status</th>
                  <th className="w-[34%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-black">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {user.role_name ?? "Not assigned"}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {user.department_name ?? "No department"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                            user.is_active
                              ? "bg-green-50 text-green-700"
                              : user.has_completed_onboarding
                                ? "bg-gray-100 text-gray-600"
                                : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {user.is_active
                            ? "Active"
                            : user.has_completed_onboarding
                              ? "Inactive"
                              : "Pending setup"}
                        </span>

                        {isAdminUser(user) && (
                          <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Protected Admin
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {" "}
                        <Button
                          type="button"
                          variant="secondary"
                          className="whitespace-nowrap px-3 py-1.5 text-xs"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </Button>
                        {!user.has_completed_onboarding &&
                          !isAdminUser(user) && (
                            <Button
                              type="button"
                              variant="secondary"
                              className="whitespace-nowrap px-3 py-1.5 text-xs"
                              onClick={() => handleResendSetupLink(user)}
                              disabled={actionUserId === user.id}
                            >
                              {actionUserId === user.id
                                ? "Sending..."
                                : "Resend Link"}
                            </Button>
                          )}
                        {!isAdminUser(user) && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleToggleStatus(user)}
                              disabled={actionUserId === user.id}
                              className="whitespace-nowrap px-3 py-1.5 text-xs"
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handleDelete(user)}
                              disabled={actionUserId === user.id}
                              className="whitespace-nowrap px-3 py-1.5 text-xs"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default UsersPage;
