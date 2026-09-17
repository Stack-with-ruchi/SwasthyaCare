import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
ArrowLeft,
Calendar,
Clock,
User,
Building2,
Stethoscope,
FileText,
Hash,
Loader2,
AlertCircle,
} from "lucide-react";

import { apiRequest } from "../utils/api";
import { useTranslation } from "../hooks/useTranslation";

const ENGLISH_APPOINTMENT_DETAILS_TEXT = {
title: "Appointment Details",
backToAppointments: "Back to Appointments",

loading: "Loading appointment details...",

appointmentNotFound:
"Appointment details could not be found.",

failedToLoad:
"Failed to load appointment details.",

doctor: "Doctor",
hospital: "Hospital",
department: "Department",
date: "Date",
time: "Time",
status: "Status",

reason: "Reason for Appointment",
doctorNotes: "Doctor Notes",

tokenNumber: "Token Number",

notAssigned: "Not Assigned",

noReason: "No reason provided.",

noDoctorNotes:
"No doctor notes available.",

pending: "Pending",
confirmed: "Confirmed",
completed: "Completed",
cancelled: "Cancelled",
};

export default function AppointmentDetails() {
const { appointmentId } = useParams();
const navigate = useNavigate();

// Same translation system used in PatientLogin
const { t } = useTranslation(
ENGLISH_APPOINTMENT_DETAILS_TEXT
);

const [appointment, setAppointment] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// Load appointment details
useEffect(() => {
const loadAppointment = async () => {
const token =
localStorage.getItem("patient_token");


  if (!token) {
    setError(
      ENGLISH_APPOINTMENT_DETAILS_TEXT.appointmentNotFound
    );

    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError("");

    const data = await apiRequest(
      `/appointments/${appointmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      data.success &&
      data.appointment
    ) {
      setAppointment(data.appointment);
    } else {
      setError(
        ENGLISH_APPOINTMENT_DETAILS_TEXT.appointmentNotFound
      );
    }
  } catch (error) {
    console.error(
      "Failed to load appointment:",
      error
    );

    setError(
      ENGLISH_APPOINTMENT_DETAILS_TEXT.failedToLoad
    );
  } finally {
    setLoading(false);
  }
};

loadAppointment();


}, [appointmentId]);

// Status badge styling
const getStatusStyle = (status) => {
switch (status) {
case "Confirmed":
return "bg-emerald-100 text-emerald-700";


  case "Completed":
    return "bg-blue-100 text-blue-700";

  case "Cancelled":
    return "bg-red-100 text-red-700";

  default:
    return "bg-amber-100 text-amber-700";
}

};

// Format appointment date
const formatDate = (date) => {
if (!date) return "-";


return new Date(
  date
).toLocaleDateString();


};

// Translate appointment status
const getTranslatedStatus = (status) => {
switch (status) {
case "Confirmed":
return t.confirmed;


  case "Completed":
    return t.completed;

  case "Cancelled":
    return t.cancelled;

  default:
    return t.pending;
}


};

// Loading screen
if (loading) {
return ( <div className="min-h-screen bg-slate-50 flex items-center justify-center"> <div className="flex items-center gap-3 text-emerald-700"> <Loader2 className="w-6 h-6 animate-spin" />


      <span className="text-sm font-medium">
        {t.loading}
      </span>
    </div>
  </div>
);


}

// Error screen
if (error || !appointment) {
return ( <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"> <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">


      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />

      <p className="text-sm text-slate-600">
        {error || t.appointmentNotFound}
      </p>

      <button
        onClick={() =>
          navigate("/patient/dashboard")
        }
        className="mt-5 inline-flex items-center gap-2 bg-[#084832] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0c533b] transition"
      >
        <ArrowLeft className="w-4 h-4" />

        {t.backToAppointments}
      </button>

    </div>
  </div>
);


}

const doctor = appointment.doctorId;

return ( <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">


  <div className="max-w-4xl mx-auto">

    {/* Back Button */}
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 mb-6"
    >
      <ArrowLeft className="w-4 h-4" />

      {t.backToAppointments}
    </button>

    {/* Header */}
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {t.title}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          {appointment.hospitalName}
        </p>
      </div>

      <span
        className={`w-fit text-xs font-bold px-4 py-2 rounded-full ${getStatusStyle(
          appointment.status
        )}`}
      >
        {getTranslatedStatus(
          appointment.status
        )}
      </span>

    </div>

    {/* Details Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Doctor */}
      <DetailCard
        icon={
          <User className="w-5 h-5" />
        }
        label={t.doctor}
        value={
          doctor?.fullName ||
          t.notAssigned
        }
      />

      {/* Hospital */}
      <DetailCard
        icon={
          <Building2 className="w-5 h-5" />
        }
        label={t.hospital}
        value={
          appointment.hospitalName
        }
      />

      {/* Department */}
      <DetailCard
        icon={
          <Stethoscope className="w-5 h-5" />
        }
        label={t.department}
        value={
          appointment.department
        }
      />

      {/* Date */}
      <DetailCard
        icon={
          <Calendar className="w-5 h-5" />
        }
        label={t.date}
        value={
          formatDate(
            appointment.appointmentDate
          )
        }
      />

      {/* Time */}
      <DetailCard
        icon={
          <Clock className="w-5 h-5" />
        }
        label={t.time}
        value={
          appointment.appointmentTime
        }
      />

      {/* Token Number */}
      {appointment.tokenCaseId?.tokenNumber && (
        <DetailCard
          icon={
            <Hash className="w-5 h-5" />
          }
          label={t.tokenNumber}
          value={
            appointment.tokenCaseId
              .tokenNumber
          }
        />
      )}

    </div>

    {/* Reason */}
    <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      <div className="flex items-center gap-2 text-emerald-700 mb-3">

        <FileText className="w-5 h-5" />

        <h2 className="text-base font-bold">
          {t.reason}
        </h2>

      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {appointment.reason ||
          t.noReason}
      </p>

    </div>

    {/* Doctor Notes */}
    <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      <div className="flex items-center gap-2 text-emerald-700 mb-3">

        <Stethoscope className="w-5 h-5" />

        <h2 className="text-base font-bold">
          {t.doctorNotes}
        </h2>

      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {appointment.doctorNotes ||
          t.noDoctorNotes}
      </p>

    </div>

  </div>
</div>


);
}

function DetailCard({
icon,
label,
value,
}) {
return ( <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">


  <div className="flex items-center gap-2 text-emerald-700 mb-3">

    {icon}

    <span className="text-xs font-bold uppercase tracking-wide">
      {label}
    </span>

  </div>

  <p className="text-sm font-semibold text-slate-800 break-words">
    {value || "-"}
  </p>

</div>


);
}
