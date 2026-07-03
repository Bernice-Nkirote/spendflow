import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import { forgotPassword } from "../api/authApi";

function ForgotPasswordPage() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");

  const [companyNameError, setCompanyNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm() {
    let isValid = true;

    setCompanyNameError("");
    setEmailError("");
    setFormError("");
    setSuccessMessage("");

    if (!companyName.trim()) {
      setCompanyNameError("Company name is required.");
      isValid = false;
    }

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

    try {
      setLoading(true);

      const response = await forgotPassword({
        company_name: companyName.trim(),
        email: email.trim().toLowerCase(),
      });

      setSuccessMessage(
        response?.message ??
          "If an account exists for these details, a password reset link has been sent.",
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.detail ??
            "Password reset request failed. Please try again.",
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
            Enter your company and email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Company Name"
            name="companyName"
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Enter company name"
            error={companyNameError}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            error={emailError}
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary-blue hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
