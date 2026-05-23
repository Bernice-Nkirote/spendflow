import axios from "axios";
import { useEffect, useMemo, useState } from "react";

import { getStoredUser } from "../../../utils/permissions";
import BackButton from "../../../components/ui/BackButton";
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
import StatusBadge from "../../../components/ui/StatusBadge";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getDepartments } from "../../Departments/api/departmentApi";
import type { Department } from "../../Departments/types/department.types";
import { getRoles } from "../../roles/api/roleApi";
import type { Role } from "../../roles/types/role.types";
import { getApprovalWorkflowById } from "../api/approvalWorkflowApi";
import {
  createWorkflowLevel,
  updateWorkflowLevel,
} from "../api/workflowLevelApi";
import {
  createWorkflowLevelRole,
  deleteWorkflowLevelRole,
} from "../api/workflowLevelRoleApi";
import type {
  ApprovalEntityType,
  ApprovalWorkflow,
  WorkflowLevel,
  WorkflowLevelRole,
} from "../types/approvalWorkflow.types";
import { approvalEntityTypeOptions } from "../types/approvalWorkflow.types";
import { useParams } from "react-router-dom";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function ApprovalWorkflowDetailsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const currentUser = getStoredUser();

  const canAccessAdminPage =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [editingLevel, setEditingLevel] = useState<WorkflowLevel | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [levelName, setLevelName] = useState("");
  const [levelOrder, setLevelOrder] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [selectedRoleByLevel, setSelectedRoleByLevel] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [roleToRemove, setRoleToRemove] = useState<WorkflowLevelRole | null>(
    null,
  );

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active),
    [departments],
  );

  const activeRoles = useMemo(
    () => roles.filter((role) => role.is_active),
    [roles],
  );

  function getEntityTypeLabel(value?: ApprovalEntityType) {
    if (!value) return "Unknown";

    return (
      approvalEntityTypeOptions.find((option) => option.value === value)
        ?.label ?? value
    );
  }

  async function loadPageData() {
    if (!canAccessAdminPage) {
      setIsLoading(false);
      return;
    }
    if (!workflowId) {
      setPageError("Workflow id is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setPageError("");

      const [workflowData, departmentsData, rolesData] = await Promise.all([
        getApprovalWorkflowById(workflowId),
        getDepartments(),
        getRoles(),
      ]);

      setWorkflow(workflowData);
      setDepartments(departmentsData);
      setRoles(rolesData);
    } catch (error) {
      setPageError(
        getApiErrorMessage(error, "Failed to load workflow details."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, [workflowId, canAccessAdminPage]);

  function resetLevelForm() {
    setEditingLevel(null);
    setLevelName("");
    setLevelOrder("");
    setDepartmentId("");
    setMinAmount("");
    setMaxAmount("");
  }

  function startEditLevel(level: WorkflowLevel) {
    setEditingLevel(level);
    setLevelName(level.name);
    setLevelOrder(String(level.level_order));
    setDepartmentId(level.department_id);
    setMinAmount(level.min_amount != null ? String(level.min_amount) : "");
    setMaxAmount(level.max_amount != null ? String(level.max_amount) : "");
  }

  async function handleCreateLevel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workflowId) {
      showAlert("error", "Workflow id is missing.");
      return;
    }

    const trimmedName = levelName.trim();
    const parsedLevelOrder = Number(levelOrder);

    if (!trimmedName) {
      showAlert("error", "Workflow level name is required.");
      return;
    }

    if (
      !levelOrder ||
      Number.isNaN(parsedLevelOrder) ||
      parsedLevelOrder <= 0
    ) {
      showAlert("error", "Level order must be greater than zero.");
      return;
    }

    if (!departmentId) {
      showAlert("error", "Department is required for this workflow level.");
      return;
    }

    try {
      setIsSavingLevel(true);

      const payload = {
        workflow_id: workflowId,
        name: trimmedName,
        level_order: parsedLevelOrder,
        department_id: departmentId,
        min_amount: minAmount ? Number(minAmount) : null,
        max_amount: maxAmount ? Number(maxAmount) : null,
        condition_expression: null,
      };

      if (editingLevel) {
        await updateWorkflowLevel(editingLevel.id, {
          name: payload.name,
          level_order: payload.level_order,
          department_id: payload.department_id,
          min_amount: payload.min_amount,
          max_amount: payload.max_amount,
          condition_expression: payload.condition_expression,
        });

        showAlert("success", "Workflow level updated successfully.");
      } else {
        await createWorkflowLevel(payload);
        showAlert("success", "Workflow level created successfully.");
      }

      resetLevelForm();
      await loadPageData();
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Failed to save workflow level."));
    } finally {
      setIsSavingLevel(false);
    }
  }

  async function handleAssignRole(level: WorkflowLevel) {
    const roleId = selectedRoleByLevel[level.id];

    if (!roleId) {
      showAlert("error", "Select a role before assigning it to this level.");
      return;
    }

    try {
      setActionId(level.id);

      await createWorkflowLevelRole({
        level_id: level.id,
        role_id: roleId,
      });

      showAlert("success", "Approver role assigned successfully.");

      setSelectedRoleByLevel((current) => ({
        ...current,
        [level.id]: "",
      }));

      await loadPageData();
    } catch (error) {
      setPageError(
        getApiErrorMessage(error, "Failed to assign role to level."),
      );
    } finally {
      setActionId(null);
    }
  }

  async function confirmRemoveRoleAssignment() {
    if (!roleToRemove) return;

    try {
      setActionId(roleToRemove.id);
      setConfirmError("");

      await deleteWorkflowLevelRole(roleToRemove.id);

      showAlert("success", "Approver role removed successfully.");
      setRoleToRemove(null);

      await loadPageData();
    } catch (error) {
      setPageError(
        getApiErrorMessage(error, "Failed to remove approver role."),
      );
    } finally {
      setActionId(null);
    }
  }

  if (!canAccessAdminPage) {
    return (
      <PageContainer>
        <BackButton
          fallbackLabel="Back to Approval Workflows"
          fallbackTo="/approval-workflows"
        />

        <PageHeader
          title="Approval Workflow Details"
          description="Configure approval levels, departments, amount thresholds, and approver roles."
        />

        <ErrorState message="Admin access is required to manage approval workflow details." />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading workflow details..." />
      </PageContainer>
    );
  }

  if (pageError) {
    return (
      <PageContainer>
        <BackButton
          fallbackLabel="Back to Approval Workflows"
          fallbackTo="/approval-workflows"
        />
        <ErrorState message={pageError} />
      </PageContainer>
    );
  }

  if (!workflow) {
    return (
      <PageContainer>
        <BackButton
          fallbackLabel="Back to Approval Workflows"
          fallbackTo="/approval-workflows"
        />
        <EmptyState
          title="Workflow not found"
          message="Go back and select an existing approval workflow."
        />
      </PageContainer>
    );
  }

  const sortedLevels = [...(workflow.levels ?? [])].sort(
    (a, b) => a.level_order - b.level_order,
  );

  return (
    <PageContainer>
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <BackButton
        fallbackLabel="Back to Approval Workflows"
        fallbackTo="/approval-workflows"
      />

      <PageHeader
        title={workflow.name}
        description="Configure approval levels, departments, amount thresholds, and approver roles for this workflow."
        actions={
          <StatusBadge variant={workflow.is_active ? "success" : "neutral"}>
            {workflow.is_active ? "Active" : "Inactive"}
          </StatusBadge>
        }
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryItem
            label="Entity Type"
            value={getEntityTypeLabel(workflow.entity_type)}
          />
          <SummaryItem
            label="Approval Levels"
            value={workflow.levels?.length ?? 0}
          />
          <SummaryItem
            label="Configuration Note"
            value="Add levels in the order they should approve."
          />
        </div>
      </Card>

      <Card>
        <form onSubmit={handleCreateLevel} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              {editingLevel ? "Edit Workflow Level" : "Add Workflow Level"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Define the approval stage, responsible department, and optional
              amount range.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Level name"
              value={levelName}
              onChange={(event) => setLevelName(event.target.value)}
              placeholder="e.g. Manager Approval"
            />

            <Input
              label="Level order"
              type="number"
              min="1"
              value={levelOrder}
              onChange={(event) => setLevelOrder(event.target.value)}
              placeholder="e.g. 1"
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
                <option value="">Select department</option>
                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Min amount"
                type="number"
                min="0"
                value={minAmount}
                onChange={(event) => setMinAmount(event.target.value)}
                placeholder="Optional"
              />

              <Input
                label="Max amount"
                type="number"
                min="0"
                value={maxAmount}
                onChange={(event) => setMaxAmount(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingLevel}
              className="min-w-[120px]"
            >
              {isSavingLevel
                ? "Saving..."
                : editingLevel
                  ? "Update Level"
                  : "Create Level"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={resetLevelForm}
              disabled={isSavingLevel}
            >
              {editingLevel ? "Cancel" : "Clear"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Workflow Levels
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Assign one or more approver roles to each level. The approval engine
            will route approval actions based on these role assignments.
          </p>
        </div>

        {sortedLevels.length === 0 ? (
          <EmptyState
            title="No levels configured"
            message="Add the first approval level for this workflow."
          />
        ) : (
          <div className="space-y-4">
            {sortedLevels.map((level) => (
              <Card key={level.id} className="bg-gray-50 shadow-none">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-primary-black">
                      Level {level.level_order}: {level.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Department:{" "}
                      <span className="font-medium text-primary-black">
                        {level.department_name ?? "Not specified"}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Amount range:{" "}
                      <span className="font-medium text-primary-black">
                        {level.min_amount || level.max_amount
                          ? `${level.min_amount ?? "0"} - ${
                              level.max_amount ?? "No limit"
                            }`
                          : "No amount limit"}
                      </span>
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => startEditLevel(level)}
                    >
                      Edit Level
                    </Button>

                    <select
                      value={selectedRoleByLevel[level.id] ?? ""}
                      onChange={(event) =>
                        setSelectedRoleByLevel((current) => ({
                          ...current,
                          [level.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:min-w-56"
                    >
                      <option value="">Select approver role</option>
                      {activeRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssignRole(level)}
                      disabled={actionId === level.id}
                    >
                      Assign
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Assigned Approver Roles
                  </p>

                  {!level.level_roles || level.level_roles.length === 0 ? (
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-gray-600">
                      No approver roles assigned yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {level.level_roles.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-primary-blue"
                        >
                          {assignment.role_name ??
                            assignment.role?.name ??
                            "Unnamed role"}

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmError("");
                              setRoleToRemove(assignment);
                            }}
                            disabled={actionId === assignment.id}
                            className="text-primary-blue transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Remove approver role"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(roleToRemove)}
        title="Remove approver role?"
        message={`Remove "${
          roleToRemove?.role_name ?? roleToRemove?.role?.name ?? "this role"
        }" from this workflow level?`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={actionId === roleToRemove?.id}
        errorMessage={confirmError}
        onConfirm={confirmRemoveRoleAssignment}
        onCancel={() => {
          setRoleToRemove(null);
          setConfirmError("");
        }}
      />
    </PageContainer>
  );
}

type SummaryItemProps = {
  label: string;
  value: string | number;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-primary-black">{value}</p>
    </div>
  );
}

export default ApprovalWorkflowDetailsPage;
