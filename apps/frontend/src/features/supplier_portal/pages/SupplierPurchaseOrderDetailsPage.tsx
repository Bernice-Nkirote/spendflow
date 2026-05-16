import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";
import { getSupplierPurchaseOrder } from "../api/supplierPortalApi";
import { formatCurrency } from "../../../utils/formatCurrency";
import SupplierPurchaseOrderStatusBadge from "../components/SupplierPurchaseOrderStatusBadge";

type SupplierPurchaseOrderItem = {
  id: string;
  item_name: string;
  description?: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
};

type SupplierPurchaseOrder = {
  id: string;
  po_number: string;
  supplier_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  exchange_rate?: string | null;
  exchange_rate_date?: string | null;
  issued_at?: string | null;
  notes?: string | null;
  items: SupplierPurchaseOrderItem[];
};

function SupplierPurchaseOrderDetailsPage() {
  const { id } = useParams();

  const [purchaseOrder, setPurchaseOrder] =
    useState<SupplierPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!id) return;

      try {
        const data = await getSupplierPurchaseOrder(id);
        setPurchaseOrder(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id]);

  if (loading) return <LoadingState message="Loading purchase order..." />;

  if (!purchaseOrder) {
    return (
      <EmptyState
        title="Purchase order not found"
        message="This purchase order could not be found or is no longer available."
      />
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            to="/supplier-portal/purchase-orders"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Supplier Purchase Orders
          </Link>

          <p className="mt-4 text-sm text-primary-gray">Purchase Order</p>
          <h1 className="text-2xl font-bold text-primary-black">
            {purchaseOrder.po_number}
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            Review issued PO details and create an invoice when ready.
          </p>
        </div>

        <Link
          to={`/supplier-portal/purchase-orders/${purchaseOrder.id}/create-invoice`}
          className="rounded-xl bg-primary-blue px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          Create Invoice
        </Link>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <SupplierPurchaseOrderStatusBadge status={purchaseOrder.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              PO Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {formatCurrency(
                Number(purchaseOrder.total_amount),
                purchaseOrder.currency,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Base Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {purchaseOrder.base_amount && purchaseOrder.base_currency
                ? formatCurrency(
                    Number(purchaseOrder.base_amount),
                    purchaseOrder.base_currency,
                  )
                : "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Issued Date
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {purchaseOrder.issued_at
                ? new Date(purchaseOrder.issued_at).toLocaleDateString()
                : "Not issued"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-primary-black">
          Purchase Order Items
        </h2>

        {purchaseOrder.items.length === 0 ? (
          <EmptyState
            title="No items found"
            message="This purchase order does not have any line items."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {purchaseOrder.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-3 text-primary-gray">
                      {item.description || "No description"}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        Number(item.unit_price),
                        purchaseOrder.currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(
                        Number(item.total_price),
                        purchaseOrder.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SupplierPurchaseOrderDetailsPage;
