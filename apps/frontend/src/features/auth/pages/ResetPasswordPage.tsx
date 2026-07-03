import axios from "axios";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PasswordInput from "../../../components/ui/PasswordInput";
import { resetPassword } from "../api/authApi";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm() {
    let isValid = true;

    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");
    setSuccessMessage("");

    if (!token) {
      setFormError("Reset token is missing. Please request a new reset link.");
      return false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
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

    try {
      setLoading(true);

      const response = await resetPassword({
        token,
        password,
      });

      setSuccessMessage(
        response?.message ?? "Password reset completed successfully.",
      );

      window.setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.detail ??
            "Password reset failed. Please request a new link.",
        );
        return;
      }

      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-aqua-glass-bg flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="auth-card-glass relative w-full max-w-md overflow-hidden">
        <div className="mb-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <img
              src="/tendaflow-auth-logo.svg"
              alt="Tendaflow logo"
              className="h-14 w-auto"
            />
            <h1 className="bg-gradient-to-r from-[#011C40] via-[#26658C] to-[#54ACBF] bg-clip-text text-3xl font-bold text-transparent">Tendaflow</h1>
          </div>
          <p className="mt-2 text-sm text-primary-gray">
            Create a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!token && (
            <p className="rounded-lg bg-yellow-50 px-3 py-2 text-center text-sm text-yellow-700">
              Reset token is missing. Please request a new password reset link.
            </p>
          )}

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

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-accent-error">
              {formError}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            Need a new link?{" "}
            <Link
              to="/forgot-password"
              className="text-primary-blue hover:underline"
            >
              Request reset link
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
