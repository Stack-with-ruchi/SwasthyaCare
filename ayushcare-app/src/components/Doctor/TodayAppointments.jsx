import React, { useState } from "react";
import {
  Calendar,
  Clock,
  UserRound,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

export default function TodayAppointments({
  appointments = [],
  doctor,
  getStatusClass,
  setActiveTab,
  onAccept,
  onReject,
}) {
  // Store selected consultation time for each request
  const [selectedTimes, setSelectedTimes] = useState({});

  // ========================================
  // UPDATE CONSULTATION TIME
  // ========================================

  const handleTimeChange = (appointmentId, time) => {
    setSelectedTimes((prev) => ({
      ...prev,
      [appointmentId]: time,
    }));
  };

  // ========================================
  // ACCEPT
  // ========================================

  const handleAccept = (appointmentId) => {
    const selectedTime = selectedTimes[appointmentId];

    if (!selectedTime) {
      alert("Please select a consultation time.");
      return;
    }

    // Send ONLY consultation time
    onAccept?.(appointmentId, selectedTime);
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="flex items-center justify-between mb-5">

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Case Requests
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Review patient case requests and schedule consultation time.
          </p>
        </div>

        <button
          onClick={() =>
            setActiveTab?.("appointments")
          }
          className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          View All

          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

      {/* ========================================
          EMPTY STATE
      ======================================== */}

      {appointments.length === 0 ? (
        <div className="py-10 text-center">

          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />

          <p className="text-sm font-medium text-slate-600">
            No case requests found.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            New patient case requests will appear here.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {appointments.map((appointment) => {

            const patient =
              appointment?.patientId;

            const patientName =
              patient?.fullName || "Patient";

            const patientMobile =
              patient?.mobile ||
              "Mobile not available";

            const status =
              appointment?.status || "Pending";

            const selectedTime =
              selectedTimes[appointment._id] || "";

            return (
              <div
                key={appointment._id}
                className="border border-slate-200 rounded-xl p-4 hover:border-emerald-200 transition-colors"
              >

                {/* ========================================
                    TOP ROW
                ======================================== */}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                  {/* PATIENT */}

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <UserRound className="w-5 h-5 text-emerald-700" />
                    </div>

                    <div>

                      <h3 className="font-bold text-slate-800">
                        {patientName}
                      </h3>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {patientMobile}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Department:{" "}
                        <span className="font-medium text-slate-700">
                          {appointment.department ||
                            "Not available"}
                        </span>
                      </p>

                    </div>

                  </div>

                  {/* STATUS */}

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full self-start ${
                      getStatusClass
                        ? getStatusClass(status)
                        : status === "Accepted"
                        ? "text-emerald-700 bg-emerald-100"
                        : status === "Rejected"
                        ? "text-red-700 bg-red-100"
                        : "text-amber-700 bg-amber-100"
                    }`}
                  >
                    {status}
                  </span>

                </div>

                {/* ========================================
                    CASE / REQUEST DETAILS
                ======================================== */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">

                  {/* REQUEST DATE */}

                  <div className="flex items-center gap-2 text-xs text-slate-500">

                    <Calendar className="w-4 h-4 text-emerald-600" />

                    <div>
                      <p className="font-medium text-slate-700">
                        Request Date
                      </p>

                      <p>
                        {formatDate(
                          appointment.requestDate ||
                          appointment.createdAt
                        )}
                      </p>
                    </div>

                  </div>

                  {/* REQUEST TIME */}

                  <div className="flex items-center gap-2 text-xs text-slate-500">

                    <Clock className="w-4 h-4 text-emerald-600" />

                    <div>
                      <p className="font-medium text-slate-700">
                        Request Time
                      </p>

                      <p>
                        {appointment.requestTime ||
                          "Not available"}
                      </p>
                    </div>

                  </div>

                  {/* TOKEN */}

                  <div className="text-xs text-slate-500">

                    <p className="font-medium text-slate-700">
                      Token
                    </p>

                    <p className="mt-0.5">
                      {appointment.tokenNumber ||
                        "Not available"}
                    </p>

                  </div>

                  {/* HOSPITAL */}

                  <div className="text-xs text-slate-500">

                    <p className="font-medium text-slate-700">
                      Hospital / Clinic
                    </p>

                    <p className="mt-0.5 truncate">
                      {appointment.hospitalName ||
                        "Not available"}
                    </p>

                  </div>

                </div>

                {/* ========================================
                    REASON
                ======================================== */}

                {appointment.reason && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-3">

                    <p className="text-xs font-semibold text-slate-700">
                      Reason for Visit
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {appointment.reason}
                    </p>

                  </div>
                )}

                {/* ========================================
                    CONSULTATION TIME
                ======================================== */}

                {status === "Pending" && (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">

                    <div className="mb-3">

                      <p className="text-sm font-bold text-slate-800">
                        Schedule Consultation
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Select the time when you can consult this patient.
                      </p>

                    </div>

                    <div className="max-w-sm">

                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Consultation Time
                      </label>

                      <div className="relative">

                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />

                        <input
                          type="time"
                          value={selectedTime}
                          onChange={(e) =>
                            handleTimeChange(
                              appointment._id,
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                      </div>

                    </div>

                  </div>
                )}

                {/* ========================================
                    ACCEPTED APPOINTMENT
                ======================================== */}

                {status === "Accepted" && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4">

                    <p className="text-sm font-bold text-emerald-800">
                      Consultation Scheduled
                    </p>

                    <div className="flex flex-wrap gap-5 mt-2">

                      <div className="flex items-center gap-2">

                        <Calendar className="w-4 h-4 text-emerald-700" />

                        <div>
                          <p className="text-[11px] text-slate-500">
                            Consultation Date
                          </p>

                          <p className="text-xs font-semibold text-slate-700">
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </p>
                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <Clock className="w-4 h-4 text-emerald-700" />

                        <div>
                          <p className="text-[11px] text-slate-500">
                            Consultation Time
                          </p>

                          <p className="text-xs font-semibold text-slate-700">
                            {appointment.appointmentTime ||
                              "Not available"}
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* ========================================
                    ACTION BUTTONS
                ======================================== */}

                {status === "Pending" && (
                  <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-slate-100">

                    {/* REJECT */}

                    <button
                      onClick={() =>
                        onReject?.(
                          appointment._id
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold"
                    >
                      <X className="w-4 h-4" />

                      Reject
                    </button>

                    {/* ACCEPT */}

                    <button
                      onClick={() =>
                        handleAccept(
                          appointment._id
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                      <Check className="w-4 h-4" />

                      Accept & Schedule
                    </button>

                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}