import { useEffect, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import {
  activateRole,
  createRole,
  deactivateRole,
  deleteRole,
  getRoles,
  updateRole,
} from "../api/roleApi";
import type { Role } from "../types/role.types";

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionRoleId, setActionRoleId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadRoles() {
    try {
      setIsLoading(true);
      setError("");
      const data = await getRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (!error) return;

    const timer = window.setTimeout(() => {
      setError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error]);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingRole(null);
  }

  function startEdit(role: Role) {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Role name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingRole) {
        await updateRole(editingRole.id, {
          name: trimmedName,
          description: trimmedDescription || null,
        });
      } else {
        await createRole({
          name: trimmedName,
          description: trimmedDescription || null,
          is_active: true,
        });
      }

      resetForm();
      await loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(role: Role) {
    try {
      setActionRoleId(role.id);
      setError("");

      if (role.is_active) {
        if (role.name.trim().toLowerCase() === "admin") {
          setError(
            "The Admin role cannot be deactivated because it protects system access.",
          );
          return;
        }

        const confirmed = window.confirm(
          `Deactivate role "${role.name}"? This will only work if the role is not assigned to users or approval workflows.`,
        );

        if (!confirmed) return;

        await deactivateRole(role.id);
      } else {
        await activateRole(role.id);
      }

      await loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to update role status.");
    } finally {
      setActionRoleId(null);
    }
  }

  async function handleDelete(role: Role) {
    setError("");

    if (role.name.trim().toLowerCase() === "admin") {
      setError(
        "The Admin role cannot be deleted because it protects system access.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete role "${role.name}"? This will only work if the role is not assigned to users, permissions, or approval workflows.`,
    );

    if (!confirmed) return;

    try {
      setActionRoleId(role.id);

      await deleteRole(role.id);
      await loadRoles();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to delete role. If this role is already used, deactivate it or reassign users first.",
      );
    } finally {
      setActionRoleId(null);
    }
  }

  return (
    <div className="relative space-y-6">
      {error && (
        <div className="fixed right-4 top-20 z-[9999] max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900"
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
              {editingRole ? "Edit role" : "Add role"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Create roles before assigning users or configuring workflow
              approval levels.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Admin, Approver, Requester"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description of this role"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
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
            Deactivate roles instead of deleting them when they are already used
            by users or approval workflows.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading roles...</p>
        ) : roles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No roles found
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Add your first role to start assigning users and approvers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {role.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {role.description || "No description"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          role.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(role)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleToggleStatus(role)}
                          disabled={actionRoleId === role.id}
                        >
                          {role.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDelete(role)}
                          disabled={actionRoleId === role.id}
                        >
                          Delete
                        </Button>
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

export default RolesPage;
