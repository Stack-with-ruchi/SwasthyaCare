import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  ArrowRight,
  FileText,
} from "lucide-react";

export default function RecentCases({
  cases = [],
  searchTerm,
  setSearchTerm,
  setActiveTab,
}) {
  const navigate = useNavigate();
  const filteredCases = cases.filter((item) => {
    if (!searchTerm?.trim()) return true;

    const search = searchTerm.toLowerCase();

    const patientName =
      item?.patient?.fullName ||
      item?.patient?.name ||
      "";

    const abhaId =
      item?.patient?.abhaId ||
      item?.patient?.abhaNumber ||
      "";

    const mobile =
      item?.patient?.mobile ||
      item?.patient?.phone ||
      "";

    const tokenNumber =
      item?.tokenNumber || "";

    const department =
      item?.department || "";

    return (
      String(patientName).toLowerCase().includes(search) ||
      String(abhaId).toLowerCase().includes(search) ||
      String(mobile).toLowerCase().includes(search) ||
      String(tokenNumber).toLowerCase().includes(search) ||
      String(department).toLowerCase().includes(search)
    );
  });

  const getPatientName = (item) =>
    item?.patient?.fullName ||
    item?.patient?.name ||
    "Unknown Patient";

  const getPatientAbha = (item) =>
    item?.patient?.abhaId ||
    item?.patient?.abhaNumber ||
    "Not available";

  const getSummaryText = (item) => {
    return (
      item?.aiSummary?.overview ||
      item?.aiSummary?.summary ||
      item?.aiSummary?.fullSummary ||
      item?.doctorEditedSummary ||
      item?.latestCaseSummary ||
      ""
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Accepted":
      case "Confirmed":
      case "Completed":
        return "bg-emerald-50 text-emerald-700";

      case "Pending":
        return "bg-amber-50 text-amber-700";

      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Recent Cases
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            Recently assigned patient cases
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative w-full sm:w-64">

          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={searchTerm || ""}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search patient..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-400 focus:bg-white"
          />

        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full min-w-[650px]">

          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left">

              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Patient
              </th>

              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                ABHA
              </th>

              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Department / Token
              </th>

              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Status
              </th>

              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Action
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredCases.length === 0 ? (

              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-10 text-center"
                >

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <FileText className="h-5 w-5 text-slate-300" />
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    No cases found
                  </p>

                </td>
              </tr>

            ) : (

              filteredCases.slice(0, 6).map((item) => (

                <tr
                  key={item?._id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >

                  {/* PATIENT */}
                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                        <UserRound className="h-4 w-4 text-emerald-600" />
                      </div>

                      <div>

                        <p className="text-xs font-bold text-slate-700">
                          {getPatientName(item)}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Patient
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* ABHA */}
                  <td className="px-5 py-4">

                    <span className="text-[11px] font-medium text-slate-600">
                      {getPatientAbha(item)}
                    </span>

                  </td>

                  {/* DEPARTMENT */}
                  <td className="px-5 py-4">

                    <p className="text-[11px] font-semibold text-slate-700">
                      {item?.department || "General"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Token: {item?.tokenNumber || "—"}
                    </p>

                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                        item?.doctorAction
                      )}`}
                    >
                      {item?.doctorAction || "Pending"}
                    </span>

                    {getSummaryText(item) && (
                      <p className="mt-2 max-w-[240px] text-[10px] leading-4 text-slate-500">
                        {getSummaryText(item)}
                      </p>
                    )}

                  </td>

                  {/* ACTION */}
                  <td className="px-5 py-4">

                    <button
                      onClick={() =>
                        item?._id
                          ? navigate(`/doctor/case/${item._id}`)
                          : setActiveTab("cases")
                      }
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Open Case Details

                      <ArrowRight className="h-3 w-3" />
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

      {/* FOOTER */}
      {filteredCases.length > 0 && (

        <div className="flex justify-end border-t border-slate-100 p-4">

          <button
            onClick={() =>
              setActiveTab("cases")
            }
            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            View all cases

            <ArrowRight className="h-3 w-3" />
          </button>

        </div>

      )}

    </div>
  );
}