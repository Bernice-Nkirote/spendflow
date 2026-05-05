import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isValidPhoneNumber } from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import axiosInstance from "../../api/axiosInstance";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import PhoneInputField from "../../components/ui/PhoneInputField";
import PasswordInput from "../../components/ui/PasswordInput";

function CompanySignupPage() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>(undefined);

  const [companyNameError, setCompanyNameError] = useState("");
  const [adminNameError, setAdminNameError] = useState("");
  const [adminEmailError, setAdminEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;

    setCompanyNameError("");
    setAdminNameError("");
    setAdminEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setPhoneNumberError("");
    setFormError(null);

    if (!companyName.trim()) {
      setCompanyNameError("Company name is required.");
      isValid = false;
    }

    if (!adminName.trim()) {
      setAdminNameError("Admin name is required.");
      isValid = false;
    }

    if (!adminEmail.trim()) {
      setAdminEmailError("Admin email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setAdminEmailError("Enter a valid email address.");
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

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPhoneNumberError("Enter a valid phone number.");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await axiosInstance.post("/company-signup/", {
        company_name: companyName.trim(),
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        password,
        ...(phoneNumber && {
          phone_number: phoneNumber,
        }),
      });

      navigate("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 409) {
          if (typeof detail === "string") {
            if (detail.toLowerCase().includes("company")) {
              setFormError(
                "This company already exists. Please use a different name.",
              );
              return;
            }

            if (
              detail.toLowerCase().includes("email") ||
              detail.toLowerCase().includes("user")
            ) {
              setFormError(
                "This email is already registered. Try logging in instead",
              );
              return;
            }
          }
          setFormError("Company or admin already exists");
          return;
        }

        if (typeof detail === "string") {
          setFormError(detail);
          return;
        }

        setFormError("Company signup failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-white px-4 py-8">
      <Card className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary-blue">SpendFlow</h1>
          <p className="mt-2 text-sm text-primary-gray">
            Register your company and create the first admin account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
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
            label="Admin Full Name"
            name="adminName"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Enter admin full name"
            error={adminNameError}
          />

          <Input
            label="Admin Email"
            name="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@company.com"
            error={adminEmailError}
          />

          <PhoneInputField
            label="Phone Number"
            value={phoneNumber}
            onChange={setPhoneNumber}
            error={phoneNumberError}
          />

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={passwordError}
          />

          <p className="text-xs text-primary-gray">
            Password must be at least 8 characters and include uppercase,
            lowercase, number, and special character.
          </p>

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            error={confirmPasswordError}
          />

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-accent-error">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating company..." : "Create Company"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-primary-gray">
          Already registered?{" "}
          <Link to="/login" className="text-primary-blue hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default CompanySignupPage;
