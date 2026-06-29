import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  value: string | number;
  description: string;
  accentColor: "blue" | "purple" | "red" | "yellow" | "green";
};

type IconProps = {
  className?: string;
};

function DocumentIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function OrderIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function ApprovalIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function SpendIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

const cardStyles: Record<
  SummaryCardProps["accentColor"],
  {
    gradient: string;
    glow: string;
    icon: ReactNode;
    iconText: string;
  }
> = {
  blue: {
    gradient: "kpi-gradient-procurement",
    glow: "bg-[#007CBE]/12",
    icon: <DocumentIcon className="h-5 w-5" />,
    iconText: "text-[#007CBE]",
  },
  purple: {
    gradient: "kpi-gradient-orders",
    glow: "bg-[#02C3BD]/12",
    icon: <OrderIcon className="h-5 w-5" />,
    iconText: "text-[#26658C]",
  },
  yellow: {
    gradient: "kpi-gradient-approvals",
    glow: "bg-[#E57A44]/12",
    icon: <ApprovalIcon className="h-5 w-5" />,
    iconText: "text-[#E57A44]",
  },
  green: {
    gradient: "kpi-gradient-spend",
    glow: "bg-[#B0DB43]/16",
    icon: <SpendIcon className="h-5 w-5" />,
    iconText: "text-[#414288]",
  },
  red: {
    gradient: "kpi-gradient-approvals",
    glow: "bg-red-100/70",
    icon: <ApprovalIcon className="h-5 w-5" />,
    iconText: "text-red-700",
  },
};

export default function SummaryCard({
  title,
  value,
  description,
  accentColor,
}: SummaryCardProps) {
  const styles = cardStyles[accentColor];

  return (
    <div className="group relative min-h-[172px] overflow-hidden rounded-3xl border border-white/75 bg-white/80 p-5 shadow-[0_18px_45px_rgba(1,28,64,0.08)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_24px_60px_rgba(1,28,64,0.12)] sm:p-6">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${styles.gradient}`} />
      <div
        className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[10rem] text-sm font-semibold leading-5 text-primary-gray">
            {title}
          </p>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/75 bg-white/70 shadow-sm backdrop-blur ${styles.iconText}`}
          >
            {styles.icon}
          </div>
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-[#011C40] sm:text-4xl">
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-primary-gray">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}