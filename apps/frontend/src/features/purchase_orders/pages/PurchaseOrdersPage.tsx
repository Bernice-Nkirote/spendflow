import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
  stickyRightCell,
  stickyRightHeader,
} from "../../../components/ui/tableStickyStyles";
import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";

import { getPurchaseRequisitionsReadyForPO } from "../../purchase_requisition/api/purchaseRequisitionApi";
import PurchaseRequisitionStatusBadge from "../../purchase_requisition/components/PurchaseRequisitionStatusBadge";
import type { PurchaseRequisitionListItem } from "../../purchase_requisition/types/purchaseRequisition.types";

import { getPaginatedPurchaseOrders } from "../api/purchaseOrderApi";
import PurchaseOrderTable from "../components/PurchaseOrderTable";
import type { PurchaseOrderListItem } from "../types/purchaseOrder.types";

const APPROVED_PR_LIMIT = 5;

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>(
    [],
  );
  const [approvedPurchaseRequisitions, setApprovedPurchaseRequisitions] =
    useState<PurchaseRequisitionListItem[]>([]);

  const [selectedMobilePr, setSelectedMobilePr] =
    useState<PurchaseRequisitionListItem | null>(null);

  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const skip = (page - 1) * pageSize;
  const canCreatePO = userHasPermission("po.create");

  function toggleApprovedPrMobileActions(
    purchaseRequisition: PurchaseRequisitionListItem,
  ) {
    setSelectedMobilePr((current) =>
      current?.id === purchaseRequisition.id ? null : purchaseRequisition,
    );
  }

  useEffect(() => {
    async function fetchPurchaseOrdersPageData() {
      try {
        setInitialLoading(true);
        setError(null);

        if (!canCreatePO) {
          setApprovedPurchaseRequisitions([]);
          setInitialLoading(false);
          return;
        }

        const purchaseRequisitionResponse =
          await getPurchaseRequisitionsReadyForPO();

        setApprovedPurchaseRequisitions(
          purchaseRequisitionResponse.slice(0, APPROVED_PR_LIMIT),
        );
      } catch {
        setError("Failed to load purchase order page data.");
      } finally {
        setInitialLoading(false);
      }
    }

    fetchPurchaseOrdersPageData();
  }, []);

  useEffect(() => {
    async function fetchPurchaseOrderRecords() {
      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const purchaseOrderResponse = await getPaginatedPurchaseOrders({
          skip,
          limit: pageSize,
        });

        setPurchaseOrders(purchaseOrderResponse.rows);
        setTotalCount(purchaseOrderResponse.total_count);
      } catch {
        setRecordsError("Failed to load purchase orders.");
      } finally {
        setRecordsLoading(false);
      }
    }

    fetchPurchaseOrderRecords();
  }, [skip, pageSize]);

  return (
    <PageContainer className="module-theme module-procurement">
      <PageHeader
        title="Purchase Orders"
        description="Manage standalone purchase orders and purchase orders created from approved requisitions."
        actions={
          canCreatePO ? (
            <Link to="/purchase-orders/new">
              <Button type="button">Create Standalone PO</Button>
            </Link>
          ) : undefined
        }
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          {canCreatePO && (
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary-black">
                  Approved PRs Ready for PO
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Showing the latest {APPROVED_PR_LIMIT} approved purchase
                  requisitions ready for PO creation.
                </p>

                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Approved PRs ready for PO:{" "}
                  <span className="font-semibold">
                    {approvedPurchaseRequisitions.length}
                  </span>
                </div>
              </div>

              {approvedPurchaseRequisitions.length === 0 ? (
                <EmptyState
                  title="No approved PRs ready"
                  message="Approved purchase requisitions will appear here when they are ready to be converted into purchase orders."
                />
              ) : (
                <TableWrapper minWidth="900px">
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className={`${stickyLeftHeader} px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray`}
                        >
                          PR Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                          Amount
                        </th>
                        <th
                          className={`${stickyRightHeader} hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray lg:table-cell`}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                      {approvedPurchaseRequisitions.map(
                        (purchaseRequisition) => (
                          <tr
                            key={purchaseRequisition.id}
                            className="group hover:bg-gray-50"
                          >
                            <td
                              className={`${stickyLeftCell} whitespace-nowrap px-4 py-3 font-medium text-primary-black`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleApprovedPrMobileActions(
                                    purchaseRequisition,
                                  )
                                }
                                className="block max-w-[220px] text-left lg:pointer-events-none"
                                title="Tap to show actions"
                              >
                                {purchaseRequisition.pr_number}
                              </button>
                            </td>

                            <td className="px-4 py-3 text-primary-black">
                              <span
                                className="block max-w-[280px] truncate"
                                title={purchaseRequisition.title}
                              >
                                {purchaseRequisition.title}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <PurchaseRequisitionStatusBadge
                                status={purchaseRequisition.status}
                              />
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                              {formatCurrency(
                                Number(purchaseRequisition.total_amount ?? 0),
                                purchaseRequisition.currency,
                              )}
                            </td>

                            <td
                              className={`${stickyRightCell} hidden whitespace-nowrap px-4 py-3 text-right lg:table-cell`}
                            >
                              <Link
                                to={`/purchase-orders/from-requisition/${purchaseRequisition.id}`}
                                state={{
                                  from: "purchase-orders",
                                  label: "Back to Purchase Orders",
                                }}
                              >
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                >
                                  Create PO
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </TableWrapper>
              )}
            </Card>
          )}
          <MobileFloatingTableAction
            isOpen={Boolean(selectedMobilePr)}
            reference={selectedMobilePr?.pr_number ?? ""}
            label="Selected approved PR"
            onClose={() => setSelectedMobilePr(null)}
          >
            {selectedMobilePr && (
              <Link
                to={`/purchase-orders/from-requisition/${selectedMobilePr.id}`}
                state={{
                  from: "purchase-orders",
                  label: "Back to Purchase Orders",
                }}
              >
                <Button type="button" variant="secondary" size="sm">
                  Create PO
                </Button>
              </Link>
            )}
          </MobileFloatingTableAction>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Purchase Order List
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Track draft, approved, sent, and completed purchase orders.
              </p>
            </div>

            {recordsLoading && purchaseOrders.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating purchase orders...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : purchaseOrders.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No purchase orders found"
                message="Purchase orders will appear here after they are created from an approved requisition or created as standalone POs."
              />
            ) : (
              <>
                <PurchaseOrderTable purchaseOrders={purchaseOrders} />

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
          </Card>
        </>
      )}
    </PageContainer>
  );
}
