import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PasswordInput from "../../../components/ui/PasswordInput";
import { setupPassword } from "../api/authApi";

function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError(
        "Setup token is missing. Please use the link sent to your email.",
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      await setupPassword({
        token,
        password,
      });

      setSuccessMessage(
        "Password setup completed successfully. Redirecting to login...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Failed to set password. The link may be invalid or expired.",
      );
    } finally {
      setIsSubmitting(false);
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
            Create your password to activate your account and sign in.
          </p>
        </div>

        {!token && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-700 backdrop-blur">
            Setup token is missing. Please open the setup link from your email.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-700 backdrop-blur">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50/80 p-3 text-sm text-green-700 backdrop-blur">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInput
            label="New Password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            disabled={isSubmitting || !token}
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            disabled={isSubmitting || !token}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
            {isSubmitting ? "Setting password..." : "Set password"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-primary-gray">
          Already set your password?{" "}
          <Link to="/login" className="font-medium text-primary-blue hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default SetupPasswordPage;