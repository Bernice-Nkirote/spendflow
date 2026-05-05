import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-black"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 ${className}`}
        {...props}
      />

      {error && <p className="text-sm text-accent-error">{error}</p>}
    </div>
  );
}

export default Input;
