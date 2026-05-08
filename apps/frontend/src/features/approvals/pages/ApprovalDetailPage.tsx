import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

function ApprovalDetailPage() {
  const { instanceId } = useParams();
  const navigate = useNavigate();

  const [instance, setInstance] = useState<ApprovalInstance | null>(null);
  const [actions, setActions] = useState<ApprovalAction[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      await createApprovalAction({
        instance_id: instance.id,
        level_id: instance.current_level_id,
        action,
        comment: comment.trim() || null,
      });

      navigate("/approvals");
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
    return <div className="text-sm text-gray-500">Loading approval...</div>;
  }

  if (error && !instance) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!instance) {
    return <div className="text-sm text-gray-500">Approval not found.</div>;
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
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Approval Information
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Entity Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {instance.entity_type}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Status
                </p>
                <div className="mt-1">
                  <ApprovalStatusBadge status={instance.status} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Entity ID
                </p>
                <p className="mt-1 break-all text-sm text-gray-700">
                  {instance.entity_id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Current Level ID
                </p>
                <p className="mt-1 break-all text-sm text-gray-700">
                  {instance.current_level_id || "No active level"}
                </p>
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

          <div className="rounded-xl border bg-white p-6 shadow-sm">
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
                      {action.action}
                    </p>
                    <div className="mt-2 rounded-md bg-white p-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900">
                        Comment:{" "}
                      </span>
                      {action.comment || "No comment provided."}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
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

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("APPROVED")}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Approve"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction("REJECTED")}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Reject"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovalDetailPage;
