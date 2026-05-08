type SupplierStatusBadgeProps = {
  isActive: boolean;
};

function SupplierStatusBadge({ isActive }: SupplierStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive
          ? "border-green-200 bg-green-100 text-green-800"
          : "border-gray-200 bg-gray-100 text-gray-700"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default SupplierStatusBadge;
