import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getPurchaseOrders } from "../api/purchaseOrderApi";
import PurchaseOrderTable from "../components/PurchaseOrderTable";
import type { PurchaseOrderListItem } from "../types/purchaseOrder.types";

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPurchaseOrders() {
    try {
      setLoading(true);
      setError(null);

      const response = await getPurchaseOrders();
      setPurchaseOrders(response);
    } catch {
      setError("Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-black">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            Manage standalone purchase orders and purchase orders created from
            approved requisitions.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/purchase-requisitions">
            <Button variant="secondary">Create from Approved PR</Button>
          </Link>

          <Link to="/purchase-orders/new">
            <Button>Create Standalone PO</Button>
          </Link>
        </div>
      </div>

      {purchaseOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          message="Purchase orders will appear here after they are created from an approved requisition or created as standalone POs."
        />
      ) : (
        <PurchaseOrderTable purchaseOrders={purchaseOrders} />
      )}
    </div>
  );
}
