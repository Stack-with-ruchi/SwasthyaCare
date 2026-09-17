import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  Eye,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function PatientsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getDoctorSession = () => {
    try {
      return JSON.parse(
        localStorage.getItem("ayush_doctor_session") || "null"
      );
    } catch (error) {
      console.error("Invalid doctor session:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const doctorSession = getDoctorSession();
      const doctorIdentifier = doctorSession?.id;

      if (!doctorIdentifier) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/patients?identifier=${encodeURIComponent(
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
          data.message || "Failed to load patients."
        );
      }

      setPatients(data.patients || []);
    } catch (error) {
      console.error("Fetch Patients Error:", error);
      setError(
        error.message || "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.fullName?.toLowerCase().includes(search) ||
        patient.abhaId?.toLowerCase().includes(search) ||
        patient.mobile?.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search)
      );
    });
  }, [patients, searchTerm]);

  const handleViewPatient = (patient) => {
    navigate(`/doctor/patient/${patient.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Patients
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Patients assigned to you through AyushCare
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
            <Users className="h-4 w-4 text-emerald-600" />

            <span className="text-sm font-semibold text-emerald-700">
              {patients.length} Patients
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search by name, ABHA ID, mobile or email..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />

            <p className="text-sm text-slate-500">
              Loading assigned patients...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />

            <div>
              <h3 className="font-semibold text-red-700">
                Unable to load patients
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {error}
              </p>

              <button
                onClick={fetchPatients}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        !error &&
        filteredPatients.length === 0 && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <UserRound className="h-7 w-7 text-emerald-500" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-700">
              {patients.length === 0
                ? "No patients assigned yet"
                : "No matching patients"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              {patients.length === 0
                ? "Patients will appear here when a case is assigned to you."
                : "Try searching with a different name, ABHA ID, mobile number or email."}
            </p>
          </div>
        )}

      {/* Desktop Table */}
      {!loading &&
        !error &&
        filteredPatients.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50/70">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600">
                      Patient
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600">
                      ABHA ID
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600">
                      Latest Case
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                            <UserRound className="h-5 w-5 text-emerald-600" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {patient.fullName ||
                                "Unknown Patient"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {patient.gender ||
                                "Gender not available"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {patient.abhaId || "Not available"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {patient.mobile || "No mobile"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {patient.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {patient.latestCaseDate
                            ? new Date(
                                patient.latestCaseDate
                              ).toLocaleDateString()
                            : "Not available"}
                        </p>

                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          {patient.doctorAction || "Pending"}
                        </span>

                        {patient.latestCaseSummary && (
                          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500 line-clamp-3">
                            {patient.latestCaseSummary}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            handleViewPatient(patient)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Mobile Cards */}
      {!loading &&
        !error &&
        filteredPatients.length > 0 && (
          <div className="space-y-3 md:hidden">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                      <UserRound className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {patient.fullName ||
                          "Unknown Patient"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {patient.gender ||
                          "Gender not available"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    {patient.doctorAction || "Pending"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      ABHA ID
                    </span>

                    <span className="text-xs font-medium text-slate-600">
                      {patient.abhaId || "Not available"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Mobile
                    </span>

                    <span className="text-xs font-medium text-slate-600">
                      {patient.mobile || "No mobile"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Latest Case
                    </span>

                    <span className="text-xs font-medium text-slate-600">
                      {patient.latestCaseDate
                        ? new Date(
                            patient.latestCaseDate
                          ).toLocaleDateString()
                        : "Not available"}
                    </span>
                  </div>

                  {patient.latestCaseSummary && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Case Summary
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {patient.latestCaseSummary}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    handleViewPatient(patient)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Eye className="h-4 w-4" />
                  View Patient
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}