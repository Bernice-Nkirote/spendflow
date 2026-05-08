import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getPurchaseRequisitions } from "../api/purchaseRequisitionApi";
import PurchaseRequisitionTable from "../components/PurchaseRequisitionTable";
import type { PurchaseRequisitionListItem } from "../types/purchaseRequisition.types";

const PAGE_SIZE = 20;

export default function PurchaseRequisitionsPage() {
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<
    PurchaseRequisitionListItem[]
  >([]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const skip = (page - 1) * PAGE_SIZE;
  const hasPreviousPage = page > 1;
  const hasNextPage = purchaseRequisitions.length === PAGE_SIZE;

  useEffect(() => {
    async function fetchPurchaseRequisitions() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPurchaseRequisitions({
          skip,
          limit: PAGE_SIZE,
        });

        setPurchaseRequisitions(response);
      } catch {
        setError("Failed to load purchase requisitions.");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseRequisitions();
  }, [skip]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-black">
            Purchase Requisitions
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            View and manage internal purchase requisition requests.
          </p>
        </div>

        <Link to="/purchase-requisitions/new">
          <Button>Create PR</Button>
        </Link>
      </div>

      {loading && <LoadingState />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && purchaseRequisitions.length === 0 && (
        <EmptyState
          title="No purchase requisitions found"
          message="Purchase requisitions created by your company will appear here."
        />
      )}

      {!loading && !error && purchaseRequisitions.length > 0 && (
        <>
          <PurchaseRequisitionTable
            purchaseRequisitions={purchaseRequisitions}
          />

          <div className="flex flex-col gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-primary-gray">Page {page}</p>

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={!hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>

              <Button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
