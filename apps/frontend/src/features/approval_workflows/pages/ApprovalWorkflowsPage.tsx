import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
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

function ApprovalWorkflowsPage() {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [editingWorkflow, setEditingWorkflow] =
    useState<ApprovalWorkflow | null>(null);

  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<ApprovalEntityType>("PR");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionWorkflowId, setActionWorkflowId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadWorkflows() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getApprovalWorkflows();
      setWorkflows(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to load approval workflows.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkflows();
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
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to save approval workflow.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(workflow: ApprovalWorkflow) {
    const action = workflow.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `${action === "deactivate" ? "Deactivate" : "Activate"} workflow "${workflow.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionWorkflowId(workflow.id);
      setError("");
      setSuccessMessage("");

      if (workflow.is_active) {
        await deactivateApprovalWorkflow(workflow.id);
        setSuccessMessage("Approval workflow deactivated successfully.");
      } else {
        await activateApprovalWorkflow(workflow.id);
        setSuccessMessage("Approval workflow activated successfully.");
      }

      await loadWorkflows();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to update approval workflow status.",
      );
    } finally {
      setActionWorkflowId(null);
    }
  }

  return (
    <div className="relative flex min-w-0 flex-col gap-6">
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

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              {editingWorkflow
                ? "Edit approval workflow"
                : "Add approval workflow"}
            </h2>
            <p className="mt-1 text-sm text-primary-gray">
              Create approval workflows for purchase requisitions, purchase
              orders, invoices, and payments.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary-black">
                Workflow name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. PR Approval Workflow"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary-black">
                Entity type
              </label>
              <select
                value={entityType}
                onChange={(event) =>
                  setEntityType(event.target.value as ApprovalEntityType)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                {approvalEntityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
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
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Approval workflow list
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Manage workflow status here. Configure levels and approver roles
            from the workflow details page next.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-primary-gray">
            Loading approval workflows...
          </p>
        ) : workflows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No approval workflows found
            </p>
            <p className="mt-1 text-sm text-primary-gray">
              Add your first workflow before configuring approval levels.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-primary-gray">
                <tr>
                  <th className="px-4 py-4">Workflow</th>
                  <th className="px-4 py-4">Entity type</th>
                  <th className="px-4 py-4">Levels</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {workflow.name}
                    </td>

                    <td className="px-4 py-3 text-primary-black">
                      {getEntityTypeLabel(workflow.entity_type)}
                    </td>

                    <td className="px-4 py-3 text-primary-black">
                      {workflow.levels?.length ?? 0}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          workflow.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-primary-gray"
                        }`}
                      >
                        {workflow.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/approval-workflows/${workflow.id}`)
                          }
                          className="text-sm font-medium text-primary-blue hover:underline"
                        >
                          View details
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(workflow)}
                          className="text-sm font-medium text-primary-blue hover:underline"
                        >
                          Edit
                        </button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleToggleStatus(workflow)}
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
          </div>
        )}
      </section>
    </div>
  );
}

export default ApprovalWorkflowsPage;
