import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  //   children represents the content inside a button
  variant?: ButtonVariant;
};

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-blue text-white hover:bg-[#1f3d5f]",
    secondary:
      "border border-gray-300 bg-white text-primary-black hover:bg-gray-50",
    danger: "bg-accent-error text-white hover:bg-[#990502]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}

      //   ...props so you can use normal button attributes e.g onclick
    >
      {children}
    </button>
  );
}

export default Button;
