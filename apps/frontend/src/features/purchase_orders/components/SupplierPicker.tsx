import { useEffect, useMemo, useState } from "react";

import Button from "../../../components/ui/Button";
import { getSupplierSummary } from "../../suppliers/api/supplierApi";
import type {
  Supplier,
  SupplierSummary,
} from "../../suppliers/types/supplier.types";

type SupplierPickerProps = {
  suppliers: Supplier[];
  value: string;
  onChange: (supplierId: string) => void;
  suggestedItemNames?: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getSuggestionTerms(itemNames: string[]) {
  return itemNames
    .flatMap((itemName) => normalize(itemName).split(/[^a-z0-9]+/))
    .filter((term) => term.length >= 4);
}

function supplierMatchesTerms(supplier: Supplier, terms: string[]) {
  if (terms.length === 0) return false;

  const haystack = normalize(
    [
      supplier.name,
      supplier.category,
      supplier.sub_category,
      supplier.contact_person,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return terms.some((term) => haystack.includes(term));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function SupplierPicker({
  suppliers,
  value,
  onChange,
  suggestedItemNames = [],
}: SupplierPickerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [summary, setSummary] = useState<SupplierSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const selectedSupplier = suppliers.find((supplier) => supplier.id === value);

  const suggestionTerms = useMemo(
    () => getSuggestionTerms(suggestedItemNames),
    [suggestedItemNames],
  );

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        suppliers
          .map((supplier) => supplier.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort((first, second) => first.localeCompare(second));
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = normalize(search);

    return suppliers
      .filter((supplier) => {
        if (categoryFilter && supplier.category !== categoryFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return normalize(
          [
            supplier.name,
            supplier.category,
            supplier.sub_category,
            supplier.email,
            supplier.contact_person,
          ]
            .filter(Boolean)
            .join(" "),
        ).includes(normalizedSearch);
      })
      .sort((first, second) => {
        const firstSuggested = supplierMatchesTerms(first, suggestionTerms);
        const secondSuggested = supplierMatchesTerms(second, suggestionTerms);

        if (firstSuggested === secondSuggested) {
          return first.name.localeCompare(second.name);
        }

        return firstSuggested ? -1 : 1;
      });
  }, [categoryFilter, search, suppliers, suggestionTerms]);

  useEffect(() => {
    async function loadSummary() {
      if (!value) {
        setSummary(null);
        setSummaryError("");
        return;
      }

      try {
        setSummaryLoading(true);
        setSummaryError("");

        const response = await getSupplierSummary(value);

        setSummary(response);
      } catch {
        setSummary(null);
        setSummaryError("Could not load supplier preview.");
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <label className="block text-sm font-medium text-primary-black">
            Search suppliers
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
            placeholder="Search by supplier, category, contact, or email"
          />
        </div>

        <div className="lg:w-64">
          <label className="block text-sm font-medium text-primary-black">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSupplier && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-blue">
                Selected supplier
              </p>
              <p className="mt-1 text-base font-semibold text-primary-black">
                {selectedSupplier.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary-blue">
                  {selectedSupplier.category || "Uncategorised"}
                </span>
                {selectedSupplier.sub_category && (
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary-gray">
                    {selectedSupplier.sub_category}
                  </span>
                )}
              </div>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Clear
            </Button>
          </div>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-gray">
                Contact
              </p>
              <p className="mt-1 text-primary-black">
                {selectedSupplier.contact_person || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-primary-gray">
                Email
              </p>
              <p className="mt-1 break-words text-primary-black">
                {selectedSupplier.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-primary-gray">
                Location
              </p>
              <p className="mt-1 text-primary-black">
                {selectedSupplier.address || summary?.location || "-"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-primary-gray">
              Recent supplied items
            </p>
            {summaryLoading ? (
              <p className="mt-2 text-sm text-primary-gray">
                Loading supplier preview...
              </p>
            ) : summaryError ? (
              <p className="mt-2 text-sm text-accent-error">{summaryError}</p>
            ) : summary?.recent_supplied_items.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {summary.recent_supplied_items.slice(0, 4).map((item) => (
                  <span
                    key={`${item.po_id}-${item.item_name}`}
                    className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary-blue"
                  >
                    {item.item_name} · {formatDate(item.supplied_at)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-primary-gray">
                No recent supplied items recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
        {filteredSuppliers.length === 0 ? (
          <p className="rounded-lg bg-white px-3 py-4 text-sm text-primary-gray">
            No suppliers match the current search or category.
          </p>
        ) : (
          filteredSuppliers.map((supplier) => {
            const isSelected = supplier.id === value;
            const isSuggested = supplierMatchesTerms(
              supplier,
              suggestionTerms,
            );

            return (
              <button
                key={supplier.id}
                type="button"
                onClick={() => onChange(supplier.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-primary-blue bg-blue-50"
                    : "border-gray-200 bg-white hover:border-primary-blue/30 hover:bg-blue-50/40"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-primary-black">
                        {supplier.name}
                      </p>
                      {isSuggested && (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          Suggested
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-primary-gray">
                      {supplier.contact_person || "No contact person"} ·{" "}
                      {supplier.email || "No email"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                      {supplier.category || "Uncategorised"}
                    </span>
                    {supplier.sub_category && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-primary-gray">
                        {supplier.sub_category}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
