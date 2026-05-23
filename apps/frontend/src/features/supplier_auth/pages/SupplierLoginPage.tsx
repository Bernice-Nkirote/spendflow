import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import PasswordInput from "../../../components/ui/PasswordInput";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getCurrentSupplier, supplierLogin } from "../api/supplierAuthApi";

function SupplierLoginPage() {
  const navigate = useNavigate();
  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setEmailError("");
    setPasswordError("");
    clearAlert();

    if (!email.trim()) {
      setEmailError("Email address is required.");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await supplierLogin({
        email: email.trim(),
        password,
      });

      localStorage.setItem("supplier_access_token", response.access_token);
      localStorage.setItem("supplier_refresh_token", response.refresh_token);

      const supplierUser = await getCurrentSupplier();
      localStorage.setItem("supplier_user", JSON.stringify(supplierUser));

      showAlert("success", "Signed in successfully.");

      const returnTo = sessionStorage.getItem("supplierReturnToAfterLogin");

      sessionStorage.removeItem("supplierReturnToAfterLogin");

      navigate(returnTo || "/supplier-portal/purchase-orders");
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
        "Supplier login failed. Please check your email and password.",
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
          <h1 className="text-3xl font-bold text-primary-blue">SpendFlow</h1>
          <p className="mt-2 text-sm text-primary-gray">
            Supplier portal sign in
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="supplier@company.com"
            error={emailError}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            error={passwordError}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-primary-gray">
            <Link
              to="/supplier-forgot-password"
              className="font-medium text-primary-blue hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default SupplierLoginPage;
