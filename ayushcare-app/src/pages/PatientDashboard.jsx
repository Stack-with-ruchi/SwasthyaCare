import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Stethoscope,
  Calendar,
  FileText,
  User,
  Settings,
  Bell,
  Globe,
  Search,
  Upload,
  ArrowRight,
  Phone,
  Download,
  Eye,
  Check,
  ShieldCheck,
} from "lucide-react";

import { API_BASE_URL, apiRequest } from "../utils/api";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../context/LanguageContext";

// Modular Components
import AppointmentsSection from "../components/Patient/AppointmentsSection";
import CaseTaking from "../components/Patient/CaseTaking";
import ReportsSection from "../components/Patient/ReportsSection";
import AbhaRecordSection from "../components/Patient/AbhaAndMedicinesSection";

/* =========================
   ENGLISH UI TEXT
========================= */

const ENGLISH_UI_TEXT = {
  welcome: "Welcome Back",
  prioritySubtitle: "Your health and well-being is our priority.",

  aiTitle: "Consult Doctor (AI Case Taking)",
  aiSubtitle:
    "Answer a few quick health questions to prepare your case file for your doctor.",
  getStarted: "Get Started",

  holisticTitle: "Holistic Care with Ayurveda",
  holisticSubtitle: "Personalized wellness for better living.",

  myServices: "My Services",
  myAppointments: "My Appointments",
  viewAll: "View All",
  myReports: "My Reports",
  myAbha: "My ABHA & Records",
  healthHistory: "Health History",
  profile: "Profile",
  recentActivity: "Recent Activity",

  reportsTitle: "Reports & Documents",
  uploadDoc: "Upload Document",
  searchPlaceholder: "Search documents...",

  home: "Home",
  aiNav: "Consult Doctor (AI)",
  caseTaking: "Case Taking",
  abhaNav: "ABHA & Records",
  needHelp: "Need Help?",
  aiActive: "AI Assistant Active",
  selectLanguage: "Select Language",

  appointmentDescription: "View upcoming and past appointments",
  reportsDescription: "Access lab results and medical records",
  abhaDescription: "View your ABHA-linked health records",
  historyDescription: "Review past diagnoses and vital stats",
  profileDescription: "Manage personal details and settings",

  viewQr: "View QR",
  viewDetails: "View Details",
  viewProfile: "View Profile",

  lastConsultation: "Last Consultation",
  nextAppointment: "Next Appointment",

  abhaLinked: "ABHA Support Linked",

  documentsDescription:
    "Search and upload medical documents easily",

  documentName: "Document Name",
  type: "Type",
  date: "Date",
  doctorSource: "Doctor/Source",
  actions: "Actions",

  view: "View",
  download: "Download",
  noDocuments: "No documents found.",

  patient: "Patient",
  abhaUser: "ABHA User",

  name: "Name",
  mobile: "Mobile",
  email: "Email",
  abhaId: "ABHA ID",

  notAvailable: "Not available",
  notLinked: "Not linked",

  noPreviousConsultation: "No previous consultation found.",
  noUpcomingAppointment: "No upcoming appointment.",

  uploadedDocument: "Uploaded Document",
  selfUploaded: "Self Uploaded",

  noHealthHistory: "No health history records found.",

  callSupport: "Call 1800-xxx-xxxx",

  // Support section
  ashaLinked: "ABHA Support Linked",
  ashaDescription:
    "Your assigned ABHA user is connected for healthcare assistance and regular follow-ups.",
};

/* =========================
   COMPONENT
========================= */

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  /* =========================
     LANGUAGE SYSTEM
  ========================= */

  const { language, setLanguage } = useLanguage();

  const { t } = useTranslation(ENGLISH_UI_TEXT);

  const [languages, setLanguages] = useState([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  /* =========================
     DASHBOARD DATA
  ========================= */

  const [documents, setDocuments] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  /* =========================
     FETCH LANGUAGES
  ========================= */

  useEffect(() => {
    apiRequest("/languages/list")
      .then((data) => {
        setLanguages(data.languages || []);
      })
      .catch((error) => {
        console.error("Failed to load languages:", error);

        setLanguages([
          {
            code: "en",
            name: "English",
            nativeName: "English",
          },
        ]);
      });
  }, []);

  /* =========================
     LOAD DASHBOARD
  ========================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================
     CHANGE LANGUAGE
  ========================= */

  const handleLanguageChange = async (languageCode) => {
    const selectedLanguageData =
      languages.find((lang) => lang.code === languageCode) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    setLanguage(selectedLanguageData);

    localStorage.setItem(
      "selectedLanguage",
      JSON.stringify(selectedLanguageData)
    );

    setIsLangMenuOpen(false);

    const token = localStorage.getItem("patient_token");

    if (token) {
      try {
        await apiRequest("/auth/patient/language", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            languageCode: selectedLanguageData.code,
            languageName: selectedLanguageData.name,
          }),
        });
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  };

  /* =========================
     FILE UPLOAD
  ========================= */

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    const token = localStorage.getItem("patient_token");

    if (!file) return;

    if (!token) {
      console.error("Patient is not logged in.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("document", file);
      formData.append("name", file.name);
      formData.append("type", t.uploadedDocument);
      formData.append("doctorName", t.selfUploaded);

      const data = await apiRequest("/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const document = data.document;

      const newDoc = {
        id: document._id,
        name: document.name,
        date: new Date(document.uploadDate).toLocaleDateString(),
        type: document.type,
        doctor: document.doctorName,
        fileUrl: document.fileUrl,
      };

      setDocuments((currentDocuments) => [
        newDoc,
        ...currentDocuments,
      ]);

      e.target.value = "";

      console.log("Document uploaded successfully.");
    } catch (error) {
      console.error("Document upload failed:", error);
    }
  };

  /* =========================
     FILTER DOCUMENTS
  ========================= */

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      doc.type
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  /* =========================
     GET DASHBOARD DATA
  ========================= */

  const loadDashboard = async () => {
    const token = localStorage.getItem("patient_token");

    if (!token) {
      console.error("Patient is not logged in.");

      setIsDashboardLoading(false);

      return;
    }

    try {
      setIsDashboardLoading(true);

      const data = await apiRequest("/patient/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setDashboardData(data);

        if (data.recentDocuments) {
          setDocuments(
            data.recentDocuments.map((document) => ({
              id: document.id,
              name: document.name,

              date: document.uploadDate
                ? new Date(
                    document.uploadDate
                  ).toLocaleDateString()
                : "N/A",

              type: document.type,
              doctor: document.doctorName,
              fileUrl: document.fileUrl,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden">

      {/* =========================
          LEFT SIDEBAR
      ========================= */}

      <aside className="w-64 bg-[#084832] text-emerald-100 flex flex-col justify-between p-4 flex-shrink-0">

        <div>

          {/* LOGO */}

          <div className="flex items-center gap-3 px-2 py-3 mb-6">

            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-lg">
              🌿
            </div>

            <div>

              <h1 className="text-xl font-bold text-white tracking-wide leading-tight">
                स्वास्थ्यCare
              </h1>

              <p className="text-[10px] text-emerald-300/80 font-medium tracking-wider uppercase">
                {t.prioritySubtitle}
              </p>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="space-y-1">

            {[
              {
                id: "home",
                label: t.home,
                icon: Home,
              },

              {
                id: "ai-doc",
                label: t.aiNav,
                icon: Stethoscope,
              },

              {
                id: "case-taking",
                label: t.caseTaking,
                icon: FileText,
              },

              {
                id: "appointments",
                label: t.myAppointments,
                icon: Calendar,
              },

              {
                id: "abha",
                label: t.abhaNav,
                icon: ShieldCheck,
              },

              {
                id: "reports",
                label: t.reportsTitle,
                icon: FileText,
              },

              {
                id: "profile",
                label: t.profile,
                icon: User,
              },
            ].map((item) => {

              const Icon = item.icon;

              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}

                  onClick={() =>
                    item.id === "ai-doc"
                      ? navigate("/chatbot")
                      : setActiveTab(item.id)
                  }

                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#105d43] text-white shadow-sm border-l-4 border-emerald-400"
                      : "text-emerald-100/70 hover:bg-[#0c533b] hover:text-white"
                  }`}
                >

                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-emerald-200/60"
                    }`}
                  />

                  <span className="truncate">
                    {item.label}
                  </span>

                </button>
              );
            })}

          </nav>

        </div>

        {/* HELP */}

        <div className="bg-[#0b543c] rounded-2xl p-3.5 border border-emerald-600/30">

          <div className="flex items-center gap-3 text-xs text-emerald-200">

            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Phone className="w-4 h-4" />
            </div>

            <div>

              <p className="font-semibold text-white">
                {t.needHelp}
              </p>

              <p className="text-[11px] text-emerald-200/80">
                {t.callSupport}
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

        {/* =========================
            TOP NAVBAR
        ========================= */}

        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0 relative">

          <div>

            <h2 className="text-xl font-bold text-slate-800">

              {t.welcome}

              <span className="inline-block animate-bounce">
                👋
              </span>

            </h2>

            <p className="text-xs text-slate-500 font-medium">
              {t.prioritySubtitle}
            </p>

          </div>

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Landing</span>
            </button>

            {/* LANGUAGE DROPDOWN */}

            <div className="relative">

              <button
                onClick={() =>
                  setIsLangMenuOpen(!isLangMenuOpen)
                }

                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
              >

                <Globe className="w-3.5 h-3.5 text-emerald-600" />

                <span>
                  {language?.nativeName ||
                    language?.name ||
                    "English"}
                </span>

              </button>

              {isLangMenuOpen && (

                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 max-h-64 overflow-y-auto">

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.selectLanguage}
                  </div>

                  {languages.map((lang) => (

                    <button
                      key={lang.code}

                      onClick={() =>
                        handleLanguageChange(lang.code)
                      }

                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between transition"
                    >

                      <span>
                        {lang.nativeName} ({lang.name})
                      </span>

                      {language?.code === lang.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}

                    </button>

                  ))}

                </div>

              )}

            </div>

            {/* NOTIFICATION */}

            <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative transition">

              <Bell className="w-4 h-4" />

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>

            </button>

            {/* SETTINGS */}

            <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">

              <Settings className="w-4 h-4" />

            </button>

            <div className="h-6 w-[1px] bg-slate-200"></div>

            {/* USER */}

            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setActiveTab("profile")}
            >

              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center ring-2 ring-slate-300">

                <User className="w-4 h-4" />

              </div>

              <div className="text-left hidden sm:block">

                <p className="text-xs font-bold text-slate-800 leading-tight">

                  {dashboardData?.patientProfile?.fullName ||
                    t.patient}

                </p>

                <p className="text-[10px] text-slate-500 font-medium">

                  {dashboardData?.patientProfile?.abhaId
                    ? `ABHA: ${dashboardData.patientProfile.abhaId}`
                    : t.abhaUser}

                </p>

              </div>

            </div>

          </div>

        </header>

        {/* =========================
            DASHBOARD BODY
        ========================= */}

        <main className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* CASE TAKING */}

          {activeTab === "case-taking" && (
            <CaseTaking />
          )}

          {/* APPOINTMENTS */}

          {activeTab === "appointments" && (
            <AppointmentsSection />
          )}

          {/* ABHA & MEDICINES */}

          {activeTab === "abha" && (
            <AbhaRecordSection />
          )}

          {/* REPORTS */}

          {activeTab === "reports" && (
            <ReportsSection />
          )}

          {/* AI SECTION */}

          {activeTab === "ai-doc" && (

            <section className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-sm">

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {t.aiActive}
              </span>

              <h1 className="mt-2 text-2xl font-bold text-slate-800">
                {t.aiTitle}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {t.aiSubtitle}
              </p>

              <button
                type="button"
                onClick={() => navigate("/chatbot")}
                className="mt-6 bg-[#084832] text-white px-5 py-2.5 rounded-xl text-sm font-bold"
              >
                {t.getStarted}
              </button>

            </section>

          )}

          {/* PROFILE */}

          {activeTab === "profile" && (

            <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

              <h1 className="text-2xl font-bold text-slate-800">
                {t.profile}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {t.profileDescription}
              </p>

              <div className="mt-6 grid gap-3 max-w-lg text-sm">

                <div className="flex justify-between border-b border-slate-100 pb-3">

                  <span className="text-slate-500">
                    {t.name}
                  </span>

                  <span className="font-semibold">
                    {dashboardData?.patientProfile?.fullName ||
                      t.notAvailable}
                  </span>

                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">

                  <span className="text-slate-500">
                    {t.mobile}
                  </span>

                  <span className="font-semibold">
                    {dashboardData?.patientProfile?.mobile ||
                      t.notAvailable}
                  </span>

                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">

                  <span className="text-slate-500">
                    {t.email}
                  </span>

                  <span className="font-semibold">
                    {dashboardData?.patientProfile?.email ||
                      t.notAvailable}
                  </span>

                </div>

                <div className="flex justify-between border-b border-slate-100 pb-3">

                  <span className="text-slate-500">
                    {t.abhaId}
                  </span>

                  <span className="font-semibold">
                    {dashboardData?.patientProfile?.abhaId ||
                      t.notLinked}
                  </span>

                </div>

              </div>

            </section>

          )}

          {/* =========================
              HOME
          ========================= */}

          {activeTab === "home" && (

            <>

              {/* =========================
                  CASE TAKING BANNER
              ========================= */}

              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">

                <div className="space-y-2 max-w-xl z-10">

                  <span className="inline-block text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full uppercase tracking-wider">
                    CASE REQUEST
                  </span>

                  <h3 className="text-2xl font-black text-slate-900">
                    {t.caseTaking}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Create a case request for a doctor by providing your token number, hospital/clinic and department.
                  </p>

                  <button
                    onClick={() =>
                      setActiveTab("case-taking")
                    }
                    className="mt-2 inline-flex items-center gap-2 bg-[#084832] hover:bg-[#0c533b] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
                  >

                    <span>
                      Start
                    </span>

                    <ArrowRight className="w-3.5 h-3.5" />

                  </button>

                </div>

                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm z-10">

                  <div className="text-3xl">
                    📋
                  </div>

                  <div>

                    <h4 className="text-xs font-bold text-slate-800">
                      Case Request
                    </h4>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Submit your details to request a consultation.
                    </p>

                  </div>

                </div>

              </div>

              {/* =========================
                  SERVICES
              ========================= */}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-4">

                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t.myServices}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    {/* APPOINTMENTS */}

                    <ServiceCard
                      icon={Calendar}
                      title={t.myAppointments}
                      description={t.appointmentDescription}
                      buttonText={t.viewAll}
                      onClick={() =>
                        setActiveTab("appointments")
                      }
                    />

                    {/* AI CONSULT DOCTOR */}

                    <ServiceCard
                      icon={Stethoscope}
                      title={t.aiTitle}
                      description={t.aiSubtitle}
                      buttonText={t.getStarted}
                      onClick={() =>
                        navigate("/chatbot")
                      }
                    />

                    {/* REPORTS */}

                    <ServiceCard
                      icon={FileText}
                      title={t.myReports}
                      description={t.reportsDescription}
                      buttonText={t.viewAll}
                      onClick={() =>
                        setActiveTab("reports")
                      }
                    />

                    {/* ABHA */}

                    <ServiceCard
                      icon={ShieldCheck}
                      title={t.myAbha}
                      description={t.abhaDescription}
                      buttonText={t.viewDetails}
                      onClick={() =>
                        setActiveTab("abha")
                      }
                    />

                    {/* PROFILE */}

                    <ServiceCard
                      icon={User}
                      title={t.profile}
                      description={t.profileDescription}
                      buttonText={t.viewProfile}
                      onClick={() =>
                        setActiveTab("profile")
                      }
                    />

                  </div>

                </div>

                {/* =========================
                    RECENT ACTIVITY
                ========================= */}

                <div className="space-y-4">

                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {t.recentActivity}
                  </h3>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">

                    <div>

                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        {t.lastConsultation}
                      </span>

                      {dashboardData?.lastConsultation ? (

                        <>

                          <h5 className="text-xs font-bold text-slate-800 mt-1">

                            {new Date(
                              dashboardData.lastConsultation.createdAt
                            ).toLocaleDateString()}

                          </h5>

                          <p className="text-xs text-slate-500">
                            {dashboardData.lastConsultation.hospitalName}
                          </p>

                        </>

                      ) : (

                        <p className="text-xs text-slate-400 mt-2">
                          {t.noPreviousConsultation}
                        </p>

                      )}

                    </div>

                    <div>

                      <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                        AI Summary
                      </span>

                      {dashboardData?.lastConsultation?.aiSummary ? (

                        <>

                          <h5 className="text-xs font-bold text-slate-800 mt-1">
                            Latest consultation summary
                          </h5>

                          <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap line-clamp-4">
                            {dashboardData.lastConsultation.aiSummary.fullSummary ||
                              dashboardData.lastConsultation.aiSummary.overview ||
                              dashboardData.lastConsultation.aiSummary.summary ||
                              "AI summary is available."}
                          </p>

                        </>

                      ) : (

                        <p className="text-xs text-slate-400 mt-2">
                          No AI summary generated yet.
                        </p>

                      )}

                    </div>

                    <div>

                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        {t.nextAppointment}
                      </span>

                      {dashboardData?.upcomingAppointment ? (

                        <>

                          <h5 className="text-xs font-bold text-slate-800 mt-1">

                            {new Date(
                              dashboardData.upcomingAppointment.appointmentDate
                            ).toLocaleString()}

                          </h5>

                          <p className="text-xs text-slate-500">
                            {dashboardData.upcomingAppointment.hospitalName}
                          </p>

                        </>

                      ) : (

                        <p className="text-xs text-slate-400 mt-2">
                          {t.noUpcomingAppointment}
                        </p>

                      )}

                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">

                      <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">

                        <span>
                          🌿
                        </span>

                        <span>
                          {t.ashaLinked}
                        </span>

                      </div>

                      <p className="text-[11px] text-slate-600">
                        {t.ashaDescription}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* =========================
                  DOCUMENT MANAGEMENT
              ========================= */}

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                  <div>

                    <h3 className="text-lg font-bold text-slate-800">
                      {t.reportsTitle}
                    </h3>

                    <p className="text-xs text-slate-500">
                      {t.documentsDescription}
                    </p>

                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">

                    <div className="relative flex-1 md:w-64">

                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) =>
                          setSearchQuery(e.target.value)
                        }
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />

                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 bg-[#084832] text-white text-xs font-bold px-4 py-2 rounded-xl">

                      <Upload className="w-3.5 h-3.5" />

                      <span>
                        {t.uploadDoc}
                      </span>

                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                    </label>

                  </div>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full text-left text-xs text-slate-600">

                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px]">

                      <tr>

                        <th className="py-3 px-4">
                          {t.documentName}
                        </th>

                        <th className="py-3 px-4">
                          {t.type}
                        </th>

                        <th className="py-3 px-4">
                          {t.date}
                        </th>

                        <th className="py-3 px-4">
                          {t.doctorSource}
                        </th>

                        <th className="py-3 px-4 text-right">
                          {t.actions}
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredDocs.length > 0 ? (

                        filteredDocs.map((doc) => (

                          <tr key={doc.id}>

                            <td className="py-3.5 px-4">
                              {doc.name}
                            </td>

                            <td className="py-3.5 px-4">
                              {doc.type}
                            </td>

                            <td className="py-3.5 px-4">
                              {doc.date}
                            </td>

                            <td className="py-3.5 px-4">
                              {doc.doctor}
                            </td>

                            <td className="py-3.5 px-4 text-right">

                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `${API_BASE_URL.replace(
                                      /\/api\/?$/,
                                      ""
                                    )}${doc.fileUrl}`,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                title={t.view}
                                className="mr-3"
                              >

                                <Eye className="w-3.5 h-3.5" />

                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `${API_BASE_URL.replace(
                                      /\/api\/?$/,
                                      ""
                                    )}${doc.fileUrl}`,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                title={t.download}
                              >

                                <Download className="w-3.5 h-3.5" />

                              </button>

                            </td>

                          </tr>

                        ))

                      ) : (

                        <tr>

                          <td
                            colSpan="5"
                            className="py-8 text-center text-slate-400"
                          >
                            {t.noDocuments}
                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          )}

        </main>

      </div>

    </div>
  );
}

/* =========================
   REUSABLE SERVICE CARD
========================= */

function ServiceCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition group">

      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">

        <Icon className="w-5 h-5" />

      </div>

      <h4 className="text-sm font-bold text-slate-800">
        {title}
      </h4>

      <p className="text-xs text-slate-500 mt-1">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1"
      >

        <span>
          {buttonText}
        </span>

        <ArrowRight className="w-3 h-3" />

      </button>

    </div>
  );
}