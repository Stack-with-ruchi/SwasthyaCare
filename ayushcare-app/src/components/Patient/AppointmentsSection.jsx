import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  UserRound,
  Building2,
  Stethoscope,
  FileText,
  Hash,
  CircleCheck,
  CircleX,
  Clock,
  Ban,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../../utils/api";

export default function AppointmentsSection() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("patient_token");

      if (!token) {
        setError("Patient login session not found.");
        setAppointments([]);
        return;
      }

      const data = await apiRequest("/appointments/my-appointments", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const appointmentList = Array.isArray(data)
        ? data
        : data?.appointments || data?.data || [];

      setAppointments(appointmentList);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setError(
        err?.message || "Failed to load appointments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not scheduled";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not scheduled";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRequestDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-50 text-green-700 border-green-200";

      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";

      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";

      case "Pending":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted":
        return <CircleCheck size={15} />;

      case "Rejected":
        return <CircleX size={15} />;

      case "Completed":
        return <CircleCheck size={15} />;

      case "Cancelled":
        return <Ban size={15} />;

      case "Pending":
      default:
        return <Clock size={15} />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "Accepted":
        return "Your case request has been accepted by the doctor.";

      case "Rejected":
        return "Your case request was rejected by the doctor.";

      case "Completed":
        return "Your consultation has been completed.";

      case "Cancelled":
        return "This appointment has been cancelled.";

      case "Pending":
      default:
        return "Your case request is waiting for doctor confirmation.";
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your consultation appointments and case summaries.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center">
          <RefreshCw
            size={28}
            className="text-slate-400 animate-spin mb-3"
          />

          <p className="text-sm text-slate-500">
            Loading your appointments...
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your consultation appointments and case summaries.
          </p>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <CircleX
              size={22}
              className="text-red-500 mt-0.5 shrink-0"
            />

            <div>
              <h3 className="font-semibold text-red-700">
                Unable to load appointments
              </h3>

              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchAppointments}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // Empty State
  // --------------------------------------------------

  if (appointments.length === 0) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your consultation appointments and case summaries.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
            <CalendarDays
              size={28}
              className="text-slate-400"
            />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-800">
            No appointments yet
          </h3>

          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Submit a case request from the Case Taking section.
            Once a doctor accepts your request, your consultation
            details will appear here.
          </p>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // Appointment List
  // --------------------------------------------------

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your consultation appointments and case summaries.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAppointments}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-5">
        {appointments.map((appointment) => {
          const doctor =
            appointment.doctorId &&
            typeof appointment.doctorId === "object"
              ? appointment.doctorId
              : null;

          const tokenCase =
            appointment.tokenCaseId &&
            typeof appointment.tokenCaseId === "object"
              ? appointment.tokenCaseId
              : null;

          const status = appointment.status || "Pending";

          return (
            <article
              key={appointment._id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Top Section */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <CalendarDays
                          size={20}
                          className="text-slate-600"
                        />
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-800">
                          Consultation Appointment
                        </h2>

                        <p className="text-xs text-slate-500">
                          Case Request
                          {tokenCase?.crNumber
                            ? ` • ${tokenCase.crNumber}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full border text-xs font-semibold ${getStatusClass(
                      status
                    )}`}
                  >
                    {getStatusIcon(status)}
                    {status}
                  </div>
                </div>

                {/* Status Message */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    {getStatusMessage(status)}
                  </p>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Request Date */}
                  <InfoItem
                    icon={<CalendarDays size={17} />}
                    label="Request Date"
                    value={formatRequestDate(
                      appointment.requestDate
                    )}
                  />

                  {/* Request Time */}
                  <InfoItem
                    icon={<Clock3 size={17} />}
                    label="Request Time"
                    value={appointment.requestTime || "—"}
                  />

                  {/* Consultation Date */}
                  <InfoItem
                    icon={<CalendarDays size={17} />}
                    label="Consultation Date"
                    value={
                      appointment.appointmentDate
                        ? formatDate(
                            appointment.appointmentDate
                          )
                        : "Not scheduled"
                    }
                  />

                  {/* Consultation Time */}
                  <InfoItem
                    icon={<Clock3 size={17} />}
                    label="Consultation Time"
                    value={
                      appointment.appointmentTime ||
                      "Not scheduled"
                    }
                  />
                </div>

                {/* Doctor Information */}
                {doctor && (
                  <div className="mt-5 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <UserRound
                          size={18}
                          className="text-slate-600"
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-slate-800">
                          Doctor Details
                        </h3>

                        <p className="text-xs text-slate-500">
                          Assigned healthcare professional
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <InfoItem
                        icon={<UserRound size={16} />}
                        label="Doctor"
                        value={doctor.fullName || "—"}
                      />

                      <InfoItem
                        icon={<Stethoscope size={16} />}
                        label="Specialization"
                        value={
                          doctor.specialization || "—"
                        }
                      />

                      <InfoItem
                        icon={<Building2 size={16} />}
                        label="Hospital / Clinic"
                        value={
                          doctor.hospitalClinic || "—"
                        }
                      />

                      <InfoItem
                        icon={<FileText size={16} />}
                        label="Department"
                        value={doctor.department || "—"}
                      />
                    </div>
                  </div>
                )}

                {/* Case Summary */}
                <div className="mt-5 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText
                        size={18}
                        className="text-slate-600"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Case Summary
                      </h3>

                      <p className="text-xs text-slate-500">
                        Information submitted during case taking
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem
                      icon={<Hash size={16} />}
                      label="Token Number"
                      value={
                        appointment.tokenNumber ||
                        tokenCase?.tokenNumber ||
                        "—"
                      }
                    />

                    <InfoItem
                      icon={<Building2 size={16} />}
                      label="Hospital / Clinic"
                      value={
                        appointment.hospitalName ||
                        tokenCase?.hospitalName ||
                        "—"
                      }
                    />

                    <InfoItem
                      icon={<Stethoscope size={16} />}
                      label="Department"
                      value={
                        appointment.department ||
                        tokenCase?.department ||
                        "—"
                      }
                    />
                  </div>

                  {/* Reason */}
                  {appointment.reason && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Case Reason
                      </p>

                      <p className="text-sm text-slate-700">
                        {appointment.reason}
                      </p>
                    </div>
                  )}

                  {/* AI Summary */}
                  {tokenCase?.aiSummary && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        AI Case Summary
                      </p>

                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {tokenCase.aiSummary.fullSummary ||
                          tokenCase.aiSummary.overview ||
                          tokenCase.aiSummary.summary ||
                          "AI summary is available."}
                      </p>
                    </div>
                  )}

                  {/* Summary Status */}
                  {tokenCase?.summaryStatus && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500">
                        Summary Status
                      </p>

                      <p className="text-sm text-slate-700 mt-1">
                        {tokenCase.summaryStatus}
                      </p>
                    </div>
                  )}
                </div>

                {/* Doctor Notes */}
                {appointment.doctorNotes && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Doctor Notes
                    </p>

                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                      {appointment.doctorNotes}
                    </p>
                  </div>
                )}

                {/* Consent Confirmation */}
                {tokenCase?.dataConsent?.status ===
                  "Confirmed" && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <CircleCheck
                      size={19}
                      className="text-green-600 mt-0.5 shrink-0"
                    />

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Data consent confirmed
                      </p>

                      <p className="text-xs text-green-700 mt-1">
                        Your consent was provided during Case Taking.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// --------------------------------------------------
// Reusable Information Item
// --------------------------------------------------

function InfoItem({ icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-slate-500 mb-1.5">
        <span className="shrink-0">{icon}</span>

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800 break-words">
        {value || "—"}
      </p>
    </div>
  );
}