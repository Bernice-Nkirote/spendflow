import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import {
  getBackNavigation,
  type NavigationState,
} from "../../utils/navigationContext";

type BackButtonProps = {
  label?: string;
  to?: string;
  fallbackLabel?: string;
  fallbackTo?: string;
};

function BackButton({
  label,
  to,
  fallbackLabel = "Back to Previous Page",
  fallbackTo,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = getBackNavigation(
    location.state as NavigationState | null,
  );

  const finalLabel = label ?? navigation.label ?? fallbackLabel;
  const finalTo = to ?? navigation.to ?? fallbackTo;

  function handleClick() {
    if (finalTo) {
      navigate(finalTo);
      return;
    }

    navigate(-1);
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick}>
      ← {finalLabel}
    </Button>
  );
}

export default BackButton;
