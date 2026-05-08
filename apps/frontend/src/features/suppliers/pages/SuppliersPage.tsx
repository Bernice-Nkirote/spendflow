import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isValidPhoneNumber } from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import PhoneInputField from "../../../components/ui/PhoneInputField";

import {
  activateSupplier,
  createSupplier,
  deactivateSupplier,
  getSuppliers,
} from "../api/supplierApi";
import type { Supplier, SupplierCreatePayload } from "../types/supplier.types";
import SupplierStatusBadge from "../components/SupplierStatusBadge";

const initialFormState: SupplierCreatePayload = {
  name: "",
  email: "",
  address: "",
  contact_person: "",
};

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] =
    useState<SupplierCreatePayload>(initialFormState);

  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>(undefined);
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadSuppliers() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load suppliers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    setPhoneNumberError("");

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPhoneNumberError("Enter a valid phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createSupplier({
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: phoneNumber || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
      });

      setFormData(initialFormState);
      setPhoneNumber(undefined);
      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create supplier.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleSupplier(supplier: Supplier) {
    try {
      setError("");

      if (supplier.is_active) {
        await deactivateSupplier(supplier.id);
      } else {
        await activateSupplier(supplier.id);
      }

      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to update supplier status.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage supplier records used for purchase orders and invoices.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create Supplier</h2>

        <form
          onSubmit={handleCreateSupplier}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">
              Supplier Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="e.g. ABC Office Supplies"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Person
            </label>
            <input
              name="contact_person"
              value={formData.contact_person ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="e.g. Mary Wanjiku"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="supplier@example.com"
            />
          </div>

          <div>
            <PhoneInputField
              label="Phone"
              value={phoneNumber}
              onChange={setPhoneNumber}
              error={phoneNumberError}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              placeholder="Supplier address"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Supplier"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Supplier List</h2>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-gray-500">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            No suppliers found. Create your first supplier above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Contact Person
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {supplier.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.contact_person || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {supplier.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <SupplierStatusBadge isActive={supplier.is_active} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justiify-end gap-2">
                        <Link
                          to={`/suppliers/${supplier.id}`}
                          className="rounded=lg bg-primary-blue px-4 py-2 text-xs font-semibold text-white hover:bg-primary-blue/90"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleSupplier(supplier)}
                          className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {supplier.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SuppliersPage;
