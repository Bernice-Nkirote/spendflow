import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

function PageContainer({ children }: PageContainerProps) {
  return <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>;
}

export default PageContainer;
