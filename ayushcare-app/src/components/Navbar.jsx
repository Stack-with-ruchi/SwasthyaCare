import React, { useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // All visible Navbar text
  const texts = useMemo(
    () => ({
      homeTitle: "AyushCare | Home",
      patientLoginTitle: "AyushCare | Patient Login",
      patientRegistrationTitle: "AyushCare | Patient Registration",
      doctorPortalTitle: "AyushCare | Doctor Portal",
      ayushHome: "Home",
      patientLogin: "Patient Login",
      doctorLogin: "Dr. Login",
    }),
    []
  );

  // Get translated text according to selected language
  const { t } = useTranslation(texts);

  // Update document title whenever the current URL path changes
  useEffect(() => {
    switch (location.pathname) {
      case "/":
        document.title = t.homeTitle;
        break;

      case "/":
        document.title = t.ayushHomeTitle;
        break;

      case "/patient/login":
        document.title = t.patientLoginTitle;
        break;

      case "/patient/signup":
        document.title = t.patientRegistrationTitle;
        break;

      case "/doctor/signup":
        document.title = t.doctorPortalTitle;
        break;

      default:
        document.title = "AyushCare";
    }
  }, [location.pathname, t]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
      
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 transition duration-200">
          S
        </div>

        <span className="text-xl font-black text-slate-800 tracking-tight">
          स्वास्थ्य
          <span className="text-emerald-500 group-hover:text-emerald-600 transition duration-200">
            Care
          </span>
        </span>
      </Link>

      {/* Nav Actions */}
      <div className="flex items-center gap-4">

        {/* Home button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 group px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition duration-200">
            H
          </div>

          <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition duration-200">
            {t.ayushHome}
          </span>
        </button>
        
        {/* Patient Login Button */}
        <button
          onClick={() => navigate("/patient/login")}
          className="flex items-center gap-2 group px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition duration-200">
            P
          </div>

          <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition duration-200">
            {t.patientLogin}
          </span>
        </button>

        {/* Doctor Login Button */}
        <button
          onClick={() => navigate("/doctor/login")}
          className="flex items-center gap-2 group px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm transition duration-200">
            D
          </div>

          <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition duration-200">
            {t.doctorLogin}
          </span>
        </button>
      </div>
    </nav>
  );
}