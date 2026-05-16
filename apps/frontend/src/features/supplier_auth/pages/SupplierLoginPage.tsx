import axios from "axios";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import supplierAxiosInstance from "../../../api/supplierAxiosInstance";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import PasswordInput from "../../../components/ui/PasswordInput";

function SupplierLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setEmailError("");
    setPasswordError("");
    setFormError(null);

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

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await supplierAxiosInstance.post(
        "/supplier-auth/login",
        {
          email: email.trim(),
          password,
        },
      );

      localStorage.setItem("supplier_access_token", response.data.access_token);

      navigate("/supplier-portal/purchase-orders");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          setFormError(detail);
          return;
        }
      }

      setFormError(
        "Supplier login failed. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-white px-4">
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="supplier@company.com"
            error={emailError}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={passwordError}
          />

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-accent-error">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default SupplierLoginPage;
