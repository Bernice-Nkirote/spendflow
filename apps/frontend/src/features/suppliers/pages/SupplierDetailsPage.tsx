import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  activateSupplier,
  activateSupplierUser,
  createSupplierUser,
  deactivateSupplier,
  deactivateSupplierUser,
  getSupplierById,
  getSupplierUsers,
  updateSupplier,
  resendSupplierSetupLink,
} from "../api/supplierApi";
import SupplierStatusBadge from "../components/SupplierStatusBadge";
import type {
  Supplier,
  SupplierUpdatePayload,
  SupplierUser,
} from "../types/supplier.types";

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

function getSupplierUserStatus(user: SupplierUser) {
  if (!user.is_active) {
    return {
      label: "Inactive",
      className: "bg-red-50 text-red-700",
    };
  }

  if (!user.has_completed_onboarding) {
    return {
      label: "Pending setup",
      className: "bg-yellow-50 text-yellow-700",
    };
  }

  return {
    label: "Active",
    className: "bg-green-50 text-green-700",
  };
}

function SupplierDetailsPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierUpdatePayload>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [supplierUsers, setSupplierUsers] = useState<SupplierUser[]>([]);
  const [portalEmail, setPortalEmail] = useState("");
  const [isCreatingPortalUser, setIsCreatingPortalUser] = useState(false);
  const [portalMessage, setPortalMessage] = useState("");

  async function loadSupplier() {
    if (!supplierId) return;

    try {
      setIsLoading(true);
      setError("");

      const data = await getSupplierById(supplierId);
      const users = await getSupplierUsers(supplierId);

      setSupplier(data);
      setSupplierUsers(users);
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

  async function handleCreateSupplierUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!supplierId) return;

    if (!portalEmail.trim()) {
      setError("Supplier portal email is required.");
      return;
    }

    try {
      setIsCreatingPortalUser(true);
      setError("");
      setPortalMessage("");

      const createdUser = await createSupplierUser({
        supplier_id: supplierId,
        email: portalEmail.trim(),
      });

      setSupplierUsers((current) => [createdUser, ...current]);
      setPortalEmail("");

      setPortalMessage(
        "Supplier portal user created successfully. A setup link has been sent by email.",
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to create supplier portal user.",
      );
    } finally {
      setIsCreatingPortalUser(false);
    }
  }

  async function handleToggleSupplierUserStatus(user: SupplierUser) {
    if (!supplierId) return;

    try {
      setError("");
      setPortalMessage("");

      const updatedUser = user.is_active
        ? await deactivateSupplierUser(user.id, supplierId)
        : await activateSupplierUser(user.id, supplierId);

      setSupplierUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setPortalMessage(
        updatedUser.is_active
          ? "Supplier portal user activated."
          : "Supplier portal user deactivated.",
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to update supplier portal user status.",
      );
    }
  }

  async function handleResendSetupLink(user: SupplierUser) {
    if (!supplierId) return;

    try {
      setError("");
      setPortalMessage("");

      const updatedUser = await resendSupplierSetupLink(user.id, supplierId);

      setSupplierUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setPortalMessage("A new setup link has been sent to the supplier.");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to resend supplier setup link.",
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
        <section
          id="portal-users"
          className="rounded-xl border bg-white p-5 shadow-sm"
        >
          {" "}
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
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Supplier Portal Users
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage login access for this supplier. Supplier users
              can log in through the supplier portal and only view their own
              purchase orders, invoices, and payment history.
            </p>
          </div>
        </div>
        {portalMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {portalMessage}
          </div>
        )}

        <form
          onSubmit={handleCreateSupplierUser}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">
              Supplier User Email
            </label>
            <input
              type="email"
              value={portalEmail}
              onChange={(event) => setPortalEmail(event.target.value)}
              placeholder="supplier@example.com"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreatingPortalUser}
              className="w-full rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingPortalUser ? "Creating..." : "Create Portal User"}
            </button>
          </div>
        </form>
        <div className="mt-6 overflow-x-auto">
          {supplierUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-gray-500">
              No portal users have been created for this supplier yet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {supplierUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{user.email}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const status = getSupplierUserStatus(user);

                        return (
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {!user.has_completed_onboarding && user.is_active && (
                          <button
                            type="button"
                            onClick={() => handleResendSetupLink(user)}
                            className="whitespace-nowrap rounded-lg border border-primary-blue bg-blue-50 px-3 py-1.5 text-sm font-semibold text-primary-blue transition hover:bg-blue-100"
                          >
                            Resend Setup Link
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleSupplierUserStatus(user)}
                          className="whitespace-nowrap text-sm font-medium text-primary-blue hover:underline"
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default SupplierDetailsPage;
