import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createApprovalAction,
  getApprovalActionsByInstance,
  getApprovalInstanceById,
} from "../api/approvalApi";
import type {
  ActionType,
  ApprovalAction,
  ApprovalInstance,
} from "../types/approval.types";
import ApprovalStatusBadge from "../components/ApprovalStatusBadge";
import { formatCurrency } from "../../../utils/formatCurrency";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import FloatingAlert from "../../../components/ui/FloatingAlert";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRate(value: string | number | null | undefined) {
  if (!value) return "-";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "-";

  return numericValue.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function ApprovalDetailPage() {
  const { instanceId } = useParams();

  const [instance, setInstance] = useState<ApprovalInstance | null>(null);
  const [actions, setActions] = useState<ApprovalAction[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadApproval() {
      if (!instanceId) return;

      try {
        setIsLoading(true);
        setError("");

        const [instanceData, actionsData] = await Promise.all([
          getApprovalInstanceById(instanceId),
          getApprovalActionsByInstance(instanceId),
        ]);

        setInstance(instanceData);
        setActions(actionsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load approval details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadApproval();
  }, [instanceId]);

  async function handleAction(action: ActionType) {
    if (!instance) return;

    if (!instance.current_level_id) {
      setError("This approval does not have a current workflow level.");
      return;
    }

    if (action === "REJECTED" && !comment.trim()) {
      setError("A rejection comment is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      await createApprovalAction({
        instance_id: instance.id,
        level_id: instance.current_level_id,
        action,
        comment: comment.trim() || null,
      });

      const [updatedInstance, updatedActions] = await Promise.all([
        getApprovalInstanceById(instance.id),
        getApprovalActionsByInstance(instance.id),
      ]);

      setInstance(updatedInstance);
      setActions(updatedActions);
      setComment("");

      if (action === "REJECTED") {
        setSuccessMessage(
          "Rejection recorded. This request has been rejected.",
        );
      } else if (
        updatedInstance.status === "PENDING" &&
        updatedInstance.current_level_id
      ) {
        setSuccessMessage(
          "Approval recorded. This request is now pending the next approval level.",
        );
      } else if (updatedInstance.status === "APPROVED") {
        setSuccessMessage(
          "Approval recorded. This request is now fully approved.",
        );
      } else {
        setSuccessMessage("Approval action recorded successfully.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to submit approval action.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !instance) {
    return <ErrorState message={error} />;
  }

  if (!instance) {
    return <ErrorState message="Approval not found." />;
  }

  const isPending = instance.status === "PENDING";
  const entityLink = getEntityLink(instance);

  function getEntityLink(instance: ApprovalInstance) {
    switch (instance.entity_type) {
      case "PR":
        return `/purchase-requisitions/${instance.entity_id}?returnTo=/approvals/${instance.id}`;
      case "PO":
        return `/purchase-orders/${instance.entity_id}`;
      case "INVOICE":
        return `/invoices/${instance.entity_id}`;
      case "PAYMENT":
        return `/payments/${instance.entity_id}`;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
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

      <div>
        <Link
          to="/approvals"
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to approvals page
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Approval Detail
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review and act on this approval request.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Approval Information
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Reference
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {instance.entity_reference ?? "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Entity Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {instance.entity_type}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title / Description
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {instance.entity_title ?? "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Requester / Creator
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {instance.requester_name ?? "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Original Amount
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {instance.total_amount !== null &&
                  instance.total_amount !== undefined
                    ? formatCurrency(
                        instance.total_amount,
                        instance.currency || "KES",
                      )
                    : "Not available"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Transaction currency: {instance.currency ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Base Amount for Approval
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {instance.base_amount !== null &&
                  instance.base_amount !== undefined &&
                  instance.base_currency
                    ? formatCurrency(
                        instance.base_amount,
                        instance.base_currency,
                      )
                    : "Not available"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Used to evaluate approval thresholds
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Exchange Rate
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {formatRate(instance.exchange_rate)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {instance.currency ?? "-"}
                  {instance.base_currency ? ` → ${instance.base_currency}` : ""}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Exchange Rate Date
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {formatDate(instance.exchange_rate_date)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Workflow
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {instance.workflow_name ?? "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Current approval level
                </p>
                <p className="mt-1 text-base font-semibold text-primary-black">
                  {instance.current_level_name ?? "No active level"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>
                <div className="mt-1">
                  <ApprovalStatusBadge status={instance.status} />
                </div>
              </div>
            </div>

            {entityLink && (
              <div className="mt-6">
                <Link
                  to={entityLink}
                  className="inline-flex rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90"
                >
                  View {instance.entity_type} Details
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Action History
            </h2>

            {actions.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No actions have been taken yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border bg-gray-50 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {action.action === "APPROVED" ? "Approved" : "Rejected"}{" "}
                      by {action.user_name ?? "Unknown user"}
                    </p>
                    <div className="mt-2 rounded-md bg-white p-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900">
                        Comment:{" "}
                      </span>
                      {action.comment || "No comment provided."}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Intl.DateTimeFormat("en-KE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(action.created_at))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Approval Action
          </h2>

          {!isPending ? (
            <p className="mt-4 text-sm text-gray-500">
              This approval is no longer pending.
            </p>
          ) : (
            <>
              <label className="mt-4 block text-sm font-medium text-gray-700">
                Comment
              </label>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
                placeholder="Add a comment. Required when rejecting."
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  type="button"
                  onClick={() => handleAction("APPROVED")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Approve"}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleAction("REJECTED")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Reject"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovalDetailPage;
