import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

import { getDepartmentOptions } from "../../reports/api/reportOptionsApi";
import {
  getPurchaseRequisitionById,
  updatePurchaseRequisition,
} from "../api/purchaseRequisitionApi";
import PurchaseRequisitionStatusBadge from "../components/PurchaseRequisitionStatusBadge";

import { currencyOptions } from "../../../utils/currencyOptions";

import type { ReportFilterOption } from "../../reports/types/report.types";
import type { PurchaseRequisitionStatus } from "../types/purchaseRequisition.types";

export default function EditPurchaseRequisitionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [departmentOptions, setDepartmentOptions] = useState<
    ReportFilterOption[]
  >([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<PurchaseRequisitionStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEditData() {
      if (!id) {
        setError("Purchase requisition ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [purchaseRequisition, departments] = await Promise.all([
          getPurchaseRequisitionById(id),
          getDepartmentOptions(),
        ]);

        setStatus(purchaseRequisition.status);

        if (purchaseRequisition.status !== "DRAFT") {
          setError("Only draft purchase requisitions can be edited.");
          return;
        }

        setTitle(purchaseRequisition.title);
        setDescription(purchaseRequisition.description ?? "");
        setCurrency(purchaseRequisition.currency);
        setDepartmentId(purchaseRequisition.department_id ?? "");
        setDepartmentOptions(departments);
      } catch {
        setError("Failed to load purchase requisition for editing.");
      } finally {
        setLoading(false);
      }
    }

    loadEditData();
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) {
      setError("Purchase requisition ID is missing.");
      return;
    }

    if (!departmentId) {
      setError("Please select a department.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updatePurchaseRequisition(id, {
        title,
        description: description || null,
        currency,
        department_id: departmentId,
      });

      navigate(`/purchase-requisitions/${id}`);
    } catch {
      setError("Failed to update purchase requisition.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <PageContainer className="module-theme module-procurement">
      <PageHeader
        title="Edit Purchase Requisition"
        description="Update draft purchase requisition information."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {status && <PurchaseRequisitionStatusBadge status={status} />}
            <BackButton
              fallbackLabel="Back to Purchase Requisition"
              fallbackTo={
                id ? `/purchase-requisitions/${id}` : "/purchase-requisitions"
              }
            />
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      {!error && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-primary-black">
              Requisition Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                required
                label="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">
                  Currency
                </label>
                <select
                  required
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">
                  Department
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((department) => (
                    <option key={department.value} value={department.value}>
                      {department.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-primary-black">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                />
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              to={
                id ? `/purchase-requisitions/${id}` : "/purchase-requisitions"
              }
            >
              <Button type="button" variant="secondary" disabled={submitting}>
                Cancel
              </Button>
            </Link>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </Card>
        </form>
      )}
    </PageContainer>
  );
}
