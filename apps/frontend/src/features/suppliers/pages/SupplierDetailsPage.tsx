import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  activateSupplier,
  deactivateSupplier,
  getSupplierById,
  updateSupplier,
} from "../api/supplierApi";
import SupplierStatusBadge from "../components/SupplierStatusBadge";
import type { Supplier, SupplierUpdatePayload } from "../types/supplier.types";

const emptyForm: SupplierUpdatePayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contact_person: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SupplierDetailsPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierUpdatePayload>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSupplier() {
    if (!supplierId) return;

    try {
      setIsLoading(true);
      setError("");

      const data = await getSupplierById(supplierId);
      setSupplier(data);
      setFormData({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        contact_person: data.contact_person || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load supplier details.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSupplier();
  }, [supplierId]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supplierId) return;

    if (!formData.name?.trim()) {
      setError("Supplier name is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const updatedSupplier = await updateSupplier(supplierId, {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person?.trim() || null,
      });

      setSupplier(updatedSupplier);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update supplier.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!supplier) return;

    try {
      setError("");

      const updatedSupplier = supplier.is_active
        ? await deactivateSupplier(supplier.id)
        : await activateSupplier(supplier.id);

      setSupplier(updatedSupplier);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to update supplier status.",
      );
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading supplier...</div>;
  }

  if (error && !supplier) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!supplier) {
    return <div className="text-sm text-gray-500">Supplier not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <Link
          to="/suppliers"
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Suppliers
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {supplier.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Supplier profile and contact information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SupplierStatusBadge isActive={supplier.is_active} />

            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? "Cancel Edit" : "Edit Supplier"}
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90"
            >
              {supplier.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isEditing ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Edit Supplier</h2>

          <form
            onSubmit={handleSave}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-medium text-gray-700">
                Supplier Name
              </label>
              <input
                name="name"
                value={formData.name ?? ""}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
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
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                value={formData.phone ?? ""}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Address / Location
              </label>
              <textarea
                name="address"
                value={formData.address ?? ""}
                onChange={handleChange}
                rows={4}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
              />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Supplier Information
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Supplier Name
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {supplier.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Contact Person
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {supplier.contact_person || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </p>
              <p className="mt-1 break-words text-sm text-gray-700">
                {supplier.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Phone
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {supplier.phone || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Address / Location
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {supplier.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Created At
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(supplier.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Updated At
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(supplier.updated_at)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default SupplierDetailsPage;
