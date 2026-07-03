import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl space-y-6 ${className}`}>
      {children}
    </div>
  );
}

export default PageContainer;