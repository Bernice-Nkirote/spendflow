import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import TableWrapper from "../../../components/ui/TableWrapper";
import PageHeader from "../../../components/ui/PageHeader";

import { getInvoicesByPurchaseOrder } from "../../invoices/api/invoiceApi";
import { getPurchaseOrderById } from "../api/purchaseOrderApi";
import PurchaseOrderActions from "../components/PurchaseOrderActions";
import PurchaseOrderStatusBadge from "../components/PurchaseOrderStatusBadge";

import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";
import type { PurchaseOrderDetails } from "../types/purchaseOrder.types";

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

function formatQuantity(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) return "0";

  return numericValue.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get("returnTo");
  const canCreateInvoice = userHasPermission("invoice.create");

  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrderDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPurchaseOrder() {
      if (!id) {
        setError("Purchase order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [purchaseOrderResponse, invoiceResponse] = await Promise.all([
          getPurchaseOrderById(id),
          getInvoicesByPurchaseOrder(id),
        ]);

        setPurchaseOrder(purchaseOrderResponse);
        setLinkedInvoiceId(invoiceResponse[0]?.id ?? null);
      } catch {
        setError("Failed to load purchase order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseOrder();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!purchaseOrder) {
    return <ErrorState message="Purchase order was not found." />;
  }

  return (
    <PageContainer>
      {returnTo ? (
        <BackButton label="Back to Approval" to={returnTo} />
      ) : (
        <BackButton
          fallbackLabel="Back to Purchase Orders"
          fallbackTo="/purchase-orders"
        />
      )}

      <PageHeader
        title={`Purchase Order ${purchaseOrder.po_number}`}
        description={`Supplier: ${purchaseOrder.supplier_name ?? "-"}`}
        actions={<PurchaseOrderStatusBadge status={purchaseOrder.status} />}
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Purchase Order Actions
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage document generation, dispatch, invoice creation, and
              workflow actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <PurchaseOrderActions
              purchaseOrder={purchaseOrder}
              onUpdated={(updatedPurchaseOrder) => {
                setPurchaseOrder(updatedPurchaseOrder);
                setActionError(null);
              }}
              onError={setActionError}
            />
            {canCreateInvoice &&
              ["APPROVED", "SENT"].includes(purchaseOrder.status) &&
              !linkedInvoiceId && (
                <Link
                  to={`/invoices/new?purchaseOrderId=${purchaseOrder.id}&from=purchase-order`}
                >
                  <Button type="button">Create Invoice</Button>
                </Link>
              )}
            {["APPROVED", "SENT"].includes(purchaseOrder.status) &&
              linkedInvoiceId && (
                <Link to={`/invoices/${linkedInvoiceId}`}>
                  <Button type="button" variant="secondary">
                    View Invoice
                  </Button>
                </Link>
              )}
          </div>
        </div>
      </Card>

      {actionError && <ErrorState message={actionError} />}

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm text-primary-gray">Original Amount</p>
          <p className="mt-2 break-words text-2xl font-semibold leading-tight text-primary-black sm:text-xl xl:text-2xl">
            {formatCurrency(
              Number(purchaseOrder.total_amount ?? 0),
              purchaseOrder.currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {purchaseOrder.currency}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Base Amount</p>
          <p className="mt-2 break-words text-2xl font-semibold leading-tight text-primary-black sm:text-xl xl:text-2xl">
            {purchaseOrder.base_amount && purchaseOrder.base_currency
              ? formatCurrency(
                  Number(purchaseOrder.base_amount),
                  purchaseOrder.base_currency,
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Used for approval thresholds
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Exchange Rate</p>
          <p className="mt-2 break-words text-2xl font-semibold leading-tight text-primary-black sm:text-xl xl:text-2xl">
            {formatRate(purchaseOrder.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {purchaseOrder.currency}
            {purchaseOrder.base_currency
              ? ` → ${purchaseOrder.base_currency}`
              : ""}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {purchaseOrder.supplier_name ?? "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Rate date: {formatDate(purchaseOrder.exchange_rate_date)}
          </p>
        </Card>

        <Card
          className={`p-4 shadow-md ${
            purchaseOrder.signed_pdf_file_path
              ? "border-green-200 bg-green-50"
              : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              purchaseOrder.signed_pdf_file_path
                ? "text-green-700"
                : "text-yellow-700"
            }`}
          >
            Signed PDF
          </p>

          <p
            className={`mt-2 text-lg font-semibold ${
              purchaseOrder.signed_pdf_file_path
                ? "text-green-800"
                : "text-yellow-800"
            }`}
          >
            {purchaseOrder.signed_pdf_file_path
              ? "Uploaded"
              : "Required before dispatch"}
          </p>

          <p className="mt-1 break-words text-xs text-primary-gray">
            {purchaseOrder.signed_pdf_original_filename ??
              "Download the PO, sign it, then upload the signed PDF."}
          </p>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Purchase Order Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              PO Number
            </p>
            <p className="mt-1 break-words text-sm text-primary-black">
              {purchaseOrder.po_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PR Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.pr_number ?? "Standalone"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Department
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.department_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.created_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Submitted By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.submitted_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Issued By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.issued_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <PurchaseOrderStatusBadge status={purchaseOrder.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Submitted At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.submitted_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Issued At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.issued_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.updated_at)}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-primary-black">
              {purchaseOrder.notes || "-"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Purchase Order Items
            </h2>
            <p className="mt-1 text-sm text-primary-gray">
              Item-level details attached to this purchase order.
            </p>
          </div>

          <p className="text-sm text-primary-gray">
            {purchaseOrder.items.length} items
          </p>
        </div>

        <div className="mt-4">
          <TableWrapper minWidth="850px">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Description
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Quantity
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Unit Price
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {purchaseOrder.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      <span
                        className="block max-w-[260px] whitespace-pre-wrap break-words"
                        title={item.item_name}
                      >
                        {item.item_name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-primary-black">
                      <span
                        className="block max-w-[360px] whitespace-pre-wrap break-words leading-6"
                        title={item.description ?? ""}
                      >
                        {item.description || "-"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatQuantity(item.quantity)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatCurrency(
                        Number(item.unit_price ?? 0),
                        purchaseOrder.currency,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary-black">
                      {formatCurrency(
                        Number(item.total_price ?? 0),
                        purchaseOrder.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </div>
      </Card>
    </PageContainer>
  );
}
