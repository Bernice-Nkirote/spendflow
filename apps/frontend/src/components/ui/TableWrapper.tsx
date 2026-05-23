import type { ReactNode } from "react";

type TableWrapperProps = {
  children: ReactNode;
  minWidth?: string;
};

function TableWrapper({ children, minWidth = "900px" }: TableWrapperProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

export default TableWrapper;
