import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import PasswordInput from "../../../components/ui/PasswordInput";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";

import { setSupplierPassword } from "../api/supplierAuthApi";

function SupplierSetupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setPasswordError("");
    setConfirmPasswordError("");
    clearAlert();

    if (!token) {
      showAlert(
        "error",
        "Setup token is missing. Please use the link sent to you.",
      );

      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    } else if (new TextEncoder().encode(password).length > 72) {
      setPasswordError("Password cannot be longer than 72 bytes.");
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await setSupplierPassword({
        token,
        password: password.trim(),
      });

      showAlert(
        "success",
        "Password set successfully. Redirecting to sign in...",
      );

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/supplier-login");
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          showAlert("error", detail);
          return;
        }
      }

      showAlert(
        "error",
        "Failed to set password. Please request a new setup link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-white px-4 py-8">
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary-blue">Tendaflow</h1>

          <p className="mt-2 text-sm text-primary-gray">
            Set your supplier portal password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInput
            label="New Password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create your password"
            error={passwordError}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm your password"
            error={confirmPasswordError}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting Password..." : "Set Password"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            Already set your password?{" "}
            <Link
              to="/supplier-login"
              className="font-medium text-primary-blue hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default SupplierSetupPasswordPage;
