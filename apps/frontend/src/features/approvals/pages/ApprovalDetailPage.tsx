import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  createApprovalAction,
  getApprovalActionsByInstance,
  getApprovalInstanceById,
} from "../api/approvalApi";
import ApprovalStatusBadge from "../components/ApprovalStatusBadge";
import type {
  ActionType,
  ApprovalAction,
  ApprovalInstance,
} from "../types/approval.types";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function formatRate(value: string | number | null | undefined) {
  if (!value) return "-";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";

  return numericValue.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function getEntityLink(instance: ApprovalInstance) {
  const returnTo = encodeURIComponent(`/approvals/${instance.id}`);

  switch (instance.entity_type) {
    case "PR":
      return `/purchase-requisitions/${instance.entity_id}?returnTo=${returnTo}`;
    case "PO":
      return `/purchase-orders/${instance.entity_id}?returnTo=${returnTo}`;
    case "INVOICE":
      return `/invoices/${instance.entity_id}?returnTo=${returnTo}`;
    case "PAYMENT":
      return `/payments/${instance.entity_id}?returnTo=${returnTo}`;
    default:
      return null;
  }
}

function ApprovalDetailPage() {
  const { instanceId } = useParams();

  const [instance, setInstance] = useState<ApprovalInstance | null>(null);
  const [actions, setActions] = useState<ApprovalAction[]>([]);
  const [comment, setComment] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
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
        setError(getApiErrorMessage(err, "Failed to load approval details."));
      } finally {
        setIsLoading(false);
      }
    }

    loadApproval();
  }, [instanceId]);

  function openActionDialog(action: ActionType) {
    if (action === "REJECTED" && !comment.trim()) {
      setError("A rejection comment is required.");
      return;
    }

    setSelectedAction(action);
  }

  async function handleConfirmAction() {
    if (!instance || !selectedAction) return;

    if (!instance.current_level_id) {
      setError("This approval does not have a current workflow level.");
      setSelectedAction(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      await createApprovalAction({
        instance_id: instance.id,
        level_id: instance.current_level_id,
        action: selectedAction,
        comment: comment.trim() || null,
      });

      const [updatedInstance, updatedActions] = await Promise.all([
        getApprovalInstanceById(instance.id),
        getApprovalActionsByInstance(instance.id),
      ]);

      setInstance(updatedInstance);
      setActions(updatedActions);
      setComment("");
      setSelectedAction(null);

      window.dispatchEvent(new Event("approval-notifications:refresh"));
      window.dispatchEvent(new Event("tasks:refresh"));

      if (selectedAction === "REJECTED") {
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
    return (
      <PageContainer>
        <LoadingState message="Loading approval details..." />
      </PageContainer>
    );
  }

  if (error && !instance) {
    return (
      <PageContainer>
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  if (!instance) {
    return (
      <PageContainer>
        <ErrorState message="Approval not found." />
      </PageContainer>
    );
  }

  const isPending = instance.status === "PENDING";
  const entityLink = getEntityLink(instance);

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

      <BackButton fallbackLabel="Back to Approvals" fallbackTo="/approvals" />

      <PageHeader
        title="Approval Detail"
        description="Review approval information, action history, and approve or reject this request."
        actions={<ApprovalStatusBadge status={instance.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Approval Information
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Review the request details before you approve or reject.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Reference" value={instance.entity_reference} />
              <InfoItem label="Entity Type" value={instance.entity_type} />
              <InfoItem
                label="Title / Description"
                value={instance.entity_title}
                className="sm:col-span-2"
              />
              <InfoItem
                label="Requester / Creator"
                value={instance.requester_name}
              />
              <InfoItem
                label="Original Amount"
                value={
                  instance.total_amount !== null &&
                  instance.total_amount !== undefined
                    ? formatCurrency(
                        instance.total_amount,
                        instance.currency || "KES",
                      )
                    : null
                }
                helper={`Transaction currency: ${instance.currency ?? "-"}`}
              />
              <InfoItem
                label="Base Amount for Approval"
                value={
                  instance.base_amount !== null &&
                  instance.base_amount !== undefined &&
                  instance.base_currency
                    ? formatCurrency(
                        instance.base_amount,
                        instance.base_currency,
                      )
                    : null
                }
                helper="Used to evaluate approval thresholds"
              />
              <InfoItem
                label="Exchange Rate"
                value={formatRate(instance.exchange_rate)}
                helper={`${instance.currency ?? "-"}${
                  instance.base_currency ? ` → ${instance.base_currency}` : ""
                }`}
              />
              <InfoItem
                label="Exchange Rate Date"
                value={formatDate(instance.exchange_rate_date)}
              />
              <InfoItem label="Workflow" value={instance.workflow_name} />
              <InfoItem
                label="Current Approval Level"
                value={instance.current_level_name ?? "No active level"}
              />
            </div>

            {entityLink && (
              <div className="pt-2">
                <Link to={entityLink}>
                  <Button type="button">
                    View {instance.entity_type} Details
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Action History
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Approval decisions and comments recorded for this request.
              </p>
            </div>

            {actions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No actions have been taken yet.
              </p>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-semibold text-primary-black">
                        {action.action === "APPROVED" ? "Approved" : "Rejected"}{" "}
                        by {action.user_name ?? "Unknown user"}
                      </p>
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        {formatDate(action.created_at)}
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-700">
                      <span className="font-medium text-primary-black">
                        Comment:{" "}
                      </span>
                      {action.comment || "No comment provided."}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="space-y-5 self-start">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Approval Action
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Record your approval decision for this request.
            </p>
          </div>

          {!isPending ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              This approval is no longer pending.
            </p>
          ) : (
            <>
              <div>
                <label
                  htmlFor="approval-comment"
                  className="block text-sm font-medium text-primary-black"
                >
                  Comment
                </label>
                <textarea
                  id="approval-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  placeholder="Add a comment. Required when rejecting."
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  type="button"
                  variant="success"
                  onClick={() => openActionDialog("APPROVED")}
                  disabled={isSubmitting}
                >
                  Approve
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => openActionDialog("REJECTED")}
                  disabled={isSubmitting}
                >
                  Reject
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={selectedAction !== null}
        title={
          selectedAction === "REJECTED"
            ? "Reject approval request?"
            : "Approve request?"
        }
        message={
          selectedAction === "REJECTED"
            ? "This will reject the approval request. This action should only be taken after reviewing the procurement details."
            : "This will record your approval decision for this request."
        }
        confirmLabel={selectedAction === "REJECTED" ? "Reject" : "Approve"}
        variant={selectedAction === "REJECTED" ? "danger" : "info"}
        isLoading={isSubmitting}
        onConfirm={handleConfirmAction}
        onCancel={() => setSelectedAction(null)}
      />
    </PageContainer>
  );
}

type InfoItemProps = {
  label: string;
  value?: string | number | null;
  helper?: string;
  className?: string;
};

function InfoItem({ label, value, helper, className = "" }: InfoItemProps) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-primary-black">
        {value ?? "Not available"}
      </p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

export default ApprovalDetailPage;
