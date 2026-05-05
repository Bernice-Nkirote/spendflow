import { useMemo, useState } from "react";

export type ReportTableColumn<T> = {
  header: string;
  accessor: keyof T;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type SortDirection = "asc" | "desc";

type Props<T> = {
  columns: readonly ReportTableColumn<T>[];
  data: T[];
};

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const numericValue = Number(value);

  if (!Number.isNaN(numericValue)) return numericValue;

  const dateValue = Date.parse(String(value));

  if (!Number.isNaN(dateValue)) return dateValue;

  return String(value).toLowerCase();
}

export default function ReportTable<T>({ columns, data }: Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(accessor: keyof T, sortable?: boolean) {
    if (!sortable) return;

    if (sortKey === accessor) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(accessor);
    setSortDirection("asc");
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = normalizeValue(a[sortKey]);
      const bValue = normalizeValue(b[sortKey]);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className="min-w-0 rounded-xl border bg-white shadow-sm">
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-[900px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.accessor;

                return (
                  <th
                    key={String(col.accessor)}
                    onClick={() => handleSort(col.accessor, col.sortable)}
                    className={`whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${
                      col.sortable
                        ? "cursor-pointer select-none hover:bg-gray-100"
                        : ""
                    } ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-flex w-full items-center gap-1 ${
                        col.align === "right"
                          ? "justify-end"
                          : col.align === "center"
                            ? "justify-center"
                            : "justify-start"
                      }`}
                    >
                      {col.header}

                      {col.sortable && (
                        <span className="text-xs text-gray-400">
                          {isSorted
                            ? sortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className="border-b transition-colors hover:bg-gray-50"
              >
                {columns.map((col) => {
                  const value = row[col.accessor];

                  return (
                    <td
                      key={String(col.accessor)}
                      className={`max-w-[260px] border-b px-4 py-3 align-top text-gray-700 ${
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      <div className="truncate">
                        {col.render
                          ? col.render(value, row)
                          : String(value ?? "-")}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
