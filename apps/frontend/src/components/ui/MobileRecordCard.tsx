import type { ReactNode } from "react";

type MobileRecordCardRow = {
  label: string;
  value: ReactNode;
};

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  rows: MobileRecordCardRow[];
  actions?: ReactNode;
};

export default function MobileRecordCard({
  title,
  subtitle,
  rows,
  actions,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-primary-black">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 break-words text-xs text-primary-gray">
            {subtitle}
          </p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              {row.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-primary-black">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
