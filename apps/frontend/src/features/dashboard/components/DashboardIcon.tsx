type DashboardIconName =
  | "action"
  | "analytics"
  | "approval"
  | "activity"
  | "reports"
  | "spend"
  | "supplier"
  | "workflow";

type DashboardIconProps = {
  name: DashboardIconName;
};

const paths: Record<DashboardIconName, string[]> = {
  action: [
    "M12 3v3",
    "M12 18v3",
    "M4.22 5.22l2.12 2.12",
    "M17.66 16.66l2.12 2.12",
    "M3 12h3",
    "M18 12h3",
    "M4.22 18.78l2.12-2.12",
    "M17.66 7.34l2.12-2.12",
    "M9 12l2 2 4-5",
  ],
  analytics: [
    "M4 19V5",
    "M4 19h16",
    "M8 16v-5",
    "M12 16V8",
    "M16 16v-7",
    "M8 11l4-3 4 1 3-4",
  ],
  approval: [
    "M12 3l7 4v5c0 4.5-2.9 7.4-7 9-4.1-1.6-7-4.5-7-9V7l7-4z",
    "M9 12l2 2 4-5",
  ],
  activity: [
    "M4 12h4l2-6 4 12 2-6h4",
    "M4 19h16",
  ],
  reports: [
    "M7 3h7l4 4v14H7V3z",
    "M14 3v5h5",
    "M9 13h6",
    "M9 17h4",
  ],
  spend: [
    "M12 3v18",
    "M16 7.5c-.7-1.1-2-1.8-4-1.8-2.4 0-4 1.1-4 2.8 0 4.5 8 1.8 8 6.6 0 1.8-1.6 3.2-4.2 3.2-2.1 0-3.6-.7-4.8-2",
  ],
  supplier: [
    "M4 20V8l8-4 8 4v12",
    "M8 20v-7h8v7",
    "M8 10h.01",
    "M12 10h.01",
    "M16 10h.01",
  ],
  workflow: [
    "M6 7h6a4 4 0 014 4v0",
    "M14 9l2 2 2-2",
    "M18 17h-6a4 4 0 01-4-4v0",
    "M10 15l-2-2-2 2",
  ],
};

export default function DashboardIcon({ name }: DashboardIconProps) {
  return (
    <span className="dashboard-icon-shell flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name].map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}
