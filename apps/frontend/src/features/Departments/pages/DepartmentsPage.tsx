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
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser } from "../../../utils/permissions";

import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  getPaginatedDepartments,
  updateDepartment,
} from "../api/departmentApi";

import type { Department } from "../types/department.types";

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

function DepartmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getPositiveNumberFromSearchParam(searchParams.get("page"), 1);
  const pageSize = getPositiveNumberFromSearchParam(
    searchParams.get("page_size"),
    10,
  );
  const skip = (page - 1) * pageSize;
  const currentUser = getStoredUser();

  const canManageDepartments =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [name, setName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [actionDepartmentId, setActionDepartmentId] = useState<string | null>(
    null,
  );

  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const [confirmError, setConfirmError] = useState("");

  const [departmentToToggleStatus, setDepartmentToToggleStatus] =
    useState<Department | null>(null);

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

  async function loadDepartments(nextSkip = skip, nextLimit = pageSize) {
    if (!canManageDepartments) {
      setInitialLoading(false);
      setRecordsLoading(false);
      return;
    }
    try {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await getPaginatedDepartments({
        skip: nextSkip,
        limit: nextLimit,
      });

      setDepartments(response.rows);
      setTotalCount(response.total_count);
    } catch (error) {
      setRecordsError(getApiErrorMessage(error, "Failed to load departments."));
    } finally {
      setRecordsLoading(false);
      setInitialLoading(false);
    }
  }

  async function resetToFirstPageAndReloadDepartments() {
    updatePaginationSearchParams(1, pageSize);
    await loadDepartments(0, pageSize);
  }

  useEffect(() => {
    loadDepartments();
  }, [skip, pageSize, canManageDepartments]);

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

    const trimmedName = name.trim();

    if (!trimmedName) {
      showAlert("error", "Department name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: trimmedName,
        });

        showAlert("success", "Department updated successfully.");
      } else {
        await createDepartment({
          name: trimmedName,
          is_active: true,
        });

        showAlert("success", "Department created successfully.");
      }

      resetForm();
      await resetToFirstPageAndReloadDepartments();
    } catch (error) {
      showAlert(
        "error",
        getApiErrorMessage(error, "Failed to save department."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleToggleStatus(department: Department) {
    setConfirmError("");
    setDepartmentToToggleStatus(department);
  }

  async function confirmToggleDepartmentStatus() {
    if (!departmentToToggleStatus) return;

    try {
      setActionDepartmentId(departmentToToggleStatus.id);

      if (departmentToToggleStatus.is_active) {
        await deactivateDepartment(departmentToToggleStatus.id);

        showAlert("success", "Department deactivated successfully.");
      } else {
        await activateDepartment(departmentToToggleStatus.id);

        showAlert("success", "Department activated successfully.");
      }

      setDepartmentToToggleStatus(null);
      setConfirmError("");

      await resetToFirstPageAndReloadDepartments();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(error, "Failed to update department status."),
      );
    } finally {
      setActionDepartmentId(null);
    }
  }

  function handleDelete(department: Department) {
    setConfirmError("");
    setDepartmentToDelete(department);
  }

  async function confirmDeleteDepartment() {
    if (!departmentToDelete) return;

    try {
      setActionDepartmentId(departmentToDelete.id);

      await deleteDepartment(departmentToDelete.id);

      showAlert("success", "Department deleted successfully.");

      setDepartmentToDelete(null);
      setConfirmError("");

      await resetToFirstPageAndReloadDepartments();
    } catch (error) {
      setConfirmError(
        getApiErrorMessage(
          error,
          "Failed to delete department. Deactivate it if it is already used.",
        ),
      );
    } finally {
      setActionDepartmentId(null);
    }
  }

  if (!canManageDepartments) {
    return (
      <PageContainer>
        <PageHeader
          title="Departments"
          description="Create and manage departments used for procurement ownership, approvals, and user assignment."
        />

        <ErrorState message="Admin access is required to manage departments." />
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
        isOpen={Boolean(departmentToToggleStatus)}
        title={
          departmentToToggleStatus?.is_active
            ? "Deactivate department"
            : "Activate department"
        }
        message={`${
          departmentToToggleStatus?.is_active ? "Deactivate" : "Activate"
        } department "${departmentToToggleStatus?.name}"?`}
        confirmLabel={
          departmentToToggleStatus?.is_active ? "Deactivate" : "Activate"
        }
        variant={departmentToToggleStatus?.is_active ? "warning" : "info"}
        isLoading={actionDepartmentId === departmentToToggleStatus?.id}
        errorMessage={confirmError}
        onConfirm={confirmToggleDepartmentStatus}
        onCancel={() => {
          setDepartmentToToggleStatus(null);
          setConfirmError("");
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete department"
        message={`Delete department "${departmentToDelete?.name}"? If this department already has linked records, deactivate it instead.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actionDepartmentId === departmentToDelete?.id}
        errorMessage={confirmError}
        onConfirm={confirmDeleteDepartment}
        onCancel={() => {
          setDepartmentToDelete(null);
          setConfirmError("");
        }}
      />

      <PageHeader
        title="Departments"
        description="Create and manage departments used for procurement ownership, approvals, and user assignment."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-black">
                  {editingDepartment ? "Edit department" : "Add department"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Create departments before assigning users or configuring
                  approval workflows.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Department name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Procurement, Finance, Operations"
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[100px]"
                  >
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
                linked records.
              </p>
            </div>

            {recordsLoading && departments.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating departments...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : departments.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No departments found"
                message="Add your first department to start assigning users and workflows."
              />
            ) : recordsLoading && departments.length === 0 ? (
              <LoadingState message="Loading departments..." />
            ) : (
              <>
                <TableWrapper minWidth="700px">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {departments.map((department) => {
                        const isActionLoading =
                          actionDepartmentId === department.id;

                        return (
                          <tr key={department.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-primary-black">
                              {department.name}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge
                                variant={
                                  department.is_active ? "success" : "neutral"
                                }
                              >
                                {department.is_active ? "Active" : "Inactive"}
                              </StatusBadge>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2 whitespace-nowrap">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEdit(department)}
                                >
                                  Edit
                                </Button>

                                <Button
                                  type="button"
                                  variant={
                                    department.is_active
                                      ? "secondary"
                                      : "primary"
                                  }
                                  size="sm"
                                  onClick={() => handleToggleStatus(department)}
                                  disabled={isActionLoading}
                                  className="min-w-[92px]"
                                >
                                  {department.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                                </Button>

                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(department)}
                                  disabled={isActionLoading}
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

export default DepartmentsPage;
