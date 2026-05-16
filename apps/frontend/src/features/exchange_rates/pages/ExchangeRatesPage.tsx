import { useEffect, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import {
  createExchangeRate,
  deleteExchangeRate,
  getExchangeRates,
  updateExchangeRate,
} from "../api/exchangeRateApi";
import type { ExchangeRate } from "../types/exchangeRate.types";

function ExchangeRatesPage() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionRateId, setActionRateId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadExchangeRates() {
    try {
      setIsLoading(true);
      setError("");
      const data = await getExchangeRates();
      setExchangeRates(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load exchange rates.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (!error) return;

    const timer = window.setTimeout(() => {
      setError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error]);

  function resetForm() {
    setFromCurrency("");
    setToCurrency("");
    setRate("");
    setSource("MANUAL");
    setEffectiveDate("");
    setEditingRate(null);
  }

  function startEdit(exchangeRate: ExchangeRate) {
    setEditingRate(exchangeRate);
    setFromCurrency(exchangeRate.from_currency);
    setToCurrency(exchangeRate.to_currency);
    setRate(String(exchangeRate.rate));
    setSource(exchangeRate.source);
    setEffectiveDate(exchangeRate.effective_date);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedFromCurrency = fromCurrency.trim().toUpperCase();
    const normalizedToCurrency = toCurrency.trim().toUpperCase();
    const normalizedSource = source.trim().toUpperCase() || "MANUAL";
    const numericRate = Number(rate);

    if (normalizedFromCurrency.length !== 3) {
      setError("From currency must be a 3-letter code, for example USD.");
      return;
    }

    if (normalizedToCurrency.length !== 3) {
      setError("To currency must be a 3-letter code, for example KES.");
      return;
    }

    if (normalizedFromCurrency === normalizedToCurrency) {
      setError("From currency and to currency cannot be the same.");
      return;
    }

    if (!numericRate || numericRate <= 0) {
      setError("Exchange rate must be greater than zero.");
      return;
    }

    if (!effectiveDate) {
      setError("Effective date is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingRate) {
        await updateExchangeRate(editingRate.id, {
          rate: numericRate,
          source: normalizedSource,
          effective_date: effectiveDate,
        });
      } else {
        await createExchangeRate({
          from_currency: normalizedFromCurrency,
          to_currency: normalizedToCurrency,
          rate: numericRate,
          source: normalizedSource,
          effective_date: effectiveDate,
        });
      }

      resetForm();
      await loadExchangeRates();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to save exchange rate.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(exchangeRate: ExchangeRate) {
    const confirmed = window.confirm(
      `Delete ${exchangeRate.from_currency} to ${exchangeRate.to_currency} rate for ${exchangeRate.effective_date}?`,
    );

    if (!confirmed) return;

    try {
      setActionRateId(exchangeRate.id);
      setError("");

      await deleteExchangeRate(exchangeRate.id);
      await loadExchangeRates();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to delete exchange rate.",
      );
    } finally {
      setActionRateId(null);
    }
  }

  return (
    <div className="relative space-y-6">
      {error && (
        <div className="fixed right-4 top-20 z-[9999] max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900"
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              {editingRate ? "Edit exchange rate" : "Add exchange rate"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure rates used to convert transaction currencies into the
              company base currency for approvals and reporting.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5 md:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From currency
              </label>
              <input
                value={fromCurrency}
                onChange={(event) => setFromCurrency(event.target.value)}
                placeholder="USD"
                disabled={Boolean(editingRate)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-primary-blue disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To currency
              </label>
              <input
                value={toCurrency}
                onChange={(event) => setToCurrency(event.target.value)}
                placeholder="KES"
                disabled={Boolean(editingRate)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-primary-blue disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rate
              </label>
              <input
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="129.50"
                type="number"
                min="0"
                step="0.000001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Effective date
              </label>
              <input
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingRate ? "Update" : "Create"}
              </Button>

              {editingRate && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-sm">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Source
            </label>
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="MANUAL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-primary-blue"
            />
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Exchange rate list
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Rates are used when PRs, POs, invoices, and payments are submitted
            for approval.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading exchange rates...</p>
        ) : exchangeRates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm font-medium text-primary-black">
              No exchange rates found
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Add your first exchange rate before submitting foreign-currency
              transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Currency pair</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Effective date</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exchangeRates.map((exchangeRate) => (
                  <tr key={exchangeRate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      {exchangeRate.from_currency} → {exchangeRate.to_currency}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {Number(exchangeRate.rate).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {exchangeRate.effective_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary-blue">
                        {exchangeRate.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(exchangeRate)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDelete(exchangeRate)}
                          disabled={actionRateId === exchangeRate.id}
                        >
                          Delete
                        </Button>
                      </div>
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

export default ExchangeRatesPage;
