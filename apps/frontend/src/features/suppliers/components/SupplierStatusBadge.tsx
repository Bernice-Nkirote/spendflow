import StatusBadge from "../../../components/ui/StatusBadge";

type SupplierStatusBadgeProps = {
  isActive: boolean;
};

function SupplierStatusBadge({ isActive }: SupplierStatusBadgeProps) {
  return (
    <StatusBadge variant={isActive ? "success" : "neutral"}>
      {isActive ? "Active" : "Inactive"}
    </StatusBadge>
  );
}

export default SupplierStatusBadge;
