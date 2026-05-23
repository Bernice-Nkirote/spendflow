import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import { getStoredUser } from "../../../utils/permissions";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  activateApprovalWorkflow,
  createApprovalWorkflow,
  deactivateApprovalWorkflow,
  getApprovalWorkflows,
  updateApprovalWorkflow,
} from "../api/approvalWorkflowApi";
import type {
  ApprovalEntityType,
  ApprovalWorkflow,
} from "../types/approvalWorkflow.types";
import { approvalEntityTypeOptions } from "../types/approvalWorkflow.types";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function ApprovalWorkflowsPage() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const canAccessAdminPage =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true;

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [editingWorkflow, setEditingWorkflow] =
    useState<ApprovalWorkflow | null>(null);
  const [workflowToToggle, setWorkflowToToggle] =
    useState<ApprovalWorkflow | null>(null);

  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<ApprovalEntityType>("PR");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionWorkflowId, setActionWorkflowId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadWorkflows() {
    if (!canAccessAdminPage) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError("");

      const data = await getApprovalWorkflows();
      setWorkflows(data);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load approval workflows."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, [canAccessAdminPage]);

  function resetForm() {
    setEditingWorkflow(null);
    setName("");
    setEntityType("PR");
  }

  function startEdit(workflow: ApprovalWorkflow) {
    setEditingWorkflow(workflow);
    setName(workflow.name);
    setEntityType(workflow.entity_type);
  }

  function getEntityTypeLabel(value: ApprovalEntityType) {
    return (
      approvalEntityTypeOptions.find((option) => option.value === value)
        ?.label ?? value
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Workflow name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingWorkflow) {
        await updateApprovalWorkflow(editingWorkflow.id, {
          name: trimmedName,
          entity_type: entityType,
        });

        setSuccessMessage("Approval workflow updated successfully.");
      } else {
        await createApprovalWorkflow({
          name: trimmedName,
          entity_type: entityType,
        });

        setSuccessMessage("Approval workflow created successfully.");
      }

      resetForm();
      await loadWorkflows();
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to save approval workflows."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmToggleStatus() {
    if (!workflowToToggle) return;

    try {
      setActionWorkflowId(workflowToToggle.id);
      setError("");
      setSuccessMessage("");

      if (workflowToToggle.is_active) {
        await deactivateApprovalWorkflow(workflowToToggle.id);
        setSuccessMessage("Approval workflow deactivated successfully.");
      } else {
        await activateApprovalWorkflow(workflowToToggle.id);
        setSuccessMessage("Approval workflow activated successfully.");
      }

      setWorkflowToToggle(null);
      await loadWorkflows();
    } catch (error) {
      setError(
        getApiErrorMessage(error, "Failed to update approval workflow status."),
      );
    } finally {
      setActionWorkflowId(null);
    }
  }

  if (!canAccessAdminPage) {
    return (
      <PageContainer>
        <PageHeader
          title="Approval Workflows"
          description="Create, update, activate, and configure approval workflows for procurement documents."
        />

        <ErrorState message="Admin access is required to manage approval workflows." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {successMessage && (
        <FloatingAlert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {error && (
        <FloatingAlert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      <PageHeader
        title="Approval Workflows"
        description="Create, update, activate, and configure approval workflows for procurement documents."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              {editingWorkflow
                ? "Edit Approval Workflow"
                : "Add Approval Workflow"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Define the document type this workflow applies to before
              configuring approval levels.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-end">
            <Input
              label="Workflow name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. PR Approval Workflow"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-black">
                Entity type
              </label>
              <select
                value={entityType}
                onChange={(event) =>
                  setEntityType(event.target.value as ApprovalEntityType)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {approvalEntityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingWorkflow ? "Update" : "Create"}
              </Button>

              {editingWorkflow && (
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

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Approval Workflow List
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage workflow status and open workflow details to configure levels
            and approver roles.
          </p>
        </div>

        {isLoading ? (
          <LoadingState message="Loading approval workflows..." />
        ) : workflows.length === 0 ? (
          <EmptyState
            title="No approval workflows found"
            message="Add your first workflow before configuring approval levels."
          />
        ) : (
          <TableWrapper minWidth="1000px">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Workflow
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Entity Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Levels
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {workflow.name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {getEntityTypeLabel(workflow.entity_type)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {workflow.levels?.length ?? 0}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge
                        variant={workflow.is_active ? "success" : "neutral"}
                      >
                        {workflow.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            navigate(`/approval-workflows/${workflow.id}`)
                          }
                        >
                          View Details
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(workflow)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant={workflow.is_active ? "secondary" : "success"}
                          size="sm"
                          onClick={() => setWorkflowToToggle(workflow)}
                          disabled={actionWorkflowId === workflow.id}
                        >
                          {workflow.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>

      <ConfirmDialog
        isOpen={workflowToToggle !== null}
        title={
          workflowToToggle?.is_active
            ? "Deactivate approval workflow?"
            : "Activate approval workflow?"
        }
        message={
          workflowToToggle?.is_active
            ? `This will deactivate "${workflowToToggle.name}". Existing records will remain unchanged, but this workflow should not be used for new approval routing while inactive.`
            : `This will activate "${workflowToToggle?.name}". Make sure its levels and approver roles are configured correctly.`
        }
        confirmLabel={workflowToToggle?.is_active ? "Deactivate" : "Activate"}
        variant={workflowToToggle?.is_active ? "warning" : "info"}
        isLoading={actionWorkflowId === workflowToToggle?.id}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setWorkflowToToggle(null)}
      />
    </PageContainer>
  );
}

export default ApprovalWorkflowsPage;
