import axios from "axios";
import axiosInstance from "../../../api/axiosInstance";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import PasswordInput from "../../../components/ui/PasswordInput";
import { updateLastActivity } from "../utils/authSession";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signupState = location.state as
    | {
        signupSuccess?: boolean;
        companyName?: string;
        adminEmail?: string;
      }
    | null;

  const [companyName, setCompanyName] = useState(signupState?.companyName ?? "");
  const [email, setEmail] = useState(signupState?.adminEmail ?? "");
  const [password, setPassword] = useState("");

  const [companyNameError, setCompanyNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(
    Boolean(signupState?.signupSuccess),
  );

  useEffect(() => {
    if (!showSignupSuccess) return;

    const timeoutId = window.setTimeout(() => {
      setShowSignupSuccess(false);
    }, 15000);

    return () => window.clearTimeout(timeoutId);
  }, [showSignupSuccess]);

  function hideSignupSuccessOnInput() {
    if (showSignupSuccess) {
      setShowSignupSuccess(false);
    }
  }

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
      const response = await login({
        company_name: companyName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const accessToken = response.access_token;
      const refreshToken = response.refresh_token;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      updateLastActivity();

      const userResponse = await axiosInstance.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(userResponse.data));

      const returnTo = sessionStorage.getItem("returnToAfterLogin");

      sessionStorage.removeItem("returnToAfterLogin");

      navigate(returnTo || "/");
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

        if (status === 401) {
          setFormError(
            "We could not match that company, email, and password. Please check your details.",
          );
          return;
        }

        if (
          status === 403 &&
          typeof detail === "string" &&
          detail === "Company is inactive."
        ) {
          setFormError(
            "Company is inactive. Please contact your administrator.",
          );
          return;
        }

        if (
          status === 403 &&
          typeof detail === "string" &&
          detail === "User account is inactive."
        ) {
          setFormError(
            "User account is inactive. Please contact your administrator.",
          );
          return;
        }

        if (
          typeof detail === "string" &&
          detail.toLowerCase().includes("company")
        ) {
          setFormError(
            "Company not found. Please register your company before signing in.",
          );
          return;
        }

        if (typeof detail === "string") {
          setFormError(detail);
          return;
        }

        setFormError("Login failed. Please try again.");
        return;
      }

      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            Sign in to manage procurement workflows
          </p>
        </div>

        {showSignupSuccess && (
          <div className="mb-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-900 shadow-sm backdrop-blur">
            <p className="font-semibold text-emerald-700">
              Company account created successfully.
            </p>
            <p className="mt-1">
              We sent a confirmation email to{" "}
              <span className="font-semibold">
                {signupState?.adminEmail ?? "your admin email"}
              </span>
              . You can sign in below using the company name, admin email, and
              password you just created.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            label="Company Name"
            name="companyName"
            type="text"
            value={companyName}
            onChange={(e) => {
              hideSignupSuccessOnInput();
              setCompanyName(e.target.value);
            }}
            placeholder="Enter company name"
            error={companyNameError}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              hideSignupSuccessOnInput();
              setEmail(e.target.value);
            }}
            placeholder="you@company.com"
            error={emailError}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => {
              hideSignupSuccessOnInput();
              setPassword(e.target.value);
            }}
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
          <div className="mt-4 space-y-2 text-center text-sm text-primary-gray">
            <p>
              <Link
                to="/forgot-password"
                className="text-primary-blue hover:underline"
              >
                Forgot your password?
              </Link>
            </p>

            <p>
              Don’t have a company account?{" "}
              <Link
                to="/company-signup"
                className="text-primary-blue hover:underline"
              >
                Register your company
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
