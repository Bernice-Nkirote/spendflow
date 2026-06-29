import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/40 focus:ring-offset-2 focus:ring-offset-white";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "border border-[#54ACBF]/40 bg-[#26658C] text-white shadow-sm shadow-[#26658C]/20 hover:-translate-y-0.5 hover:bg-[#007CBE] hover:shadow-md hover:shadow-[#54ACBF]/25",
    secondary:
      "border border-[#A7EBF2]/70 bg-white/75 text-[#26658C] shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-[#54ACBF]/70 hover:bg-white hover:text-[#007CBE] hover:shadow-md",
    success:
      "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md",
    danger:
      "bg-accent-error text-white shadow-sm shadow-red-700/20 hover:-translate-y-0.5 hover:bg-[#990502] hover:shadow-md",
    ghost:
      "bg-transparent text-[#26658C] hover:bg-[#A7EBF2]/24 hover:text-[#007CBE]",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;