import { useEffect, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../api/departmentApi";
import type { Department } from "../types/department.types";

function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionDepartmentId, setActionDepartmentId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");

  async function loadDepartments() {
    try {
      setIsLoading(true);
      setError("");
      const data = await getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
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
    setEditingDepartment(null);
  }

  function startEdit(department: Department) {
    setEditingDepartment(department);
    setName(department.name);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Department name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: trimmedName,
        });
      } else {
        await createDepartment({
          name: trimmedName,
          is_active: true,
        });
      }

      resetForm();
      await loadDepartments();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save department.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(department: Department) {
    try {
      setActionDepartmentId(department.id);
      setError("");

      if (department.is_active) {
        await deactivateDepartment(department.id);
      } else {
        await activateDepartment(department.id);
      }

      await loadDepartments();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to update department status.",
      );
    } finally {
      setActionDepartmentId(null);
    }
  }

  async function handleDelete(department: Department) {
    const confirmed = window.confirm(
      `Delete ${department.name}? If it is already used, deactivate it instead.`,
    );

    if (!confirmed) return;

    try {
      setActionDepartmentId(department.id);
      setError("");

      await deleteDepartment(department.id);
      await loadDepartments();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to delete department. Deactivate it if it is already used.",
      );
    } finally {
      setActionDepartmentId(null);
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
              {editingDepartment ? "Edit department" : "Add department"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Create departments before assigning users or configuring approval
              levels.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Department name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Procurement, Finance, Operations"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : editingDepartment
                    ? "Update"
                    : "Create"}
              </Button>

              {editingDepartment && (
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
            Department list
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Use deactivate instead of delete when a department already has
            records.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading departments...</p>
        ) : departments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No departments found
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Add your first department to start assigning users and workflows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {department.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          department.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {department.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(department)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleToggleStatus(department)}
                          disabled={actionDepartmentId === department.id}
                        >
                          {department.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDelete(department)}
                          disabled={actionDepartmentId === department.id}
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

export default DepartmentsPage;
