import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import LoadingState from "../../../components/ui/LoadingState";
import { getSupplierPurchaseOrders } from "../api/supplierPortalApi";
import { formatCurrency } from "../../../utils/formatCurrency";
import SupplierPurchaseOrderStatusBadge from "../components/SupplierPurchaseOrderStatusBadge";

type SupplierPurchaseOrder = {
  id: string;
  po_number: string;
  supplier_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  issued_at?: string | null;
  created_at: string;
};

function SupplierPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<SupplierPurchaseOrder[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const data = await getSupplierPurchaseOrders();
        setPurchaseOrders(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  if (loading) return <LoadingState message="Loading purchase orders..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-black">
            Supplier Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            View purchase orders issued to your supplier account.
          </p>
        </div>
      </div>

      <Card>
        {purchaseOrders.length === 0 ? (
          <EmptyState
            title="No purchase orders found"
            message="Purchase orders issued to your supplier account will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Base Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Issued At
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-blue">
                      {po.po_number}
                    </td>
                    <td className="px-4 py-3">
                      <SupplierPurchaseOrderStatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(Number(po.total_amount), po.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {po.base_amount && po.base_currency
                        ? formatCurrency(
                            Number(po.base_amount),
                            po.base_currency,
                          )
                        : "Not available"}
                    </td>
                    <td className="px-4 py-3">
                      {po.issued_at
                        ? new Date(po.issued_at).toLocaleDateString()
                        : "Not issued"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/supplier-portal/purchase-orders/${po.id}`}
                        className="text-sm font-medium text-primary-blue hover:underline"
                      >
                        View
                      </Link>
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

export default SupplierPurchaseOrdersPage;
