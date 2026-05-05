import { useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

function PasswordInput({
  label,
  error,
  className = "",
  id,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
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

      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-3 text-sm font-medium text-primary-blue"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {error && <p className="text-sm text-accent-error">{error}</p>}
    </div>
  );
}

export default PasswordInput;
