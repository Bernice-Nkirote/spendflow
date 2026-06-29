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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function CartIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h2l2.1 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L21 8H7" />
      <path d="M10 21h.01" />
      <path d="M18 21h.01" />
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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="m16 11 2 2 4-5" />
      <circle cx="18" cy="13" r="4" />
    </svg>
  );
}

function ChartIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V9" />
      <path d="M16 16v-7" />
      <path d="m14 7 3-3 3 3" />
    </svg>
  );
}

const cardStyles: Record<
  SummaryCardProps["accentColor"],
  {
    gradient: string;
    icon: ReactNode;
    iconText: string;
    iconShell: string;
    iconGlow: string;
  }
> = {
  blue: {
    gradient: "kpi-gradient-procurement",
    icon: <DocumentIcon className="h-5 w-5" />,
    iconText: "text-[#007CBE]",
    iconShell: "bg-[#007CBE]/8 ring-[#FFF7AE]/70",
    iconGlow: "shadow-[0_18px_38px_rgba(255,247,174,0.38)]",
  },
  purple: {
    gradient: "kpi-gradient-orders",
    icon: <CartIcon className="h-5 w-5" />,
    iconText: "text-[#02C3BD]",
    iconShell: "bg-[#02C3BD]/10 ring-[#02C3BD]/20",
    iconGlow: "shadow-[0_18px_38px_rgba(2,195,189,0.22)]",
  },
  yellow: {
    gradient: "kpi-gradient-approvals",
    icon: <ApprovalIcon className="h-5 w-5" />,
    iconText: "text-[#E57A44]",
    iconShell: "bg-[#E57A44]/9 ring-[#E57A44]/20",
    iconGlow: "shadow-[0_18px_38px_rgba(229,122,68,0.22)]",
  },
  green: {
    gradient: "kpi-gradient-spend",
    icon: <ChartIcon className="h-5 w-5" />,
    iconText: "text-[#414288]",
    iconShell: "bg-[#414288]/8 ring-[#B0DB43]/40",
    iconGlow: "shadow-[0_18px_38px_rgba(176,219,67,0.28)]",
  },
  red: {
    gradient: "kpi-gradient-approvals",
    icon: <ApprovalIcon className="h-5 w-5" />,
    iconText: "text-[#E57A44]",
    iconShell: "bg-[#E57A44]/9 ring-[#E57A44]/20",
    iconGlow: "shadow-[0_18px_38px_rgba(229,122,68,0.22)]",
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
    <div className="group relative min-h-[172px] overflow-hidden rounded-2xl border border-white/80 bg-white/82 p-4 shadow-[0_14px_34px_rgba(1,28,64,0.08)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_20px_45px_rgba(1,28,64,0.11)] sm:aspect-square sm:min-h-0">
      <div className={`absolute inset-x-0 top-0 h-2 ${styles.gradient}`} />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-3 pt-5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 ${styles.iconShell} ${styles.iconGlow} ${styles.iconText} ring-1 backdrop-blur`}
          >
            {styles.icon}
          </div>

          <p className="max-w-[9rem] text-base font-bold leading-6 text-[#011C40] sm:text-lg">
            {title}
          </p>
        </div>

        <div className="my-4 h-px bg-[#011C40]/10" />

        <div className="mt-auto">
          <p className="break-words text-4xl font-bold tracking-tight text-[#011C40] sm:text-[2.65rem]">
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-[#26658C]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}