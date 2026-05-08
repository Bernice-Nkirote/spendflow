import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getDepartmentOptions } from "../../reports/api/reportOptionsApi";
import {
  getPurchaseRequisitionById,
  updatePurchaseRequisition,
} from "../api/purchaseRequisitionApi";

import { currencyOptions } from "../../../utils/currencyOptions";

import type { ReportFilterOption } from "../../reports/types/report.types";

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
    <div className="flex min-w-0 flex-col gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to={id ? `/purchase-requisitions/${id}` : "/purchase-requisitions"}
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Purchase Requisition
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Edit Purchase Requisition
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Update draft purchase requisition information.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      {!error && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-primary-black">
              Requisition Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-primary-black">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-primary-black">
                  Currency
                </label>
                <select
                  required
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary-black">
                  Department
                </label>

                <select
                  required
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                >
                  <option value="">Select department</option>

                  {departmentOptions.map((department) => (
                    <option key={department.value} value={department.value}>
                      {department.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-primary-black">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
            <Link
              to={
                id ? `/purchase-requisitions/${id}` : "/purchase-requisitions"
              }
            >
              <Button type="button" disabled={submitting}>
                Cancel
              </Button>
            </Link>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
