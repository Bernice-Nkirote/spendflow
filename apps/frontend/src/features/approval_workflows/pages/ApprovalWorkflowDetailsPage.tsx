import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
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
} from "../types/approvalWorkflow.types";
import { approvalEntityTypeOptions } from "../types/approvalWorkflow.types";

function ApprovalWorkflowDetailsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();

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

  function getEntityTypeLabel(value?: ApprovalEntityType) {
    if (!value) return "Unknown";

    return (
      approvalEntityTypeOptions.find((option) => option.value === value)
        ?.label ?? value
    );
  }

  async function loadPageData() {
    if (!workflowId) {
      setError("Workflow id is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const [workflowData, departmentsData, rolesData] = await Promise.all([
        getApprovalWorkflowById(workflowId),
        getDepartments(),
        getRoles(),
      ]);

      setWorkflow(workflowData);
      setDepartments(departmentsData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to load workflow details.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, [workflowId]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = window.setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error, successMessage]);

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

    setMinAmount(
      level.min_amount !== null && level.min_amount !== undefined
        ? String(level.min_amount)
        : "",
    );

    setMaxAmount(
      level.max_amount !== null && level.max_amount !== undefined
        ? String(level.max_amount)
        : "",
    );
  }

  async function handleCreateLevel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workflowId) {
      setError("Workflow id is missing.");
      return;
    }

    const trimmedName = levelName.trim();
    const parsedLevelOrder = Number(levelOrder);

    if (!trimmedName) {
      setError("Workflow level name is required.");
      return;
    }

    if (
      !levelOrder ||
      Number.isNaN(parsedLevelOrder) ||
      parsedLevelOrder <= 0
    ) {
      setError("Level order must be greater than zero.");
      return;
    }

    if (!departmentId) {
      setError("Department is required for this workflow level.");
      return;
    }

    try {
      setIsSavingLevel(true);
      setError("");
      setSuccessMessage("");

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

        setSuccessMessage("Workflow level updated successfully.");
      } else {
        await createWorkflowLevel(payload);

        setSuccessMessage("Workflow level created successfully.");
      }

      resetLevelForm();
      await loadPageData();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save workflow level.");
    } finally {
      setIsSavingLevel(false);
    }
  }

  async function handleAssignRole(level: WorkflowLevel) {
    const roleId = selectedRoleByLevel[level.id];

    if (!roleId) {
      setError("Select a role before assigning it to this level.");
      return;
    }

    try {
      setActionId(level.id);
      setError("");
      setSuccessMessage("");

      await createWorkflowLevelRole({
        level_id: level.id,
        role_id: roleId,
      });

      setSuccessMessage("Approver role assigned successfully.");
      setSelectedRoleByLevel((current) => ({
        ...current,
        [level.id]: "",
      }));

      await loadPageData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to assign role to level.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleRemoveRoleAssignment(assignmentId: string) {
    const confirmed = window.confirm(
      "Remove this approver role from the workflow level?",
    );

    if (!confirmed) return;

    try {
      setActionId(assignmentId);
      setError("");
      setSuccessMessage("");

      await deleteWorkflowLevelRole(assignmentId);

      setSuccessMessage("Approver role removed successfully.");
      await loadPageData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to remove approver role.",
      );
    } finally {
      setActionId(null);
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

      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/approval-workflows")}
        >
          Back to approval workflows
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-gray-600">Loading workflow details...</p>
        </Card>
      ) : !workflow ? (
        <Card>
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              Workflow not found
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Go back and select an existing approval workflow.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-black">
                  {workflow.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Configure approval levels and approver roles for this
                  workflow.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                  workflow.is_active
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {workflow.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500">Entity type</p>
                <p className="mt-1 text-sm font-medium text-primary-black">
                  {getEntityTypeLabel(workflow.entity_type)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500">
                  Approval levels
                </p>
                <p className="mt-1 text-sm font-medium text-primary-black">
                  {workflow.levels?.length ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500">
                  Configuration note
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Add levels in the order they should approve.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <form onSubmit={handleCreateLevel} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-black">
                  {editingLevel ? "Edit workflow level" : "Add workflow level"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Define the approval stage, responsible department, and
                  optional amount range.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Level name
                  </label>
                  <input
                    value={levelName}
                    onChange={(event) => setLevelName(event.target.value)}
                    placeholder="e.g. Manager Approval"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Level order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={levelOrder}
                    onChange={(event) => setLevelOrder(event.target.value)}
                    placeholder="e.g. 1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
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
                    <option value="">Select department</option>
                    {activeDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Min amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minAmount}
                      onChange={(event) => setMinAmount(event.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Max amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxAmount}
                      onChange={(event) => setMaxAmount(event.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingLevel}>
                  {isSavingLevel
                    ? "Saving..."
                    : editingLevel
                      ? "Update level"
                      : "Create level"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetLevelForm}
                  disabled={isSavingLevel}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Workflow levels
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Assign one or more approver roles to each level. The approval
                engine will use these roles when routing approval actions.
              </p>
            </div>

            {!workflow.levels || workflow.levels.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm font-medium text-primary-black">
                  No levels configured
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Add the first approval level for this workflow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...workflow.levels]
                  .sort((a, b) => a.level_order - b.level_order)
                  .map((level) => (
                    <div
                      key={level.id}
                      className="rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-primary-black">
                            Level {level.level_order}: {level.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Department:{" "}
                            <span className="font-medium text-gray-700">
                              {level.department_name ?? "Not specified"}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Amount range:{" "}
                            <span className="font-medium text-gray-700">
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
                            onClick={() => startEditLevel(level)}
                          >
                            Edit level
                          </Button>

                          <select
                            value={selectedRoleByLevel[level.id] ?? ""}
                            onChange={(event) =>
                              setSelectedRoleByLevel((current) => ({
                                ...current,
                                [level.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue sm:min-w-56"
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
                            onClick={() => handleAssignRole(level)}
                            disabled={actionId === level.id}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                          Assigned approver roles
                        </p>

                        {!level.level_roles ||
                        level.level_roles.length === 0 ? (
                          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
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
                                  onClick={() =>
                                    handleRemoveRoleAssignment(assignment.id)
                                  }
                                  disabled={actionId === assignment.id}
                                  className="text-primary-blue hover:text-red-700"
                                  aria-label="Remove approver role"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default ApprovalWorkflowDetailsPage;
