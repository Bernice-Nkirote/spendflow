import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";

import { supplierForgotPassword } from "../api/supplierAuthApi";

function SupplierForgotPasswordPage() {
  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [email, setEmail] = useState("");

  const [emailError, setEmailError] = useState("");

  const [loading, setLoading] = useState(false);

  function validateForm() {
    let isValid = true;

    setEmailError("");
    clearAlert();

    if (!email.trim()) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await supplierForgotPassword({
        email: email.trim().toLowerCase(),
      });

      showAlert(
        "success",
        response?.message ??
          "If a supplier account exists for this email, a password reset link has been sent.",
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          showAlert("error", detail);
          return;
        }
      }

      showAlert("error", "Failed to request password reset. Please try again.");
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
          <h1 className="text-3xl font-bold text-primary-blue">SpendFlow</h1>

          <p className="mt-2 text-sm text-primary-gray">
            Enter your supplier portal email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="supplier@company.com"
            error={emailError}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            Remembered your password?{" "}
            <Link
              to="/supplier-login"
              className="font-medium text-primary-blue hover:underline"
            >
              Back to supplier login
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default SupplierForgotPasswordPage;
