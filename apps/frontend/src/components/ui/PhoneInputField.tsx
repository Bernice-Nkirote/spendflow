import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { Value } from "react-phone-number-input";

type PhoneInputFieldProps = {
  label?: string;
  value?: Value;
  onChange: (value?: Value) => void;
  error?: string;
};

function PhoneInputField({
  label,
  value,
  onChange,
  error,
}: PhoneInputFieldProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-primary-black">
          {label}
        </label>
      )}

      <PhoneInput
        international
        defaultCountry="KE"
        value={value}
        onChange={onChange}
        placeholder="Optional: enter phone number"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/20"
      />

      {error && <p className="text-sm text-accent-error">{error}</p>}
    </div>
  );
}

export default PhoneInputField;
