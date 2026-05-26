import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import PasswordInput from "../../../components/ui/PasswordInput";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";

import { supplierResetPassword } from "../api/supplierAuthApi";

function SupplierResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  function validateForm() {
    let isValid = true;

    setPasswordError("");
    setConfirmPasswordError("");
    clearAlert();

    if (!token) {
      showAlert(
        "error",
        "Reset token is missing. Please request a new reset link.",
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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await supplierResetPassword({
        token,
        password,
      });

      showAlert(
        "success",
        response?.message ?? "Supplier password reset completed successfully.",
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
        "Failed to reset password. Please request a new reset link.",
      );
    } finally {
      setLoading(false);
    }
  }

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
            Create a new supplier portal password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInput
            label="New Password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            error={passwordError}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            error={confirmPasswordError}
          />

          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            Need a new link?{" "}
            <Link
              to="/supplier-forgot-password"
              className="font-medium text-primary-blue hover:underline"
            >
              Request reset link
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default SupplierResetPasswordPage;
