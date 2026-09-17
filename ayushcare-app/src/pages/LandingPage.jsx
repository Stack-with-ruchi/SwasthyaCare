import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import logoImage from "../assets/ChatGPT Image Sep 10, 2026, 02_05_40 PM.png";

// Custom icons
import doctorIcon from "../assets/doctorIcon.png.jpeg";
import patientIcon from "../assets/patientIcon.png.jpeg";

// Platform screenshots
import patientDashboard from "../assets/PatientDashboard.png";
import DoctorDashboard from "../assets/DoctorDashboard.png";
import AIChatbot from "../assets/AIChatbot.png";

export default function LandingPage() {
  const navigate = useNavigate();

  const [showIntro, setShowIntro] = useState(true);
  const [shrinkLogo, setShrinkLogo] = useState(false);

  // Active platform picture
  const [activeSlide, setActiveSlide] = useState(0);

  const platformSectionRef = useRef(null);

  // ==========================================
  // INTRO LOGO ANIMATION
  // ==========================================
  useEffect(() => {
    const shrinkTimer = setTimeout(() => {
      setShrinkLogo(true);
    }, 1100);

    const revealTimer = setTimeout(() => {
      setShowIntro(false);
    }, 2100);

    return () => {
      clearTimeout(shrinkTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  // ==========================================
  // PLATFORM CAROUSEL AUTO ANIMATION
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // PLATFORM SLIDES
  // ==========================================
  const platformSlides = [
    {
      image: patientDashboard,
      title: "Healthcare Platform",
      description:
        "Explore the SwasthyaCare healthcare experience.",
    },
    {
      image: DoctorDashboard,
      title: "Digital Healthcare",
      description:
        "Simple and connected healthcare services for patients and doctors.",
    },
    {
      image: AIChatbot,
      title: "Smart Care",
      description:
        "Modern tools designed to make healthcare access easier.",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_40%,_#ecfdf5_100%)] text-slate-800 pt-20 overflow-y-auto">

      {/* ==========================================
          INTRO SCREEN
      ========================================== */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_center,_#e0f2fe,_#f8fafc_50%,_#ecfdf5_100%)]">

          <div
            className={`logo-intro ${
              shrinkLogo ? "logo-shrink" : ""
            }`}
          >
            <img
              src={logoImage}
              alt="AyushCare logo"
              className="h-40 md:h-56 w-auto object-contain drop-shadow-[0_18px_40px_rgba(16,185,129,0.25)]"
            />
          </div>

        </div>
      )}

      {/* NAVBAR */}
      {!showIntro && <Navbar />}

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <main
        className={`max-w-6xl mx-auto px-6 py-16 text-center pb-20 transition-all duration-700 ${
          !showIntro ? "page-reveal" : "opacity-0"
        }`}
      >

        {/* ==========================================
            LOGO
        ========================================== */}
        <div className="flex justify-center mb-8">

          <img
            src={logoImage}
            alt="AyushCare Logo"
            className="h-28 md:h-36 w-auto object-contain drop-shadow-[0_10px_25px_rgba(16,185,129,0.2)] hover:scale-105 transition-transform duration-300"
          />

        </div>

        {/* BADGE */}
        <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full mb-8">
          Smart Swasthya Consultation & Records
        </span>

        {/* HEADING */}
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-8">

          Welcome to{" "}

          <span className="font-black text-slate-800">
            स्वास्थ्य
          </span>

          <span className="font-black text-emerald-500">
            Care
          </span>

        </h1>

        {/* DESCRIPTION */}
        <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 mb-16">
          Unified digital healthcare solution for Swasthya medical practitioners and patients.
        </p>

        {/* ==========================================
            DOCTOR + PATIENT CARDS
        ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">

          {/* ================= DOCTOR CARD ================= */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-xl text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

            <div className="flex items-center gap-4 mb-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-md ring-2 ring-emerald-200/50 bg-slate-900">

                <img
                  src={doctorIcon}
                  alt="Doctor Icon"
                  className="h-full w-full object-cover"
                />

              </div>

              <h2 className="text-2xl font-bold text-slate-800">
                Doctor
              </h2>

            </div>

            <p className="text-sm text-slate-600 mb-6">
              For registered medical practitioners.
            </p>

            <div className="space-y-3">

              <button
                onClick={() => navigate("/doctor/login")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-emerald-600/20"
              >
                Dr. Login
              </button>

              <button
                onClick={() => navigate("/doctor/signup")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl transition"
              >
                New Doctor Sign Up
              </button>

            </div>

          </div>

          {/* ================= PATIENT CARD ================= */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-xl text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

            <div className="flex items-center gap-4 mb-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-md ring-2 ring-sky-200/50 bg-slate-900">

                <img
                  src={patientIcon}
                  alt="Patient Icon"
                  className="h-full w-full object-cover"
                />

              </div>

              <h2 className="text-2xl font-bold text-slate-800">
                Patient
              </h2>

            </div>

            <p className="text-sm text-slate-600 mb-6">
              Access health records with ABHA ID.
            </p>

            <div className="space-y-3">

              <button
                onClick={() => navigate("/patient/login")}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-slate-900/20"
              >
                Login with ABHA
              </button>

              <button
                onClick={() => navigate("/patient/signup")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl transition"
              >
                New Patient Sign Up
              </button>

            </div>

          </div>

        </div>

        {/* ==========================================
            EXPLORE PLATFORM
        ========================================== */}
        <div
          ref={platformSectionRef}
          className="mt-24"
        >

          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5">
            Explore Our Platform
          </h2>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600 mb-14">
            Take a look at our healthcare platform.
          </p>

          {/* ==========================================
              ANIMATED 3-PICTURE CAROUSEL
          ========================================== */}
          <div className="relative w-full max-w-6xl mx-auto">

            {/* Larger Carousel Window */}
            <div className="relative h-[520px] md:h-[650px] overflow-hidden">

              {platformSlides.map((slide, index) => {

                // Calculate position relative to active slide
                let position = index - activeSlide;

                // Handle circular movement
                if (position > 1) {
                  position -= 3;
                }

                if (position < -1) {
                  position += 3;
                }

                return (
                  <div
                    key={index}
                    className="absolute top-1/2 left-1/2 w-[340px] md:w-[760px] transition-all duration-700 ease-in-out"
                    style={{
                      transform: `
                        translate(-50%, -50%)
                        translateX(
                          ${
                            position === 0
                              ? "0px"
                              : position === 1
                              ? "430px"
                              : "-430px"
                          }
                        )
                        scale(
                          ${position === 0 ? 1 : 0.72}
                        )
                      `,
                      opacity: position === 0 ? 1 : 0.45,
                      zIndex: position === 0 ? 20 : 10,
                    }}
                  >

                    {/* Card */}
                    <div
                      className={`bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-4 shadow-2xl ${
                        position === 0
                          ? "shadow-emerald-200/40"
                          : ""
                      }`}
                    >

                      {/* Image */}
                      <div className="rounded-2xl overflow-hidden bg-slate-100">

                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-auto object-contain"
                        />

                      </div>

                      {/* Text */}
                      <div className="px-2 pt-4 pb-2 text-left">

                        <h3 className="text-xl font-bold text-slate-800">
                          {slide.title}
                        </h3>

                        <p className="text-sm text-slate-600 mt-1">
                          {slide.description}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* ==========================================
                CAROUSEL DOTS
            ========================================== */}
            <div className="flex justify-center items-center gap-3 mt-4">

              {platformSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show platform slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    activeSlide === index
                      ? "w-9 bg-emerald-500"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}

            </div>

          </div>

        </div>

        {/* ==========================================
            FEATURE HIGHLIGHTS
        ========================================== */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">

          {/* FEATURE 1 */}
          <div
            className="highlight-card rounded-2xl border border-emerald-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "100ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              01
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              About us
            </h3>

            <p className="text-sm text-slate-600">
              Short description of the platform, mission and vision.
            </p>

          </div>

          {/* FEATURE 2 */}
          <div
            className="highlight-card rounded-2xl border border-emerald-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "200ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              02
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Digital records
            </h3>

            <p className="text-sm text-slate-600">
              Store patient information and visit history in one place.
            </p>

          </div>

          {/* FEATURE 3 */}
          <div
            className="highlight-card rounded-2xl border border-sky-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "300ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold">
              03
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Faster access
            </h3>

            <p className="text-sm text-slate-600">
              Patients and doctors can securely reach the right data quickly.
            </p>

          </div>

          {/* FEATURE 4 */}
          <div
            className="highlight-card rounded-2xl border border-violet-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "400ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold">
              04
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Better care
            </h3>

            <p className="text-sm text-slate-600">
              Support modern Swasthya consultation workflows with confidence.
            </p>

          </div>

          {/* FEATURE 5 */}
          <div
            className="highlight-card rounded-2xl border border-sky-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "500ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold">
              05
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Language options
            </h3>

            <p className="text-sm text-slate-600">
              Choose from multiple languages for a more inclusive experience.
            </p>

          </div>

          {/* FEATURE 6 */}
          <div
            className="highlight-card rounded-2xl border border-violet-200 bg-white/60 p-5 shadow-sm"
            style={{ animationDelay: "600ms" }}
          >

            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold">
              06
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Terms and conditions
            </h3>

            <p className="text-sm text-slate-600">
              Usage rules and disclaimer.
            </p>

          </div>

        </div>

      </main>

      {/* ==========================================
          EXPANDED FOOTER
      ========================================== */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">

        {/* ==========================================
            FOOTER MAIN CONTENT
        ========================================== */}
        <div className="max-w-6xl mx-auto px-6 py-14">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

            {/* ==========================================
                BRAND SECTION
            ========================================== */}
            <div className="lg:col-span-1">

              <div className="flex items-center gap-3 mb-5">

                <img
                  src={logoImage}
                  alt="SwasthyaCare Logo"
                  className="h-14 w-auto object-contain"
                />

              </div>

              <p className="text-sm leading-6 text-slate-600 mb-5">
                A connected digital healthcare platform designed to bring
                patients and medical practitioners together through smarter
                consultation and health record management.
              </p>

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer">
                  f
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold hover:bg-sky-600 hover:text-white transition cursor-pointer">
                  in
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold hover:bg-violet-600 hover:text-white transition cursor-pointer">
                  ◎
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-800 hover:text-white transition cursor-pointer">
                  X
                </div>

              </div>

            </div>

            {/* ==========================================
                QUICK LINKS
            ========================================== */}
            <div>

              <h3 className="text-base font-bold text-slate-900 mb-5">
                Quick Links
              </h3>

              <ul className="space-y-3 text-sm text-slate-600">

                <li>
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      })
                    }
                    className="hover:text-emerald-600 transition"
                  >
                    Home
                  </button>
                </li>

                <li>
                  <button
                    onClick={() =>
                      platformSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                    }
                    className="hover:text-emerald-600 transition"
                  >
                    Explore Platform
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigate("/patient/login")}
                    className="hover:text-emerald-600 transition"
                  >
                    Patient Portal
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigate("/doctor/login")}
                    className="hover:text-emerald-600 transition"
                  >
                    Doctor Portal
                  </button>
                </li>

                <li>
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      })
                    }
                    className="hover:text-emerald-600 transition"
                  >
                    About Us
                  </button>
                </li>

              </ul>

            </div>

            {/* ==========================================
                SERVICES
            ========================================== */}
            <div>

              <h3 className="text-base font-bold text-slate-900 mb-5">
                Our Services
              </h3>

              <ul className="space-y-3 text-sm text-slate-600">

                <li className="hover:text-emerald-600 transition cursor-default">
                  Digital Health Records
                </li>

                <li className="hover:text-emerald-600 transition cursor-default">
                  Patient Consultation
                </li>

                <li className="hover:text-emerald-600 transition cursor-default">
                  Doctor Dashboard
                </li>

                <li className="hover:text-emerald-600 transition cursor-default">
                  AI Health Assistant
                </li>

                <li className="hover:text-emerald-600 transition cursor-default">
                  ABHA Integration
                </li>

                <li className="hover:text-emerald-600 transition cursor-default">
                  Multilingual Support
                </li>

              </ul>

            </div>

            {/* ==========================================
                SUPPORT
            ========================================== */}
            <div>

              <h3 className="text-base font-bold text-slate-900 mb-5">
                Support & Information
              </h3>

              <ul className="space-y-3 text-sm text-slate-600">

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Help Center
                </li>

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Contact Support
                </li>

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Privacy Policy
                </li>

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Terms & Conditions
                </li>

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Data & Consent
                </li>

                <li className="hover:text-emerald-600 transition cursor-pointer">
                  Healthcare Disclaimer
                </li>

              </ul>

            </div>

          </div>

          

          {/* ==========================================
              DISCLAIMER
          ========================================== */}
          <div className="mt-10 rounded-2xl bg-slate-50/80 border border-slate-200 p-5">

            <h4 className="text-sm font-bold text-slate-800 mb-2">
              Healthcare Disclaimer
            </h4>

            <p className="text-xs leading-5 text-slate-500">
              SwasthyaCare is a digital healthcare support platform. Information
              and AI-assisted features provided through the platform are intended
              to support healthcare workflows and should not replace professional
              medical evaluation, diagnosis, or emergency medical care.
            </p>

          </div>

        </div>

        {/* ==========================================
            FOOTER BOTTOM BAR
        ========================================== */}
        <div className="border-t border-slate-200 bg-slate-50/80">

          <div className="max-w-6xl mx-auto px-6 py-5">

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">

              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} SwasthyaCare. All rights reserved.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">

                <span className="hover:text-emerald-600 transition cursor-pointer">
                  Privacy
                </span>

                <span className="text-slate-300">
                  |
                </span>

                <span className="hover:text-emerald-600 transition cursor-pointer">
                  Terms
                </span>

                <span className="text-slate-300">
                  |
                </span>

                <span className="hover:text-emerald-600 transition cursor-pointer">
                  Support
                </span>

                <span className="text-slate-300">
                  |
                </span>

                <span className="hover:text-emerald-600 transition cursor-pointer">
                  Accessibility
                </span>

              </div>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}
