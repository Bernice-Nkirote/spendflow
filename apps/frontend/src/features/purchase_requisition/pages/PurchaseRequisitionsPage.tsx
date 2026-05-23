import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { userHasPermission } from "../../../utils/permissions";

import { getPaginatedPurchaseRequisitions } from "../api/purchaseRequisitionApi";
import PurchaseRequisitionTable from "../components/PurchaseRequisitionTable";
import type { PurchaseRequisitionListItem } from "../types/purchaseRequisition.types";

export default function PurchaseRequisitionsPage() {
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<
    PurchaseRequisitionListItem[]
  >([]);

  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const skip = (page - 1) * pageSize;
  const canCreatePR = userHasPermission("pr.create");

  useEffect(() => {
    async function fetchPurchaseRequisitionRecords() {
      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const response = await getPaginatedPurchaseRequisitions({
          skip,
          limit: pageSize,
        });

        setPurchaseRequisitions(response.rows);
        setTotalCount(response.total_count);
      } catch {
        if (initialLoading) {
          setError("Failed to load purchase requisitions.");
        } else {
          setRecordsError("Failed to update purchase requisitions.");
        }
      } finally {
        setRecordsLoading(false);
        setInitialLoading(false);
      }
    }

    fetchPurchaseRequisitionRecords();
  }, [skip, pageSize]);

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requisitions"
        description="View, track, and manage internal purchase requisition requests."
        actions={
          canCreatePR ? (
            <Link to="/purchase-requisitions/new">
              <Button>Create PR</Button>
            </Link>
          ) : undefined
        }
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          {recordsLoading && purchaseRequisitions.length > 0 && (
            <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              Updating purchase requisitions...
            </p>
          )}

          {recordsError ? (
            <ErrorState message={recordsError} />
          ) : purchaseRequisitions.length === 0 && !recordsLoading ? (
            <EmptyState
              title="No purchase requisitions found"
              message="Purchase requisitions created by your company will appear here."
            />
          ) : (
            <>
              <PurchaseRequisitionTable
                purchaseRequisitions={purchaseRequisitions}
              />

              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
