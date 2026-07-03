import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-header-title text-2xl font-bold tracking-tight text-primary-black">
          {title}
        </h1>

        {description && (
          <p className="page-header-description mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;