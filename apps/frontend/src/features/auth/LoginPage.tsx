import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";

function LoginPage() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [companyNameError, setCompanyNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;

    setCompanyNameError("");
    setEmailError("");
    setPasswordError("");
    setFormError(null);

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

    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must include at least one uppercase letter.");
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      setPasswordError("Password must include at least one lowercase letter.");
      isValid = false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError("Password must include at least one number.");
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError("Password must include at least one special character.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        company_name: companyName.trim(),
        email: email.trim(),
        password,
      });

      const token = response.data.access_token;

      localStorage.setItem("access_token", token);

      const userResponse = await axiosInstance.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(userResponse.data));

      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;
        if (status === 404) {
          setFormError(
            "Company not found. Please register your company before signing in.",
          );
          return;
        }

        if (status === 405) {
          setFormError(
            "Login request was rejected. Please confirm the backend login route and method.",
          );
          return;
        }

        if (typeof detail === "string") {
          if (detail.toLowerCase().includes("company")) {
            setFormError(
              "Company not found. Please register your company before signing in.",
            );
            return;
          }

          setFormError(detail);
          return;
        }

        setFormError(
          "Login failed. Please register your company first, then sign in with your admin account.",
        );
        return;
      }

      setFormError("Something went wrong. Please try again.");
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
            Sign in to manage procurement workflows
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            label="Company Name"
            name="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
            error={companyNameError}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
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
          <p className="mt-4 text-center text-sm text-primary-gray">
            Don’t have a company account?{" "}
            <Link
              to="/company-signup"
              className="text-primary-blue hover:underline"
            >
              Register your company
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
