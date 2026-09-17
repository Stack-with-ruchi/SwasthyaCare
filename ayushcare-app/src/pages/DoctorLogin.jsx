import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../utils/api";

export default function DoctorLogin() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Medical Registration Number, Mobile Number or Email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setIsLoading(true);

      const data = await apiRequest("/auth/doctor/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (!data?.success) {
        throw new Error(data?.message || "Invalid login credentials.");
      }

      const doctor = data.doctor || {};

      // Save doctor session
      const doctorSession = {
        id:
          doctor.mobile ||
          doctor.email ||
          doctor.regNumber ||
          identifier.trim(),

        doctorId: doctor._id || doctor.id || null,

        role: "doctor",

        fullName: doctor.fullName || "",

        email: doctor.email || "",

        mobile: doctor.mobile || "",

        regNumber: doctor.regNumber || "",

        loginTime: new Date().toISOString(),
      };

      localStorage.setItem(
        "ayush_doctor_session",
        JSON.stringify(doctorSession)
      );

      navigate("/doctor/dashboard");

    } catch (error) {
      console.error("Doctor login error:", error);

      setError(
        error.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#ecfdf5_100%)] text-slate-800 pt-20 pb-12">

      <Navbar />

      <main className="flex items-center justify-center px-4 py-8">

        <div className="w-full max-w-md">

          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.12)] p-6 md:p-8">

            {/* BACK BUTTON */}

            <div className="mb-5">

              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                ← Back
              </button>

            </div>

            {/* HEADER */}

            <div className="text-center mb-7">

              <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                AyushCare Doctor Portal
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-black text-slate-800">
                Doctor Login
              </h1>

              <p className="text-sm text-slate-500 mt-2">
                Login using your registered details and password.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* LOGIN FORM */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* IDENTIFIER */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Medical Registration No. / Mobile / Email
                </label>

                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter registration no., mobile or email"
                  className="border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 p-3 w-full rounded-xl outline-none"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 p-3 pr-12 w-full rounded-xl outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-emerald-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* INFO */}

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700">
                Use the password you created during doctor registration.
              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
              >
                {isLoading ? "Logging in..." : "Login →"}
              </button>

            </form>

            {/* SIGNUP */}

            <div className="text-center pt-5 mt-5 border-t border-slate-100 text-sm text-slate-500">

              Don't have a doctor account?

              <button
                type="button"
                onClick={() => navigate("/doctor/signup")}
                className="ml-1 text-emerald-600 font-bold hover:underline"
              >
                Register Here
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}