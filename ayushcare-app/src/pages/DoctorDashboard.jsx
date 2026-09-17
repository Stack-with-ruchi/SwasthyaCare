import React, { useEffect, useState } from "react";

import DoctorSidebar from "../components/Doctor/DoctorSidebar";
import DoctorHeader from "../components/Doctor/DoctorHeader";
import DashboardStats from "../components/Doctor/DashboardStats";
import RecentCases from "../components/Doctor/RecentCases";
import TodayAppointments from "../components/Doctor/TodayAppointments";
import QuickActions from "../components/Doctor/QuickActions";
import PatientsPage from "../components/Doctor/PatientsPage";

const API_URL = "http://localhost:5000/api";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);

  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingCases: 0,
    availableAiSummaries: 0,
    totalPatients: 0,
  });

  const [recentCases, setRecentCases] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // DOCTOR SESSION
  // ========================================

  const getDoctorSession = () => {
    try {
      const session = JSON.parse(
        localStorage.getItem("ayush_doctor_session") || "null"
      );

      return session;
    } catch (error) {
      console.error("Invalid doctor session:", error);
      return null;
    }
  };

  // ========================================
  // FETCH DOCTOR APPOINTMENTS
  // ========================================

  const fetchDoctorAppointments = async (doctorIdentifier) => {
    try {
      const response = await fetch(
        `${API_URL}/appointments/doctor-appointments?identifier=${encodeURIComponent(
          doctorIdentifier
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch doctor appointments."
        );
      }

      setTodayAppointments(data?.appointments || []);
    } catch (error) {
      console.error("Doctor appointments error:", error);

      // Don't break the whole dashboard if appointments fail
      setTodayAppointments([]);
    }
  };

  // ========================================
  // ACCEPT APPOINTMENT
  // Doctor selects ONLY consultation time
  // ========================================

  const handleAcceptAppointment = async (
    appointmentId,
    appointmentTime
  ) => {
    try {
      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      // Doctor must select consultation time
      if (!appointmentTime) {
        alert(
          "Please select a consultation time before accepting."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/accept`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            identifier: session.id,
            appointmentTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to accept appointment."
        );
      }

      alert(
        "Appointment accepted and consultation time scheduled successfully."
      );

      // Refresh appointments
      await fetchDoctorAppointments(session.id);

      // Refresh dashboard stats and recent cases
      await fetchDashboard();
    } catch (error) {
      console.error(
        "Accept appointment error:",
        error
      );

      alert(
        error.message ||
          "Failed to accept appointment."
      );
    }
  };

  // ========================================
  // REJECT APPOINTMENT
  // ========================================

  const handleRejectAppointment = async (appointmentId) => {
    try {
      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/reject`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            identifier: session.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to reject appointment."
        );
      }

      alert("Appointment rejected.");

      // Refresh appointments
      await fetchDoctorAppointments(session.id);

      // Refresh dashboard stats and recent cases
      await fetchDashboard();
    } catch (error) {
      console.error(
        "Reject appointment error:",
        error
      );

      alert(
        error.message ||
          "Failed to reject appointment."
      );
    }
  };

  // ========================================
  // FETCH DOCTOR DASHBOARD
  // ========================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const doctorIdentifier = session.id;

      // ----------------------------------------
      // Fetch dashboard data
      // ----------------------------------------

      const response = await fetch(
        `${API_URL}/doctor/dashboard?identifier=${encodeURIComponent(
          doctorIdentifier
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load doctor dashboard."
        );
      }

      // ----------------------------------------
      // Doctor
      // ----------------------------------------

      setDoctor(data?.doctor || null);

      // ----------------------------------------
      // Dashboard statistics
      // ----------------------------------------

      setStats({
        todayAppointments:
          data?.stats?.todayAppointments || 0,

        pendingCases:
          data?.stats?.pendingCases || 0,

        availableAiSummaries:
          data?.stats?.availableAiSummaries || 0,

        totalPatients:
          data?.stats?.totalPatients || 0,
      });

      // ----------------------------------------
      // Recent cases
      // ----------------------------------------

      setRecentCases(
        data?.recentCases || []
      );

      // ----------------------------------------
      // Doctor appointments
      // ----------------------------------------

      await fetchDoctorAppointments(
        doctorIdentifier
      );
    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while loading dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "ayush_doctor_session"
    );

    window.location.href =
      "/doctor/login";
  };

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (
      normalizedStatus.includes("accepted") ||
      normalizedStatus.includes("confirmed") ||
      normalizedStatus.includes("completed")
    ) {
      return "bg-emerald-50 text-emerald-700";
    }

    if (
      normalizedStatus.includes("pending")
    ) {
      return "bg-amber-50 text-amber-700";
    }

    if (
      normalizedStatus.includes("rejected") ||
      normalizedStatus.includes("cancelled")
    ) {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-50 text-slate-600";
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>

          <p className="text-sm font-semibold text-slate-600">
            Loading doctor dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN LAYOUT
  // ========================================

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}

      <DoctorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        doctor={doctor}
        handleLogout={handleLogout}
      />

      {/* RIGHT SIDE */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* HEADER */}

        <DoctorHeader
          doctor={doctor}
          setActiveTab={setActiveTab}
        />

        {/* MAIN CONTENT */}

        <main className="flex-1 overflow-y-auto p-6">

          {/* ERROR */}

          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>

              <button
                onClick={fetchDashboard}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* =========================================
              DASHBOARD
          ========================================= */}

          {activeTab === "dashboard" && (
            <>
              {/* PAGE HEADER */}

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Doctor Dashboard
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Welcome back,{" "}
                    {doctor?.fullName ||
                      "Doctor"}
                  </p>
                </div>

                <button
                  onClick={fetchDashboard}
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  Refresh
                </button>
              </div>

              {/* STATS */}

              <DashboardStats
                stats={stats}
              />

              {/* RECENT CASES + APPOINTMENTS */}

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

                <RecentCases
                  cases={recentCases}
                  searchTerm={searchTerm}
                  setSearchTerm={
                    setSearchTerm
                  }
                  setActiveTab={
                    setActiveTab
                  }
                />

                <TodayAppointments
                  appointments={
                    todayAppointments
                  }
                  doctor={doctor}
                  getStatusClass={
                    getStatusClass
                  }
                  setActiveTab={
                    setActiveTab
                  }
                  onAccept={
                    handleAcceptAppointment
                  }
                  onReject={
                    handleRejectAppointment
                  }
                />

              </div>

              {/* QUICK ACTIONS */}

              <div className="mt-6">
                <QuickActions
                  setActiveTab={
                    setActiveTab
                  }
                />
              </div>
            </>
          )}

          {/* =========================================
              PATIENTS
          ========================================= */}

          {activeTab === "patients" && (
            <PatientsPage />
          )}

          {/* =========================================
              APPOINTMENTS
          ========================================= */}

          {activeTab === "appointments" && (
            <>
              <PageHeader
                title="Appointments"
                description="View and manage your appointments."
              />

              <TodayAppointments
                appointments={
                  todayAppointments
                }
                doctor={doctor}
                getStatusClass={
                  getStatusClass
                }
                setActiveTab={
                  setActiveTab
                }
                onAccept={
                  handleAcceptAppointment
                }
                onReject={
                  handleRejectAppointment
                }
              />
            </>
          )}

          {/* =========================================
              CASES
          ========================================= */}

          {activeTab === "cases" && (
            <>
              <PageHeader
                title="Recent Cases"
                description="View and manage your assigned patient cases."
              />

              <RecentCases
                cases={recentCases}
                searchTerm={searchTerm}
                setSearchTerm={
                  setSearchTerm
                }
                setActiveTab={
                  setActiveTab
                }
              />
            </>
          )}

          {/* =========================================
              ABHA SEARCH
          ========================================= */}

          {activeTab === "abha-search" && (
            <PagePlaceholder
              title="ABHA Search"
              description="Search and access authorized ABHA-linked patient information."
            />
          )}

          {/* =========================================
              SETTINGS
          ========================================= */}

          {activeTab === "settings" && (
            <PagePlaceholder
              title="Settings"
              description="Manage your doctor profile and dashboard settings."
            />
          )}

        </main>
      </div>
    </div>
  );
}

// ========================================
// PAGE HEADER
// ========================================

function PageHeader({
  title,
  description,
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800">
        {title}
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

// ========================================
// PAGE PLACEHOLDER
// ========================================

function PagePlaceholder({
  title,
  description,
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <span className="text-xl text-emerald-600">
            +
          </span>
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          {title}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {description}
        </p>

        <p className="mt-4 text-xs font-medium text-slate-400">
          This section will be available soon.
        </p>

      </div>
    </div>
  );
}